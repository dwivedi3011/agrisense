import { useEffect, useState } from "react";

const STORAGE_KEY = "agrisense_settings";

export default function App() {
  const [locationStatus, setLocationStatus] = useState("locating");
  const [coords, setCoords] = useState(null);

  const [crop, setCrop] = useState("wheat");
  const [soilType, setSoilType] = useState("loamy");
  const [sowingDate, setSowingDate] = useState("");

  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);
  const [irrigationResult, setIrrigationResult] = useState(null);
  const [calendarResult, setCalendarResult] = useState(null);
  const [sowingWindowResult, setSowingWindowResult] = useState(null);

  // Disease detection state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [diseaseResult, setDiseaseResult] = useState(null);
  const [diseaseLoading, setDiseaseLoading] = useState(false);
  const [diseaseError, setDiseaseError] = useState(null);

  const [showSettings, setShowSettings] = useState(true);

  // Load saved settings on first load
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setCrop(parsed.crop || "wheat");
      setSoilType(parsed.soilType || "loamy");
      setSowingDate(parsed.sowingDate || "");
      if (parsed.sowingDate) setShowSettings(false); // hide settings if already configured
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocationStatus("ready");
      },
      () => setLocationStatus("denied"),
      { timeout: 10000 }
    );
  }, []);

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ crop, soilType, sowingDate }));
    setShowSettings(false);
    refreshDashboard();
  }

  async function refreshDashboard() {
    setDashboardLoading(true);
    setDashboardError(null);
    setIrrigationResult(null);
    setCalendarResult(null);
    setSowingWindowResult(null);

    try {
      const requests = [
        fetch("http://localhost:5000/api/irrigation/advice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ crop, soilType, ...coords }),
        }).then((r) => r.json()),
      ];

      if (sowingDate) {
        requests.push(
          fetch("http://localhost:5000/api/calendar/stage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ crop, sowingDate }),
          }).then((r) => r.json())
        );
      } else {
        requests.push(
          fetch(`http://localhost:5000/api/calendar/sowing-window/${crop}`).then((r) => r.json())
        );
      }

      const [irrigation, second] = await Promise.all(requests);
      setIrrigationResult(irrigation);
      if (sowingDate) {
        setCalendarResult(second);
      } else {
        setSowingWindowResult(second);
      }
    } catch (err) {
      setDashboardError("Could not load dashboard. Is the backend running?");
    } finally {
      setDashboardLoading(false);
    }
  }

  // Auto-refresh once location + settings are ready
  useEffect(() => {
    if (locationStatus === "ready" && !showSettings) {
      refreshDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationStatus, showSettings]);

  function handlePhotoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setDiseaseResult(null);
    setDiseaseError(null);
  }

  async function analyzePhoto() {
    if (!photoFile) {
      setDiseaseError("Please select a photo first.");
      return;
    }
    setDiseaseLoading(true);
    setDiseaseError(null);
    setDiseaseResult(null);

    const formData = new FormData();
    formData.append("photo", photoFile);
    if (coords) {
      formData.append("latitude", coords.latitude);
      formData.append("longitude", coords.longitude);
    }

    try {
      const res = await fetch("http://localhost:5000/api/disease/analyze", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setDiseaseResult(data);
    } catch (err) {
      setDiseaseError("Could not analyze photo. Is the backend/ML service running?");
    } finally {
      setDiseaseLoading(false);
    }
  }

  function getFieldActivitySuggestion() {
    if (!irrigationResult) return null;
    const { rainProbability, maxWindSpeed } = irrigationResult.forecast;
    if (rainProbability >= 60) return "🌧️ Rain likely — avoid field spraying today.";
    if (maxWindSpeed >= 15) return "💨 Windy conditions — better suited for irrigation, not spraying.";
    return "☀️ Good conditions for general field work today.";
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-icon">🌾</span>
        <h1>AgriSense</h1>
        <p className="tagline">Simple, clear farm advice — powered by weather and crop data.</p>
      </header>

      {locationStatus === "locating" && (
        <div className="status-banner status-checking">📍 Getting your location...</div>
      )}
      {locationStatus === "denied" && (
        <div className="status-banner status-error">
          ⚠️ Location access denied. Please allow location access and reload the page.
        </div>
      )}

      {/* --- Settings (shown first time, or when editing) --- */}
      {showSettings && locationStatus === "ready" && (
        <div className="form-card">
          <label>
            Crop
            <select value={crop} onChange={(e) => setCrop(e.target.value)}>
              <option value="wheat">🌾 Wheat</option>
              <option value="tomato">🍅 Tomato</option>
            </select>
          </label>

          <label>
            Soil type
            <select value={soilType} onChange={(e) => setSoilType(e.target.value)}>
              <option value="sandy">Sandy</option>
              <option value="loamy">Loamy</option>
              <option value="clay">Clay</option>
            </select>
          </label>

          <label>
            {crop === "tomato" ? "Transplanting date (leave blank if not sown yet)" : "Sowing date (leave blank if not sown yet)"}
            <input
              type="date"
              value={sowingDate}
              onChange={(e) => setSowingDate(e.target.value)}
            />
          </label>

          <button onClick={saveSettings}>Save & View Dashboard</button>
        </div>
      )}

      {/* --- Dashboard (main view) --- */}
      {!showSettings && locationStatus === "ready" && (
        <>
          <div className="dashboard-toolbar">
            <span className="dashboard-crop-label">
              {crop === "wheat" ? "🌾" : "🍅"} {crop.charAt(0).toUpperCase() + crop.slice(1)}
            </span>
            <button className="link-button" onClick={() => setShowSettings(true)}>
              ⚙️ Edit
            </button>
            <button className="link-button" onClick={refreshDashboard} disabled={dashboardLoading}>
              🔄 Refresh
            </button>
          </div>

          {dashboardLoading && (
            <div className="status-banner status-checking">Loading today's advice...</div>
          )}
          {dashboardError && <div className="status-banner status-error">{dashboardError}</div>}

          {irrigationResult && (
            <div className={`advice-card verdict-${irrigationResult.advice.verdict}`}>
              <div className="advice-icon">{irrigationResult.advice.icon}</div>
              <div className="advice-verdict">{irrigationResult.advice.verdict}</div>
              <p className="advice-reason">{irrigationResult.advice.reason}</p>
              <div className="advice-meta">
                <span>🌡️ {Math.round(irrigationResult.forecast.avgTemperature)}°C</span>
                <span>💧 {Math.round(irrigationResult.forecast.avgHumidity)}% humidity</span>
                <span>🐛 Disease risk: {irrigationResult.advice.diseaseRisk}</span>
              </div>
            </div>
          )}

          {irrigationResult && (
            <div className="status-banner status-checking">
              {getFieldActivitySuggestion()}
            </div>
          )}

          {calendarResult && calendarResult.status === "in_progress" && (
            <div className="calendar-card">
              <div className="calendar-header">
                <span className="calendar-icon">{calendarResult.icon}</span>
                <div>
                  <div className="calendar-crop-name">{calendarResult.crop}</div>
                  <div className="calendar-days">Day {calendarResult.daysSinceSowing} since sowing</div>
                </div>
              </div>

              <div className="stage-badge">{formatStageName(calendarResult.currentStage.name)}</div>

              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${
                      (calendarResult.currentStage.dayWithinStage /
                        calendarResult.currentStage.totalDaysInStage) *
                      100
                    }%`,
                  }}
                />
              </div>
              <p className="progress-label">
                Day {calendarResult.currentStage.dayWithinStage} of{" "}
                {calendarResult.currentStage.totalDaysInStage} in this stage —{" "}
                {calendarResult.currentStage.daysRemainingInStage} days remaining
              </p>

              <div className="calendar-info-block">
                <strong>🌱 What to do now:</strong>
                <p>{calendarResult.currentStage.care}</p>
              </div>

              <div className="calendar-info-block">
                <strong>🧪 Fertilizer:</strong>
                <p>{calendarResult.currentStage.npk}</p>
              </div>

              {calendarResult.nextStage && (
                <p className="next-stage-note">
                  ⏭️ Next stage ({formatStageName(calendarResult.nextStage.name)}) begins in{" "}
                  {calendarResult.nextStage.startsInDays} days.
                </p>
              )}
            </div>
          )}

          {calendarResult && calendarResult.status === "past_maturity" && (
            <div className="status-banner status-error">⚠️ {calendarResult.message}</div>
          )}

          {sowingWindowResult && (
            <div
              className={`status-banner ${
                sowingWindowResult.isCurrentlyIdealWindow ? "status-connected" : "status-checking"
              }`}
            >
              {sowingWindowResult.isCurrentlyIdealWindow
                ? `✅ Now is within the ideal sowing window for ${sowingWindowResult.crop} (${sowingWindowResult.recommendedWindow}).`
                : `⏳ Not sown yet. Ideal window for ${sowingWindowResult.crop}: ${sowingWindowResult.recommendedWindow}.`}
            </div>
          )}

          {/* --- Pest/Disease Detection --- */}
          <section className="section-block">
            <h2 className="section-title">🐛 Check Plant Health</h2>
            <div className="form-card">
              <label>
                Upload a photo of the leaf
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} />
              </label>

              {photoPreview && (
                <img src={photoPreview} alt="Selected leaf" className="photo-preview" />
              )}

              <button onClick={analyzePhoto} disabled={diseaseLoading || !photoFile}>
                {diseaseLoading ? "Analyzing..." : "Analyze Photo"}
              </button>
            </div>

            {diseaseError && <div className="status-banner status-error">{diseaseError}</div>}

            {diseaseResult && diseaseResult.status === "low_confidence" && (
              <div className="status-banner status-checking">📷 {diseaseResult.message}</div>
            )}

            {diseaseResult && diseaseResult.status === "ok" && (
              <div className={`disease-card ${diseaseResult.isHealthy ? "healthy" : "unhealthy"}`}>
                <div className="disease-icon">{diseaseResult.isHealthy ? "✅" : "🐛"}</div>
                <div className="disease-name">{formatDiseaseName(diseaseResult.predictedClass)}</div>
                <p className="disease-confidence">
                  Confidence: {Math.round(diseaseResult.confidence * 100)}%
                </p>
                {diseaseResult.sprayAdvice && (
                  <div className="calendar-info-block">
                    <strong>💨 Spray timing:</strong>
                    <p>{diseaseResult.sprayAdvice}</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function formatStageName(name) {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDiseaseName(name) {
  return name.replace("Tomato___", "").replace(/_/g, " ");
}