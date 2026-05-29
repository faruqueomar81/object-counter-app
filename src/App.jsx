import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Search,
  Upload,
  RefreshCcw,
  User,
  BarChart3,
  Smartphone,
  Shield,
  Play,
  Pause,
  Loader2,
  Trophy,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const API_BASE = "https://statsapi.mlb.com/api/v1";
const CURRENT_SEASON = new Date().getFullYear();
const CACHE_TTL_MS = 1000 * 60 * 15;

// ✅ your Cloudflare Worker URL
const WORKER_URL = "https://mlb-player-finder-worker.faruqueomar81.workers.dev";

function styles() {
  return `
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8fafc; color: #0f172a; }
    button, input, select { font: inherit; }
    .app-shell { min-height: 100vh; background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%); padding: 16px; }
    .container { max-width: 1280px; margin: 0 auto; display: grid; gap: 16px; }

    .main-layout { display: grid; gap: 16px; }
    .left-stack, .right-stack { display: grid; gap: 16px; }

    .card { background: rgba(255,255,255,.92); backdrop-filter: blur(8px); border: 1px solid rgba(148, 163, 184, .22); border-radius: 24px; box-shadow: 0 12px 34px rgba(15, 23, 42, .08); overflow: hidden; }
    .card-header { padding: 20px 20px 8px; }
    .card-title { margin: 0; font-size: 1.35rem; font-weight: 700; letter-spacing: -0.02em; }
    .card-subtitle { margin: 10px 0 0; color: #475569; line-height: 1.55; font-size: .95rem; }
    .card-body { padding: 16px 20px 20px; }

    .tag { display: inline-flex; align-items: center; gap: 8px; border-radius: 999px; padding: 8px 12px; background: #dbeafe; color: #1d4ed8; font-size: .86rem; font-weight: 600; }

    .camera-frame { position: relative; background: #020617; border-radius: 24px; overflow: hidden; border: 1px solid rgba(100, 116, 139, .28); aspect-ratio: 3 / 4; }
    .camera-frame video, .camera-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .camera-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; color: white; background: rgba(2, 6, 23, .76); padding: 24px; }

    .button-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 14px; }

    .btn { border: none; border-radius: 16px; padding: 12px 14px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; font-weight: 600; transition: transform .15s ease, box-shadow .15s ease, background .15s ease; }
    .btn:hover { transform: translateY(-1px); }
    .btn:disabled { opacity: .55; cursor: not-allowed; transform: none; }
    .btn-primary { background: #1d4ed8; color: white; box-shadow: 0 10px 24px rgba(29, 78, 216, .24); }
    .btn-secondary { background: #e2e8f0; color: #0f172a; }
    .btn-outline { background: white; color: #0f172a; border: 1px solid #cbd5e1; }

    .status-box, .notice, .summary-box { border-radius: 20px; border: 1px solid #e2e8f0; background: #f8fafc; padding: 14px; }
    .status-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .status-label { font-size: .8rem; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: .06em; }
    .status-value { margin-top: 4px; color: #475569; font-size: .95rem; }
    .progress { width: 120px; height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
    .progress-bar { height: 100%; width: 66%; background: linear-gradient(90deg, #2563eb, #60a5fa); animation: pulse-bar 1.1s ease-in-out infinite; }
    .error { color: #b91c1c; font-size: .92rem; margin-top: 10px; }

    .field-input { width: 100%; border-radius: 16px; border: 1px solid #cbd5e1; background: white; padding: 12px 14px; outline: none; }
    .field-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,.12); }

    .search-input-wrap { position: relative; }
    .search-input-wrap .icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b; }
    .search-input { padding-left: 42px; }

    .result-list { display: grid; gap: 10px; max-height: 420px; overflow: auto; padding-right: 2px; margin-top: 14px; }
    .result-item { border: 1px solid #e2e8f0; border-radius: 18px; background: white; padding: 14px; text-align: left; cursor: pointer; transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease; }
    .result-item:hover { border-color: #94a3b8; box-shadow: 0 10px 24px rgba(15, 23, 42, .06); transform: translateY(-1px); }
    .result-item.active { border-color: #2563eb; background: #eff6ff; }
    .result-top { display: flex; justify-content: space-between; gap: 12px; align-items: center; }

    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; background: #e2e8f0; color: #334155; font-size: .8rem; font-weight: 600; }
    .badge-blue { background: #dbeafe; color: #1d4ed8; }
    .badge-green { background: #dcfce7; color: #166534; }

    .result-name { font-weight: 700; }
    .result-meta { margin-top: 4px; color: #475569; font-size: .93rem; line-height: 1.45; }

    .empty { border: 1px dashed #cbd5e1; background: white; border-radius: 20px; padding: 32px 18px; text-align: center; color: #64748b; }

    .profile-card { display: grid; gap: 16px; }
    .profile-hero { border-radius: 24px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #1d4ed8 100%); color: white; padding: 20px; display: grid; gap: 16px; }
    .profile-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
    .profile-name { margin: 10px 0 0; font-size: 1.8rem; font-weight: 800; letter-spacing: -.03em; }
    .profile-meta { margin-top: 8px; color: rgba(255,255,255,.82); line-height: 1.6; font-size: .96rem; }
    .confidence-box { background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.14); border-radius: 20px; padding: 16px; text-align: center; min-width: 120px; }
    .confidence-label { font-size: .74rem; text-transform: uppercase; letter-spacing: .12em; color: rgba(255,255,255,.82); }
    .confidence-value { margin-top: 6px; font-size: 2rem; font-weight: 800; }

    .metrics-header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; align-items: center; }
    .tab-row { display: inline-flex; gap: 8px; background: #eff6ff; padding: 6px; border-radius: 999px; }
    .tab { border: none; border-radius: 999px; padding: 8px 12px; background: transparent; color: #334155; cursor: pointer; font-weight: 700; }
    .tab.active { background: white; color: #1d4ed8; box-shadow: 0 6px 16px rgba(37, 99, 235, .12); }

    .metric-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .metric-card { border-radius: 20px; border: 1px solid #e2e8f0; background: white; padding: 14px; box-shadow: 0 6px 18px rgba(15, 23, 42, .04); }
    .metric-label { font-size: .78rem; color: #64748b; text-transform: uppercase; letter-spacing: .08em; }
    .metric-value { margin-top: 6px; font-size: 1.22rem; font-weight: 800; color: #0f172a; }

    .small-grid { display: grid; gap: 12px; }
    .helper-list { margin: 0; padding-left: 18px; color: #475569; line-height: 1.65; }
    .helper-list li + li { margin-top: 6px; }
    .footer-note { color: #64748b; font-size: .9rem; line-height: 1.6; }

    @keyframes pulse-bar {
      0% { transform: translateX(-18%); opacity: .75; }
      50% { transform: translateX(18%); opacity: 1; }
      100% { transform: translateX(-18%); opacity: .75; }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @media (min-width: 920px) {
      .main-layout { grid-template-columns: 1.05fr .95fr; align-items: start; }
      .camera-frame { aspect-ratio: 16 / 10; }
      .button-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
      .profile-hero { grid-template-columns: 1fr auto; align-items: start; }
      .small-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .metric-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }
  `;
}

function getCached(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.expiresAt || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.value;
  } catch {
    return null;
  }
}

function setCached(key, value, ttl = CACHE_TTL_MS) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        value,
        expiresAt: Date.now() + ttl,
      })
    );
  } catch {
    // ignore storage issues
  }
}

async function mlbFetch(path, { cacheKey, ttl = CACHE_TTL_MS } = {}) {
  if (cacheKey) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }
    const data = await response.json();
    if (cacheKey) setCached(cacheKey, data, ttl);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function extractPrimaryStat(statsResponse) {
  return statsResponse?.stats?.[0]?.splits?.[0]?.stat || null;
}

function formatMetricValue(value) {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

function buildMetricCards(stat, mode) {
  if (!stat) return [];

  const hitting = [
    ["AVG", stat.avg],
    ["OBP", stat.obp],
    ["SLG", stat.slg],
    ["OPS", stat.ops],
    ["HR", stat.homeRuns],
    ["RBI", stat.rbi],
    ["SB", stat.stolenBases],
    ["Hits", stat.hits],
    ["AB", stat.atBats],
    ["Runs", stat.runs],
    ["BB", stat.baseOnBalls],
    ["SO", stat.strikeOuts],
  ];

  const pitching = [
    ["ERA", stat.era],
    ["WHIP", stat.whip],
    ["Wins", stat.wins],
    ["Losses", stat.losses],
    ["Saves", stat.saves],
    ["IP", stat.inningsPitched],
    ["SO", stat.strikeOuts],
    ["BB", stat.baseOnBalls],
    ["BAA", stat.battingAverageAgainst],
    ["Games", stat.gamesPlayed],
    ["Games Started", stat.gamesStarted],
    ["Hits Allowed", stat.hits],
  ];

  return (mode === "pitching" ? pitching : hitting).map(([label, value]) => ({
    label,
    value: formatMetricValue(value),
  }));
}

function MetricGrid({ items }) {
  return (
    <div className="metric-grid">
      {items.map((item) => (
        <div className="metric-card" key={item.label}>
          <div className="metric-label">{item.label}</div>
          <div className="metric-value">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function getPlayerSummary(person) {
  if (!person) return null;

  const team = person.currentTeam?.name || "No current team";
  const position =
    person.primaryPosition?.abbreviation || person.primaryPosition?.name || "Position N/A";
  const bats = person.batSide?.description || "Unknown";
  const throwsHand = person.pitchHand?.description || "Unknown";

  return {
    team,
    position,
    bats,
    throwsHand,
    age: person.currentAge || "—",
    number: person.primaryNumber || "—",
    height: person.height || "—",
    weight: person.weight || "—",
    birthPlace:
      [person.birthCity, person.birthStateProvince || person.birthCountry]
        .filter(Boolean)
        .join(", ") || "—",
    debut: person.mlbDebutDate || "—",
    active: person.active,
  };
}

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const searchTimerRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [playerProfile, setPlayerProfile] = useState(null);
  const [hittingStats, setHittingStats] = useState(null);
  const [pitchingStats, setPitchingStats] = useState(null);
  const [statsMode, setStatsMode] = useState("hitting");
  const [loadingPlayer, setLoadingPlayer] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [status, setStatus] = useState("Ready — capture a photo or search for an MLB player.");
  const [error, setError] = useState("");
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    return () => {
      stopCamera();
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      setSearchError("");
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      try {
        const data = await mlbFetch(`/people/search?names=${encodeURIComponent(trimmed)}&sportId=1`, {
          cacheKey: `player-search:${trimmed.toLowerCase()}`,
          ttl: 1000 * 60 * 30,
        });
        const people = data?.people || [];
        setResults(people.slice(0, 20));
      } catch {
        setResults([]);
        setSearchError("Could not search players right now. Please try again.");
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [query]);

  const startCamera = async () => {
    setError("");
    setStatus("Requesting rear camera access...");

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
      setCameraOn(true);
      setStatus("Camera ready — capture a frame, then identify or search manually.");
    } catch {
      setCameraOn(false);
      setError("Camera access failed. Open the app over HTTPS on your phone and allow camera permission.");
      setStatus("Camera unavailable");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.92));
    setStatus("Photo captured ✅ — tap Identify Player or search manually below.");
    setError("");
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result);
      setStatus("Image uploaded ✅ — tap Identify Player or search manually below.");
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const clearSession = () => {
    setCapturedImage(null);
    setSelectedPlayerId(null);
    setPlayerProfile(null);
    setHittingStats(null);
    setPitchingStats(null);
    setStatsMode("hitting");
    setStatus("Ready — capture a photo or search for an MLB player.");
    setError("");
    setSearchError("");
    setQuery("");
    setResults([]);
  };

  const loadPlayer = async (personId) => {
    setSelectedPlayerId(personId);
    setLoadingPlayer(true);
    setError("");
    setStatus("Loading player profile and season metrics...");

    try {
      const [profileData, hittingData, pitchingData] = await Promise.all([
        mlbFetch(`/people/${personId}`, {
          cacheKey: `player-profile:${personId}`,
          ttl: 1000 * 60 * 60 * 6,
        }),
        mlbFetch(`/people/${personId}/stats?stats=season&group=hitting&season=${CURRENT_SEASON}`, {
          cacheKey: `player-hitting:${personId}:${CURRENT_SEASON}`,
          ttl: 1000 * 60 * 30,
        }),
        mlbFetch(`/people/${personId}/stats?stats=season&group=pitching&season=${CURRENT_SEASON}`, {
          cacheKey: `player-pitching:${personId}:${CURRENT_SEASON}`,
          ttl: 1000 * 60 * 30,
        }),
      ]);

      const person = profileData?.people?.[0] || null;
      const hitStat = extractPrimaryStat(hittingData);
      const pitchStat = extractPrimaryStat(pitchingData);

      setPlayerProfile(person);
      setHittingStats(hitStat);
      setPitchingStats(pitchStat);

      if (hitStat) {
        setStatsMode("hitting");
      } else if (pitchStat) {
        setStatsMode("pitching");
      }

      setStatus("Player loaded successfully.");
    } catch {
      setPlayerProfile(null);
      setHittingStats(null);
      setPitchingStats(null);
      setError("Could not load player data from MLB right now. Please try a different player or retry.");
      setStatus("Player load failed");
    } finally {
      setLoadingPlayer(false);
    }
  };

  const identifyPlayerFromImage = async () => {
    console.log("Identify button clicked");

    if (!capturedImage) {
      setError("Capture or upload an image first.");
      return;
    }

    try {
      setError("");
      setStatus("Sending image to recognition service...");
      setRecognizing(true);

      const blob = await fetch(capturedImage).then((r) => r.blob());
      const formData = new FormData();
      formData.append("image", blob, "player.jpg");

      const response = await fetch(WORKER_URL, {
        method: "POST",
        body: formData,
      });

      const text = await response.text();

      if (!response.ok) {
        console.error("Worker error:", text);
        throw new Error(text || "Recognition request failed.");
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch {
        console.error("Non-JSON worker response:", text);
        throw new Error("Worker returned non-JSON response.");
      }

      const bestCandidate = result?.candidates?.[0];

      if (!bestCandidate?.name) {
        setStatus("No confident player match found. Please search manually.");
        return;
      }

      setQuery(bestCandidate.name);
      setStatus(`Best match found: ${bestCandidate.name}. Searching MLB data...`);

      const searchData = await mlbFetch(
        `/people/search?names=${encodeURIComponent(bestCandidate.name)}&sportId=1`,
        {
          cacheKey: `player-search:${bestCandidate.name.toLowerCase()}`,
          ttl: 1000 * 60 * 30,
        }
      );

      const people = searchData?.people || [];
      if (!people.length) {
        setStatus(`Match found (${bestCandidate.name}), but MLB search returned no results.`);
        return;
      }

      await loadPlayer(people[0].id);
      setStatus(`Player identified: ${bestCandidate.name}`);
    } catch (err) {
      console.error("Recognition failed:", err);
      setError(`Image recognition failed: ${err.message}`);
      setStatus("Recognition failed");
    } finally {
      setRecognizing(false);
    }
  };

  const summary = useMemo(() => getPlayerSummary(playerProfile), [playerProfile]);

  const visibleMetricCards = useMemo(() => {
    if (statsMode === "pitching") return buildMetricCards(pitchingStats, "pitching");
    return buildMetricCards(hittingStats, "hitting");
  }, [statsMode, hittingStats, pitchingStats]);

  const confidence = useMemo(() => {
    if (!capturedImage) return "Search";
    if (!selectedPlayerId) return "Confirm";
    return "Matched";
  }, [capturedImage, selectedPlayerId]);

  return (
    <>
      <style>{styles()}</style>
      <div className="app-shell">
        <div className="container">
          <div className="main-layout">
            {/* LEFT COLUMN */}
            <div className="left-stack">
              {/* PLAYER FINDER CARD */}
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
                      <h1 className="card-title">MLB Player Finder</h1>
                      
                      <div style={{ marginTop: 6, fontSize: ".92rem", color: "#64748b", fontWeight: 600 }}>
                          Developed by Faruque
                      </div>
                      <p className="card-subtitle">
                        Capture a player photo, identify through Cloudflare Worker + AI, then load live MLB profile and season metrics.
                      </p>
                    </div>
                    <span className="tag">
                      <Smartphone size={16} /> GitHub Pages friendly
                    </span>
                  </div>
                </div>

                <div className="card-body">
                  <div className="camera-frame">
                    {capturedImage ? (
                      <img src={capturedImage} alt="Captured frame" />
                    ) : (
                      <video ref={videoRef} playsInline muted />
                    )}

                    {!cameraOn && !capturedImage && (
                      <div className="camera-overlay">
                        <Camera size={42} />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>Start the rear camera</div>
                          <div
                            style={{
                              marginTop: 8,
                              color: "rgba(255,255,255,.78)",
                              lineHeight: 1.5,
                            }}
                          >
                            Host this app over HTTPS (for example with GitHub Pages) so Android browsers can grant camera access.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <canvas ref={canvasRef} style={{ display: "none" }} />

                  <div className="button-grid">
                    {!cameraOn ? (
                      <button className="btn btn-primary" onClick={startCamera}>
                        <Play size={16} /> Start Camera
                      </button>
                    ) : (
                      <button className="btn btn-secondary" onClick={stopCamera}>
                        <Pause size={16} /> Stop Camera
                      </button>
                    )}

                    <button className="btn btn-secondary" onClick={captureFrame} disabled={!cameraOn}>
                      <Camera size={16} /> Capture
                    </button>

                    <button
                      className="btn btn-primary"
                      onClick={identifyPlayerFromImage}
                      disabled={!capturedImage || recognizing}
                    >
                      {recognizing ? (
                        <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                      ) : (
                        <Search size={16} />
                      )}
                      {recognizing ? "Identifying..." : "Identify Player"}
                    </button>

                    <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={16} /> Upload
                    </button>

                    <button className="btn btn-outline" onClick={clearSession}>
                      <RefreshCcw size={16} /> Reset
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleUpload}
                  />

                  <div className="status-box" style={{ marginTop: 14 }}>
                    <div className="status-row">
                      <div>
                        <div className="status-label">Status</div>
                        <div className="status-value">{status}</div>
                      </div>
                      {(searching || loadingPlayer || recognizing) && (
                        <div className="progress">
                          <div className="progress-bar" />
                        </div>
                      )}
                    </div>
                    {error && <div className="error">{error}</div>}
                  </div>
                </div>
              </section>

              {/* PLAYER CARD NOW DIRECTLY BELOW PLAYER FINDER */}
              <section className="card">
                <div className="card-header">
                  <h2 className="card-title">Player Card</h2>
                  <p className="card-subtitle">
                    Live public data from MLB for the selected player. Use the tabs to switch between hitting and pitching stats.
                  </p>
                </div>

                <div className="card-body">
                  {loadingPlayer ? (
                    <div className="empty">
                      <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                      <div style={{ marginTop: 10 }}>Loading player profile and season metrics...</div>
                    </div>
                  ) : playerProfile && summary ? (
                    <div className="profile-card">
                      <div className="profile-hero">
                        <div className="profile-head">
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                color: "rgba(255,255,255,.82)",
                                fontSize: ".92rem",
                              }}
                            >
                              <User size={16} /> Selected player
                            </div>
                            <div className="profile-name">{playerProfile.fullName}</div>
                            <div className="profile-meta">
                              {summary.team} • {summary.position}
                              <br />
                              #{summary.number} • Age {summary.age} • Bats {summary.bats} • Throws {summary.throwsHand}
                            </div>
                          </div>
                          <div className="confidence-box">
                            <div className="confidence-label">Capture mode</div>
                            <div className="confidence-value">{confidence}</div>
                          </div>
                        </div>
                      </div>

                      <div className="small-grid">
                        <div className="summary-box">
                          <div className="field-label">Bio</div>
                          <div className="footer-note">
                            Height {summary.height} • Weight {summary.weight}
                            <br />
                            Birthplace {summary.birthPlace}
                            <br />
                            MLB debut {summary.debut}
                            <br />
                            Status {summary.active ? "Active" : "Inactive"}
                          </div>
                        </div>

                        <div className="summary-box">
                          <div className="field-label">Usage note</div>
                          <div className="footer-note">
                            If the identified player is not correct, use the Search Players panel to override the result and load another player card.
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="metrics-header">
                          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800 }}>
                            <BarChart3 size={16} /> {CURRENT_SEASON} season metrics
                          </div>

                          <div className="tab-row">
                            <button
                              className={`tab ${statsMode === "hitting" ? "active" : ""}`}
                              onClick={() => setStatsMode("hitting")}
                              disabled={!hittingStats}
                            >
                              Hitting
                            </button>
                            <button
                              className={`tab ${statsMode === "pitching" ? "active" : ""}`}
                              onClick={() => setStatsMode("pitching")}
                              disabled={!pitchingStats}
                            >
                              Pitching
                            </button>
                          </div>
                        </div>

                        <div style={{ marginTop: 14 }}>
                          {visibleMetricCards.length ? (
                            <MetricGrid items={visibleMetricCards} />
                          ) : (
                            <div className="empty">
                              No {statsMode} data is available for this player for the {CURRENT_SEASON} season.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="empty">
                      Capture or upload a photo, tap <strong>Identify Player</strong>, or search manually to load the live MLB profile and stats.
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN */}
            <div className="right-stack">
              <section className="card">
                <div className="card-header">
                  <h2 className="card-title">Search Players</h2>
                  <p className="card-subtitle">Type at least 2 characters to search MLB players by name.</p>
                </div>
                <div className="card-body">
                  <div className="search-input-wrap">
                    <Search size={16} className="icon" />
                    <input
                      className="field-input search-input"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Try: Aaron Judge, Ohtani, Altuve..."
                    />
                  </div>

                  {searchError && <div className="error">{searchError}</div>}

                  <div className="result-list">
                    {searching ? (
                      <div className="empty">
                        <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                        <div style={{ marginTop: 10 }}>Searching MLB players...</div>
                      </div>
                    ) : results.length ? (
                      results.map((player) => {
                        const teamName = player.currentTeam?.name || "No current team";
                        const position =
                          player.primaryPosition?.abbreviation || player.primaryPosition?.name || "N/A";

                        return (
                          <button
                            key={player.id}
                            className={`result-item ${selectedPlayerId === player.id ? "active" : ""}`}
                            onClick={() => loadPlayer(player.id)}
                          >
                            <div className="result-top">
                              <div>
                                <div className="result-name">{player.fullName}</div>
                                <div className="result-meta">
                                  {teamName} • {position}
                                </div>
                              </div>
                              <span className={`badge ${player.active ? "badge-green" : "badge-blue"}`}>
                                {player.active ? "Active" : "Player"}
                              </span>
                            </div>
                            <div className="result-meta">
                              #{player.primaryNumber || "—"} • Bats {player.batSide?.code || "?"} • Throws {player.pitchHand?.code || "?"}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="empty">
                        Start with a player search, or capture a photo and tap <strong>Identify Player</strong>.
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="card">
                <div className="card-header">
                  <h2 className="card-title">How this version works</h2>
                </div>
                <div className="card-body small-grid">
                  <div className="notice">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                      <CheckCircle2 size={16} color="#166534" /> What works now
                    </div>
                    <ul className="helper-list" style={{ marginTop: 10 }}>
                      <li>Rear camera capture on Android</li>
                      <li>Image upload fallback</li>
                      <li>Cloudflare Worker image recognition</li>
                      <li>Live player search from public MLB data</li>
                      <li>Real player profile + season stats</li>
                      <li>Manual switching between hitting and pitching stats</li>
                    </ul>
                  </div>

                  <div className="notice">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                      <AlertCircle size={16} color="#b45309" /> Recognition notes
                    </div>
                    <ul className="helper-list" style={{ marginTop: 10 }}>
                      <li>Recognition depends on image quality and player visibility</li>
                      <li>Low-confidence or partial images may still require manual search</li>
                      <li>Manual MLB player search remains available as a fallback</li>
                    </ul>
                  </div>

                  <div className="notice" style={{ gridColumn: "1 / -1" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                      <Shield size={16} color="#475569" /> Secure flow
                    </div>
                    <p className="footer-note" style={{ margin: "10px 0 0" }}>
                      Your GitHub Pages app captures the image, sends it to a Cloudflare Worker, the Worker uses the server-side secret to call AI, and the browser only receives the candidate player result.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Production notes</h2>
            </div>
            <div className="card-body">
              <div className="notice">
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                  <Trophy size={16} color="#1d4ed8" /> Current architecture
                </div>
                <ul className="helper-list" style={{ marginTop: 10 }}>
                  <li>GitHub Pages hosts the React UI</li>
                  <li>Cloudflare Worker securely stores the API key</li>
                  <li>Worker returns player candidates to the browser</li>
                  <li>Browser uses MLB public APIs to load player details and season stats</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
