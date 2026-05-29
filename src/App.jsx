import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  RefreshCcw,
  Play,
  Loader2,
  Shield,
  CheckCircle2,
  Hash,
  Coins,
  BadgeHelp,
  MessageSquareText,
  Image as ImageIcon,
} from "lucide-react";

const WORKER_URL =
  "https://object-counter-app.faruqueomar81.workers.dev";

function styles() {
  return `
    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f8fafc;
      color: #0f172a;
    }

    button {
      font: inherit;
    }

    .app-shell {
      min-height: 100vh;
      background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
      padding: 16px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      gap: 16px;
    }

    .layout {
      display: grid;
      gap: 16px;
    }

    .left-stack, .right-stack {
      display: grid;
      gap: 16px;
    }

    .card {
      background: rgba(255,255,255,.94);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(148, 163, 184, .20);
      border-radius: 26px;
      box-shadow: 0 16px 38px rgba(15, 23, 42, .08);
      overflow: hidden;
    }

    .card-header {
      padding: 20px 20px 8px;
    }

    .card-title {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .card-subtitle {
      margin: 10px 0 0;
      color: #475569;
      line-height: 1.55;
      font-size: 0.95rem;
    }

    .card-body {
      padding: 16px 20px 20px;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 999px;
      padding: 8px 12px;
      background: #dbeafe;
      color: #1d4ed8;
      font-size: 0.86rem;
      font-weight: 600;
    }

    .camera-frame {
      position: relative;
      background: #020617;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid rgba(100, 116, 139, .28);
      aspect-ratio: 16 / 10;
    }

    .camera-frame video,
    .camera-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .camera-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      text-align: center;
      color: white;
      background: rgba(2, 6, 23, .76);
      padding: 24px;
    }

    .button-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-top: 14px;
    }

    .btn {
      border: none;
      border-radius: 16px;
      padding: 12px 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
    }

    .btn:hover {
      transform: translateY(-1px);
    }

    .btn:disabled {
      opacity: .55;
      cursor: not-allowed;
      transform: none;
    }

    .btn-primary {
      background: #1d4ed8;
      color: white;
      box-shadow: 0 10px 24px rgba(29, 78, 216, .24);
    }

    .btn-outline {
      background: white;
      color: #0f172a;
      border: 1px solid #cbd5e1;
    }

    .status-box, .result-card, .notice, .hero-count-card {
      border-radius: 22px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      padding: 14px;
    }

    .status-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .status-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: .06em;
    }

    .status-value {
      margin-top: 4px;
      color: #475569;
      font-size: 0.95rem;
    }

    .progress {
      width: 120px;
      height: 8px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      width: 66%;
      background: linear-gradient(90deg, #2563eb, #60a5fa);
      animation: pulse-bar 1.1s ease-in-out infinite;
    }

    .error {
      color: #b91c1c;
      font-size: 0.92rem;
      margin-top: 10px;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .empty {
      border: 1px dashed #cbd5e1;
      background: white;
      border-radius: 20px;
      padding: 32px 18px;
      text-align: center;
      color: #64748b;
    }

    .results-grid {
      display: grid;
      gap: 12px;
    }

    .hero-count-card {
      background: white;
      box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
      padding: 18px;
    }

    .hero-count-top {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }

    .hero-count-label {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
    }

    .hero-count-panel {
      background: #cfe5bb;
      border-radius: 24px;
      min-height: 132px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.35);
    }

    .hero-count-number {
      font-size: clamp(3rem, 7vw, 4.8rem);
      font-weight: 500;
      color: #0f172a;
      letter-spacing: -0.04em;
      line-height: 1;
    }

    .hero-count-comment {
      margin-top: 12px;
      color: #475569;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .result-card {
      background: white;
      box-shadow: 0 8px 20px rgba(15, 23, 42, .04);
    }

    .result-top {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .result-title {
      font-size: 0.82rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: .08em;
      font-weight: 700;
    }

    .result-value {
      font-size: 1.18rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.35;
    }

    .result-basis {
      margin-top: 8px;
      color: #475569;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .footer-note {
      color: #64748b;
      font-size: 0.9rem;
      line-height: 1.6;
    }

    @keyframes pulse-bar {
      0% { transform: translateX(-18%); opacity: .75; }
      50% { transform: translateX(18%); opacity: 1; }
      100% { transform: translateX(-18%); opacity: .75; }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @media (max-width: 860px) {
      .button-row {
        grid-template-columns: 1fr;
      }
    }

    @media (min-width: 960px) {
      .layout {
        grid-template-columns: 1.05fr 0.95fr;
        align-items: start;
      }
    }
  `;
}

function resizeImage(dataUrl, maxWidth = 1400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable."));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to resize image."));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => reject(new Error("Failed to load image for resize."));
    img.src = dataUrl;
  });
}

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [status, setStatus] = useState(
    "Ready — turn on the camera and count visible objects."
  );
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError("");
    setStatus("Requesting camera access...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCapturedImage(null);
      setAnalysis(null);
      setCameraOn(true);
      setStatus("Camera ready — point at the objects and press Count.");
    } catch {
      setCameraOn(false);
      setStatus("Camera unavailable");
      setError(
        "Camera access failed. Open over HTTPS and allow camera permission."
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  };

  const hardReset = () => {
    stopCamera();
    setCapturedImage(null);
    setAnalysis(null);
    setError("");
    setStatus("Ready — turn on the camera and count visible objects.");
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return null;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Canvas context unavailable.");
      return null;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.92);
  };

  const countObjects = async () => {
    if (!cameraOn) {
      setError("Turn on the camera first.");
      return;
    }

    const frame = captureFrame();
    if (!frame) {
      setError("Could not capture frame.");
      return;
    }

    setCapturedImage(frame);

    try {
      setAnalyzing(true);
      setError("");
      setStatus("Resizing image...");

      const resizedBlob = await resizeImage(frame, 1400, 0.82);

      setStatus("Counting objects...");

      const formData = new FormData();
      formData.append("image", resizedBlob, "objects.jpg");

      const response = await fetch(WORKER_URL, {
        method: "POST",
        body: formData,
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || "Counting failed.");
      }

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("Worker returned invalid JSON.");
      }

      setAnalysis(parsed);
      stopCamera();
      setStatus("Count complete ✅");
    } catch (err) {
      setAnalysis(null);
      setStatus("Count failed");
      setError(`Count failed: ${err?.message || "Unknown error"}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (analyzing) return;

    if (!cameraOn && !analysis) {
      await startCamera();
      return;
    }

    if (cameraOn) {
      await countObjects();
      return;
    }

    if (!cameraOn && analysis) {
      await startCamera();
    }
  };

  const getPrimaryButtonLabel = () => {
    if (analyzing) return "Counting...";
    if (!cameraOn && !analysis) return "Turn On Camera";
    if (cameraOn) return analysis ? "Count Again" : "Count";
    if (!cameraOn && analysis) return "Count Another";
    return "Turn On Camera";
  };

  const getPrimaryButtonIcon = () => {
    if (analyzing) {
      return (
        <Loader2
          size={16}
          style={{ animation: "spin 1s linear infinite" }}
        />
      );
    }

    if (!cameraOn && !analysis) return <Play size={16} />;
    if (cameraOn) return <Camera size={16} />;
    if (!cameraOn && analysis) return <Camera size={16} />;

    return <Play size={16} />;
  };

  return (
    <>
      <style>{styles()}</style>

      <div className="app-shell">
        <div className="container">
          <div className="layout">
            <div className="left-stack">
              <section className="card">
                <div className="card-header">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h1 className="card-title">Object Counter</h1>
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: ".92rem",
                          color: "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        Developed by Osama & Faruque
                      </div>
                      <p className="card-subtitle">
                        One button flow: open camera, count, then count another
                        without manually resetting.
                      </p>
                    </div>

                    <span className="tag">
                      <Shield size={16} />
                      GitHub Pages + Worker
                    </span>
                  </div>
                </div>

                <div className="card-body">
                  <div className="camera-frame">
                    {capturedImage && !cameraOn ? (
                      <img src={capturedImage} alt="Captured objects" />
                    ) : (
                      <video ref={videoRef} playsInline muted />
                    )}

                    {!cameraOn && !capturedImage && (
                      <div className="camera-overlay">
                        <ImageIcon size={42} />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>
                            Turn on the camera
                          </div>
                          <div
                            style={{
                              marginTop: 8,
                              color: "rgba(255,255,255,.78)",
                              lineHeight: 1.5,
                            }}
                          >
                            For best results, place the objects on a contrasting
                            background with minimal overlap.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <canvas ref={canvasRef} style={{ display: "none" }} />

                  <div className="button-row">
                    <button
                      className="btn btn-primary"
                      onClick={handlePrimaryAction}
                      disabled={analyzing}
                    >
                      {getPrimaryButtonIcon()}
                      {getPrimaryButtonLabel()}
                    </button>

                    <button className="btn btn-outline" onClick={hardReset}>
                      <RefreshCcw size={16} /> Reset
                    </button>
                  </div>

                  <div className="status-box" style={{ marginTop: 14 }}>
                    <div className="status-row">
                      <div>
                        <div className="status-label">Status</div>
                        <div className="status-value">{status}</div>
                      </div>

                      {analyzing && (
                        <div className="progress">
                          <div className="progress-bar" />
                        </div>
                      )}
                    </div>

                    {error && <div className="error">{error}</div>}
                  </div>
                </div>
              </section>
            </div>

            <div className="right-stack">
              <section className="card">
                <div className="card-header">
                  <h2 className="card-title">Count Results</h2>
                  <p className="card-subtitle">
                    Estimated count first, then supporting details below.
                  </p>
                </div>

                <div className="card-body">
                  {analyzing ? (
                    <div className="empty">
                      <Loader2
                        size={18}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                      <div style={{ marginTop: 10 }}>Analyzing objects...</div>
                    </div>
                  ) : analysis ? (
                    <div className="results-grid">
                      <div className="hero-count-card">
                        <div className="hero-count-top">
                          <Hash size={22} color="#2f8f2f" />
                          <div className="hero-count-label">Estimated Count</div>
                        </div>
                        <div className="hero-count-panel">
                          <div className="hero-count-number">
                            {analysis.count ?? "—"}
                          </div>
                        </div>
                        <div className="hero-count-comment">
                          {analysis.count_comment || "—"}
                        </div>
                      </div>

                      <div className="result-card">
                        <div className="result-top">
                          <BadgeHelp size={18} color="#1d4ed8" />
                          <div className="result-title">Object</div>
                        </div>
                        <div className="result-value">
                          {analysis.object_type || "—"}
                        </div>
                        <div className="result-basis">
                          {analysis.object_comment || "—"}
                        </div>
                      </div>

                      <div className="result-card">
                        <div className="result-top">
                          <Coins size={18} color="#b45309" />
                          <div className="result-title">Estimated Value</div>
                        </div>
                        <div className="result-value">
                          {analysis.estimated_value || "N/A"}
                        </div>
                        <div className="result-basis">
                          {analysis.value_comment ||
                            "Value only appears when coins are recognized."}
                        </div>
                      </div>

                      <div className="result-card">
                        <div className="result-top">
                          <CheckCircle2 size={18} color="#166534" />
                          <div className="result-title">Confidence</div>
                        </div>
                        <div className="result-value">
                          {analysis.confidence || "—"}
                        </div>
                        <div className="result-basis">
                          {analysis.confidence_comment || "—"}
                        </div>
                      </div>

                      <div className="result-card">
                        <div className="result-top">
                          <MessageSquareText size={18} color="#475569" />
                          <div className="result-title">Notes</div>
                        </div>
                        <div className="result-basis">
                          {analysis.notes || "—"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="empty">
                      Tap <strong>Turn On Camera</strong>, then tap{" "}
                      <strong>Count</strong>. After a result appears, tap{" "}
                      <strong>Count Another</strong> to immediately start the
                      next one.
                    </div>
                  )}
                </div>
              </section>

              <section className="card">
                <div className="card-header">
                  <h2 className="card-title">Best Use</h2>
                </div>
                <div className="card-body">
                  <div className="notice">
                    <div className="footer-note">
                      Works best when objects are similar, clearly visible, and
                      not heavily overlapping. For coins, totals are estimates
                      based on visible denominations.
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
