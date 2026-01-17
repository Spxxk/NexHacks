import { RealtimeVision } from "overshoot";

type Severity = "low" | "medium" | "high";

export async function startOvershootLoop() {
  const OVERSHOOT_API_KEY = import.meta.env.VITE_OVERSHOOT_API_KEY as string;
  const CAMERA_URL = "http://localhost:5055";
  const BACKEND_URL = "http://localhost:8000";
  const CAMERA_LOCATION = "CAM_12";

  if (!OVERSHOOT_API_KEY) {
    console.error("Missing VITE_OVERSHOOT_API_KEY in frontend .env");
    return;
  }

  let isAnalyzing = false; // Prevent overlapping analyses

  async function analyzeOnce() {
    // Skip if already analyzing
    if (isAnalyzing) {
      console.log("Skipping analysis - previous one still running");
      return;
    }

    try {
      isAnalyzing = true;

      // Fetch the rolling mp4 from your camera server
      const resp = await fetch(`${CAMERA_URL}/latest_clip.mp4`, { cache: "no-store" });
      if (!resp.ok) {
        console.log("Clip not ready yet, skipping");
        return;
      }

      const blob = await resp.blob();
      const file = new File([blob], "clip.mp4", { type: "video/mp4" });

      const prompt = `
Return STRICT JSON:
{ "description": string, "severity": "low"|"medium"|"high" }

high: collapse/unconscious/bleeding/severe injury/violent assault
medium: fall/minor injury/person clearly needing help
low: normal activity
`.trim();

      const result = await new Promise<{ description: string; severity: Severity }>((resolve, reject) => {
        const vision = new RealtimeVision({
          apiUrl: "https://api.overshoot.ai",
          apiKey: OVERSHOOT_API_KEY,
          prompt,
          source: { type: "video", file },
          outputSchema: {
            type: "object",
            properties: {
              description: { type: "string" },
              severity: { type: "string", enum: ["low", "medium", "high"] },
            },
            required: ["description", "severity"],
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

    // Post to backend - always create event, but only assign ambulance for emergency
    const severity = result.severity === "high" ? "emergency" : "informational";
    
    await fetch(`${BACKEND_URL}/process_event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        camera_id: CAMERA_LOCATION,
        severity: severity,
        title: result.description.substring(0, 50), // Short title
        description: result.description,
        reference_clip_url: `${CAMERA_URL}/latest_clip.mp4`,
      }),
    });
    } catch (e) {
      // Silently handle errors - don't let them crash the app
      console.warn("Overshoot analyze error:", e);
    } finally {
      isAnalyzing = false;
    }
  }

  // Loop forever - increased interval to 3 seconds to avoid overlap
  setInterval(() => {
    analyzeOnce();
  }, 3000);
}
