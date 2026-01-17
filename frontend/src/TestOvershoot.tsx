import { useState } from "react";
import { RealtimeVision } from "@overshoot/sdk";

const apiKey = "ovs_16e2ba18927ea6bfa68cc5bd90048d1f";
const CAMERA_URL = "http://localhost:5055";

export function TestOvershoot() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [useCamera, setUseCamera] = useState(true);

  const analyze = async (fileToAnalyze?: File) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let file: File;

      if (fileToAnalyze) {
        // Use uploaded file
        file = fileToAnalyze;
      } else if (useCamera) {
        // Fetch from camera server
        const resp = await fetch(`${CAMERA_URL}/latest_clip.mp4`, { cache: "no-store" });
        if (!resp.ok) {
          throw new Error(`Failed to fetch clip: ${resp.status} ${resp.statusText}`);
        }
        const blob = await resp.blob();
        file = new File([blob], "clip.mp4", { type: "video/mp4" });
      } else {
        throw new Error("No video selected. Upload a file or use camera feed.");
      }

      // 2) Run Overshoot
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

      // Add timeout (60 seconds max)
      const timeoutId = setTimeout(() => {
        setError("Analysis timed out after 60 seconds. The video might be too long or Overshoot API is slow.");
        setLoading(false);
      }, 60000);

      const analysisResult = await new Promise<{ title: string; description: string; severity: string }>(
        (resolve, reject) => {
          let visionInstance: RealtimeVision | null = null;

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
              clearTimeout(timeoutId);
              try {
                console.log("[Overshoot] Raw result:", r);
                const parsed = JSON.parse(r.result);
                console.log("[Overshoot] Parsed result:", parsed);
                if (visionInstance) {
                  await visionInstance.stop();
                }
                resolve(parsed);
              } catch (e) {
                console.error("[Overshoot] Parse error:", e);
                if (visionInstance) {
                  await visionInstance.stop();
                }
                reject(new Error(`Failed to parse result: ${e}`));
              }
            },
            onError: async (e: any) => {
              clearTimeout(timeoutId);
              console.error("[Overshoot] Error:", e);
              try {
                if (visionInstance) {
                  await visionInstance.stop();
                }
              } catch {}
              reject(new Error(`Overshoot error: ${e?.message || String(e)}`));
            },
          });

          visionInstance = vision;

          vision.start().catch((err) => {
            clearTimeout(timeoutId);
            console.error("[Overshoot] Start error:", err);
            reject(new Error(`Failed to start analysis: ${err?.message || String(err)}`));
          });
        }
      );

      clearTimeout(timeoutId);

      setResult(analysisResult);
    } catch (e: any) {
      const errorMsg = e?.message || String(e);
      setError(errorMsg);
      console.error("[TestOvershoot] Analysis failed:", e);
      
      // Provide helpful error messages
      if (errorMsg.includes("timeout")) {
        setError("Analysis timed out. Try a shorter video (under 10 seconds) or check your internet connection.");
      } else if (errorMsg.includes("Failed to fetch")) {
        setError("Could not fetch video. Make sure the camera server is running on port 5055.");
      } else if (errorMsg.includes("API key") || errorMsg.includes("401") || errorMsg.includes("403")) {
        setError("Invalid API key. Check your Overshoot API key.");
      } else {
        setError(`Error: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file);
      setUseCamera(false);
    } else {
      setError("Please select a video file");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", color: "#e2e8f0" }}>
      <h1 style={{ color: "#cbd5e1" }}>Test Overshoot Analysis</h1>
      <p style={{ color: "#94a3b8" }}>Analyze a video file or the current camera feed.</p>

      <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "8px", color: "#cbd5e1" }}>
            Option 1: Upload a video file
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            style={{ color: "#cbd5e1" }}
          />
          {selectedFile && (
            <p style={{ marginTop: "8px", fontSize: "14px", color: "#94a3b8" }}>
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#cbd5e1" }}>
            <input
              type="checkbox"
              checked={useCamera}
              onChange={(e) => {
                setUseCamera(e.target.checked);
                if (e.target.checked) setSelectedFile(null);
              }}
            />
            Option 2: Use camera server feed (http://localhost:5055/latest_clip.mp4)
          </label>
        </div>

        <button
          onClick={() => analyze(selectedFile || undefined)}
          disabled={loading || (!selectedFile && !useCamera)}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: loading || (!selectedFile && !useCamera) ? "not-allowed" : "pointer",
            backgroundColor: loading || (!selectedFile && !useCamera) ? "#475569" : "#0ea5e9",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: "500",
          }}
        >
          {loading ? "Analyzing... (check console for details)" : selectedFile ? `Analyze "${selectedFile.name}"` : "Analyze Camera Feed"}
        </button>
        
        {loading && (
          <p style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>
            This may take 10-30 seconds depending on video length. Check browser console (F12) for progress.
          </p>
        )}
      </div>

      {error && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#fee",
            color: "#c00",
            borderRadius: "5px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: result.severity === "emergency" ? "#7f1d1d" : "#14532d",
            color: result.severity === "emergency" ? "#fecaca" : "#bbf7d0",
            borderRadius: "5px",
            border: `1px solid ${result.severity === "emergency" ? "#dc2626" : "#22c55e"}`,
          }}
        >
          <h3 style={{ marginTop: 0, color: result.severity === "emergency" ? "#fca5a5" : "#86efac" }}>
            Overshoot Analysis Result:
          </h3>
          <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", fontSize: "12px", opacity: 0.9 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
          <div style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <p style={{ margin: 0 }}>
              <strong>Title:</strong> {result.title}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Description:</strong> {result.description}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Severity:</strong>{" "}
              <span
                style={{
                  color: result.severity === "emergency" ? "#fca5a5" : "#86efac",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                {result.severity}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
