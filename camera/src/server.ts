import "dotenv/config";
import express from "express";
import cors from "cors";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import FormData from "form-data";

/**
 * =========================
 * Hackathon constants
 * =========================
 */
const PORT = 5055;
const CAMERA_LOCATION = "CAM_12";

// Use a looping mp4 as the camera feed (stable for hackathon demos)
const VIDEO_INPUT = "./clip.mp4";

// Frame + clip settings
const FPS = 10;               // capture fps into buffer (10 is enough)
const WINDOW_SECS = 3;        // rolling window length for clip

/**
 * =========================
 * Env
 * =========================
 */
const OVERSHOOT_API_KEY = process.env.OVERSHOOT_API_KEY || "ovs_16e2ba18927ea6bfa68cc5bd90048d1f";
const OVERSHOOT_API_URL = process.env.OVERSHOOT_API_URL || "https://cluster1.overshoot.ai/api/v0.2";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

console.log("CWD:", process.cwd());

/**
 * =========================
 * In-memory state
 * =========================
 */
type Frame = { ts: number; jpg: Buffer };

const MAX_FRAMES = FPS * WINDOW_SECS;
let frames: Frame[] = [];

let latestFrame: Buffer | null = null;
let latestFrameTs: number | null = null;

let latestClipPath: string | null = null;
let latestClipTs: number | null = null;

/**
 * =========================
 * Express server
 * =========================
 */
const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

// Latest camera frame as JPEG
app.get("/latest_frame", (_req, res) => {
  if (!latestFrame) return res.status(404).send("No frame yet");
  res.setHeader("Content-Type", "image/jpeg");
  res.setHeader("Cache-Control", "no-store");
  res.send(latestFrame);
});

// Latest clip as MP4
app.get("/latest_clip.mp4", (_req, res) => {
  const clipAbs = path.resolve(process.cwd(), ".latest_clip.mp4");

  // Debug: log the exact path being used
  console.log("Serving clip:", clipAbs);
  console.log("File exists?", fs.existsSync(clipAbs));
  console.log("CWD:", process.cwd());

  if (!fs.existsSync(clipAbs)) {
    return res.status(404).send("No clip yet");
  }

  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Cache-Control", "no-store");

  // Use fs.readFile + res.send instead of sendFile (more reliable)
  try {
    const fileBuffer = fs.readFileSync(clipAbs);
    res.send(fileBuffer);
  } catch (err) {
    console.error("Error reading clip file:", err);
    if (!res.headersSent) {
      res.status(404).send("Error serving clip");
    }
  }
});

// Latest metadata (good for debug + dashboard overlays)
app.get("/latest_state", (_req, res) => {
  res.json({
    cameraLocation: CAMERA_LOCATION,
    latestFrameTs,
    latestClipTs,
    bufferedFrames: frames.length,
  });
});

/**
 * =========================
 * Frame capture (ffmpeg MJPEG -> stdout)
 * =========================
 */
function startFrameCapture() {
  const inputAbs = path.resolve(process.cwd(), VIDEO_INPUT);
  if (!fs.existsSync(inputAbs)) {
    console.error(`VIDEO_INPUT not found: ${inputAbs}`);
    console.error("Place a file at ~/NexHacks/camera/clip.mp4");
    process.exit(1);
  }

  console.log("Starting frame capture from:", inputAbs);

  const ff = spawn("ffmpeg", [
    "-re",                    // read input at its native pace
    "-stream_loop",
    "-1",                     // loop forever (for file sources)
    "-i",
    inputAbs,
    "-vf",
    `fps=${FPS}`,             // sample to FPS
    "-f",
    "mjpeg",                  // output MJPEG stream
    "pipe:1",
  ]);

  // ffmpeg logs go to stderr; keep quiet unless debugging
  ff.stderr.on("data", () => {});

  const SOI = Buffer.from([0xff, 0xd8]); // JPEG start
  const EOI = Buffer.from([0xff, 0xd9]); // JPEG end
  let buf = Buffer.alloc(0);

  ff.stdout.on("data", (chunk: Buffer) => {
    buf = Buffer.concat([buf, chunk]);

    while (true) {
      const start = buf.indexOf(SOI);
      const end = buf.indexOf(EOI);

      if (start === -1 || end === -1 || end < start) break;

      const jpg = buf.slice(start, end + 2);
      buf = buf.slice(end + 2);

      const ts = Date.now();
      latestFrame = jpg;
      latestFrameTs = ts;

      frames.push({ ts, jpg });
      if (frames.length > MAX_FRAMES) frames.shift();
    }
  });

  ff.on("close", (code) => {
    console.error("ffmpeg frame capture exited with code:", code);
    process.exit(1);
  });
}

/**
 * =========================
 * Build mp4 from buffered frames (ffmpeg)
 * =========================
 */
async function buildClipFromFrames(outPath: string, framesToUse: Frame[]) {
  const tmpDir = path.join(process.cwd(), ".tmp_frames");
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir, { recursive: true });

  // Write JPEGs as sequential filenames
  framesToUse.forEach((f, i) => {
    const name = `frame_${String(i).padStart(5, "0")}.jpg`;
    fs.writeFileSync(path.join(tmpDir, name), f.jpg);
  });

  await new Promise<void>((resolve, reject) => {
    const ff = spawn("ffmpeg", [
      "-y",
      "-framerate",
      String(FPS),
      "-i",
      path.join(tmpDir, "frame_%05d.jpg"),
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      outPath,
    ]);

    ff.stderr.on("data", () => {});
    ff.on("error", reject);
    ff.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg clip exit ${code}`))));
  });
}

/**
 * =========================
 * Analysis loop (Overshoot + backend posting)
 * =========================
 */
type Severity = "informational" | "emergency";

let analysisRunning = false;
let lastEmergencyAt = 0;
let lastEmergencyTitle: string | null = null;
let lastEmergencyDescription: string | null = null;

function canSendEmergency(): boolean {
  const now = Date.now();
  if (now - lastEmergencyAt < 30_000) return false;
  lastEmergencyAt = now;
  return true;
}

async function runOvershootAnalysis(clipPath: string): Promise<{ title: string; description: string; severity: Severity } | null> {
  try {
    // Read the clip file
    const clipBuffer = fs.readFileSync(clipPath);
    
    // Create form data for Overshoot API
    const formData = new FormData();
    formData.append("file", clipBuffer, {
      filename: "clip.mp4",
      contentType: "video/mp4",
    });
    
    const prompt = `You are monitoring city security footage.

Return STRICT JSON only:
{
  "title": string,
  "description": string,
  "severity": "informational" | "emergency"
}

Emergency if the clip shows:
- a person collapsing/falling and not recovering
- a person lying motionless on the ground
- visible serious injury/bleeding
- violent assault
- obvious medical distress requiring urgent help

Otherwise informational.

Keep title under 6 words.
Keep description under 25 words.
Do not include any extra keys or text.`;

    formData.append("prompt", prompt);
    formData.append("outputSchema", JSON.stringify({
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        severity: { type: "string", enum: ["informational", "emergency"] },
      },
      required: ["title", "description", "severity"],
    }));

    // Call Overshoot HTTP API
    const response = await fetch(`${OVERSHOOT_API_URL}/analyze`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OVERSHOOT_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Overshoot API error: ${response.status} ${errorText}`);
      return null;
    }

    const result: any = await response.json();
    
    // Parse the result (might be in result.result or directly in response)
    let parsed: any;
    if (typeof result === "string") {
      parsed = JSON.parse(result);
    } else if (result && typeof result.result === "string") {
      parsed = JSON.parse(result.result);
    } else {
      parsed = result;
    }
    
    return {
      title: parsed.title,
      description: parsed.description,
      severity: parsed.severity as Severity,
    };
  } catch (e) {
    console.warn("Overshoot analysis error:", (e as Error).message);
    return null;
  }
}

async function postEventToBackend(result: { title: string; description: string; severity: Severity }) {
  try {
    const response = await fetch(`${BACKEND_URL}/process_event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        camera_id: CAMERA_LOCATION,
        severity: result.severity,
        title: result.title,
        description: result.description,
        reference_clip_url: `http://localhost:${PORT}/latest_clip.mp4`,
      }),
    });

    if (!response.ok) {
      console.warn(`Backend POST error: ${response.status}`);
      return false;
    }

    if (result.severity === "emergency" && response.ok) {
      lastEmergencyTitle = result.title;
      lastEmergencyDescription = result.description;
    }

    return true;
  } catch (e) {
    console.warn("Backend POST error:", (e as Error).message);
    return false;
  }
}

async function runAnalysisAndPost() {
  if (analysisRunning) return;
  analysisRunning = true;

  try {
    if (!latestClipPath || !fs.existsSync(latestClipPath)) {
      return; // Clip not ready yet
    }

    // Run Overshoot analysis
    const result = await runOvershootAnalysis(latestClipPath);
    if (!result) return;

    console.log("[Overshoot]", result);

    // Apply cooldown and deduplication for emergencies
    if (result.severity === "emergency") {
      const isDuplicate =
        lastEmergencyTitle === result.title && lastEmergencyDescription === result.description;
      if (isDuplicate) return;
      if (!canSendEmergency()) return;
    }

    // Post to backend
    await postEventToBackend(result);
  } catch (e) {
    console.warn("Analysis loop error:", (e as Error).message);
  } finally {
    analysisRunning = false;
  }
}

function startAnalysisLoop() {
  console.log("Starting analysis loop...");
  // Run every 2s to avoid hammering the model
  setInterval(runAnalysisAndPost, 2000);
}

/**
 * =========================
 * Clip building loop
 * =========================
 */
function startClipLoop() {
  console.log("Starting clip building loop...");

  setInterval(async () => {
    try {
      if (frames.length < MAX_FRAMES) return;

      const framesToUse = frames.slice(-MAX_FRAMES);
      const clipAbs = path.resolve(process.cwd(), ".latest_clip.mp4");

      console.log("frames buffered:", frames.length);

      await buildClipFromFrames(clipAbs, framesToUse);

      console.log("clip written:", clipAbs, fs.existsSync(clipAbs));

      latestClipPath = clipAbs;
      latestClipTs = Date.now();
    } catch (e) {
      console.warn("Clip build error:", (e as Error).message);
    }
  }, 1000);
}

/**
 * =========================
 * Start server
 * =========================
 */
app.listen(PORT, () => {
  console.log(`Camera server running on http://localhost:${PORT}`);
  startFrameCapture();
  startClipLoop();
  startAnalysisLoop();
});
