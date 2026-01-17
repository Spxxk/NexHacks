type Severity = "informational" | "emergency";

export function startAnalysisLoop() {
  const CAMERA_URL = "http://localhost:5055";
  const BACKEND_URL = "http://localhost:8000";
  const CAMERA_ID = "CAM_12"; // match your seeded camera
  // Overshoot API key from https://docs.overshoot.ai/getting-started (get at Overshoot Platform).
  // Optional: set VITE_OVERSHOOT_API_KEY in .env; otherwise uses the value below.
  const apiKey =
    (import.meta.env.VITE_OVERSHOOT_API_KEY as string) || "ovs_16e2ba18927ea6bfa68cc5bd90048d1f";

  let running = false;
  let lastEmergencyAt = 0;
  let lastEmergencyTitle: string | null = null;
  let lastEmergencyDescription: string | null = null;

  function canSendEmergency(): boolean {
    const now = Date.now();
    if (now - lastEmergencyAt < 30_000) return false;
    lastEmergencyAt = now;
    return true;
  }

  async function runOvershootAndPost() {
    if (running) return;
    running = true;

    try {
      // 1) fetch latest clip as File
      const resp = await fetch(`${CAMERA_URL}/latest_clip.mp4`, { cache: "no-store" });
      if (!resp.ok) return; // clip may not be ready yet
      const blob = await resp.blob();
      const file = new File([blob], "clip.mp4", { type: "video/mp4" });

      // 2) run Overshoot in the browser
      const { RealtimeVision } = await import("@overshoot/sdk");

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

      const result = await new Promise<{ title: string; description: string; severity: Severity }>((resolve, reject) => {
        const vision = new RealtimeVision({
          apiUrl: "https://cluster1.overshoot.ai/api/v0.2",
          apiKey,
          prompt,
          source: { type: "video", file } as any,
          outputSchema: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              severity: { type: "string", enum: ["informational", "emergency"] },
            },
            required: ["title", "description", "severity"],
          },
          onResult: async (r: any) => {
            try {
              const parsed = JSON.parse(r.result);
              await vision.stop();
              resolve(parsed);
            } catch (e) {
              await vision.stop();
              reject(e);
            }
          },
          onError: async (e: any) => {
            try { await vision.stop(); } catch {}
            reject(e);
          },
        });

        vision.start().catch(reject);
      });

      // Debug: see Overshoot output in browser console (F12 → Console)
      console.log("[Overshoot]", result);

      // 3) post to backend (cooldown + dedupe for emergencies only)
      if (result.severity === "emergency") {
        const isDuplicate =
          lastEmergencyTitle === result.title && lastEmergencyDescription === result.description;
        if (isDuplicate) return;
        if (!canSendEmergency()) return;
      }

      const postResp = await fetch(`${BACKEND_URL}/process_event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          camera_id: CAMERA_ID,
          severity: result.severity,
          title: result.title,
          description: result.description,
          reference_clip_url: `${CAMERA_URL}/latest_clip.mp4`,
        }),
      });

      if (result.severity === "emergency" && postResp.ok) {
        lastEmergencyTitle = result.title;
        lastEmergencyDescription = result.description;
      }
    } catch (e) {
      console.warn("analysis:", (e as Error).message);
    } finally {
      running = false;
    }
  }

  // run every 2s to avoid hammering the model
  setInterval(runOvershootAndPost, 2000);
}
