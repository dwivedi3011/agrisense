import { useEffect, useState } from "react";

export default function App() {
  const [locationStatus, setLocationStatus] = useState("locating");
  const [coords, setCoords] = useState(null);
  const [soilType, setSoilType] = useState("loamy");
  const [crop, setCrop] = useState("wheat");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cultivation calendar state
  const [sowingDate, setSowingDate] = useState("");
  const [calendarResult, setCalendarResult] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState(null);

  // Sowing-window check state
  const [sowingWindowResult, setSowingWindowResult] = useState(null);
  const [sowingWindowLoading, setSowingWindowLoading] = useState(false);
  const [sowingWindowError, setSowingWindowError] = useState(null);

  // Disease detection state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [diseaseResult, setDiseaseResult] = useState(null);
  const [diseaseLoading, setDiseaseLoading] = useState(false);
  const [diseaseError, setDiseaseError] = useState(null);

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

  async function getAdvice() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("http://localhost:5000/api/irrigation/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crop, soilType, ...coords }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError("Could not get advice. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  async function getCalendarStage() {
    if (!sowingDate) {
      setCalendarError("Please pick a sowing date first.");
      return;
    }
    setCalendarLoading(true);
    setCalendarError(null);
    setCalendarResult(null);
    try {
      const res = await fetch("http://localhost:5000/api/calendar/stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crop, sowingDate }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setCalendarResult(data);
    } catch (err) {
      setCalendarError("Could not get calendar info. Is the backend running?");
    } finally {
      setCalendarLoading(false);
    }
  }

  async function checkSowingWindow() {
    setSowingWindowLoading(true);
    setSowingWindowError(null);
    setSowingWindowResult(null);
    try {
      const res = await fetch(`http://localhost:5000/api/calendar/sowing-window/${crop}`);
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setSowingWindowResult(data);
    } catch (err) {
      setSowingWindowError("Could not check sowing window. Is the backend running?");
    } finally {
      setSowingWindowLoading(false);
    }
  }

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

      {locationStatus === "ready" && (
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

          <button onClick={getAdvice} disabled={loading}>
            {loading ? "Checking..." : "Get Today's Irrigation Advice"}
          </button>
        </div>
      )}

      {error && <div className="status-banner status-error">{error}</div>}

      {result && (
        <div className={`advice-card verdict-${result.advice.verdict}`}>
          <div className="advice-icon">{result.advice.icon}</div>
          <div className="advice-verdict">{result.advice.verdict}</div>
          <p className="advice-reason">{result.advice.reason}</p>
          <div className="advice-meta">
            <span>🌡️ {Math.round(result.forecast.avgTemperature)}°C</span>
            <span>💧 {Math.round(result.forecast.avgHumidity)}% humidity</span>
            <span>🐛 Disease risk: {result.advice.diseaseRisk}</span>
          </div>
        </div>
      )}

      {/* --- Cultivation Calendar Section --- */}
      <section className="section-block">
        <h2 className="section-title">📅 Cultivation Calendar</h2>

        <div className="form-card">
          <p className="sowing-window-prompt">
            Not sown yet? Check if now is a good time for <strong>{crop}</strong>.
          </p>
          <button onClick={checkSowingWindow} disabled={sowingWindowLoading}>
            {sowingWindowLoading ? "Checking..." : "Is Now a Good Time to Sow?"}
          </button>
        </div>

        {sowingWindowError && <div className="status-banner status-error">{sowingWindowError}</div>}

        {sowingWindowResult && (
          <div
            className={`status-banner ${
              sowingWindowResult.isCurrentlyIdealWindow ? "status-connected" : "status-checking"
            }`}
          >
            {sowingWindowResult.isCurrentlyIdealWindow
              ? `✅ Yes — now is within the ideal sowing window for ${sowingWindowResult.crop} (${sowingWindowResult.recommendedWindow}).`
              : `⏳ Not the ideal window right now. Recommended window for ${sowingWindowResult.crop} is ${sowingWindowResult.recommendedWindow}.`}
          </div>
        )}

        <div className="form-card">
          <label>
            {crop === "tomato" ? "Transplanting date" : "Sowing date"}
            <input
              type="date"
              value={sowingDate}
              onChange={(e) => setSowingDate(e.target.value)}
            />
          </label>
          <button onClick={getCalendarStage} disabled={calendarLoading}>
            {calendarLoading ? "Checking..." : "Check Crop Stage"}
          </button>
        </div>

        {calendarError && <div className="status-banner status-error">{calendarError}</div>}

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

        {calendarResult && calendarResult.status === "not_yet_sown" && (
          <div className="status-banner status-checking">
            📅 {calendarResult.message} ({calendarResult.daysUntilStart} days to go)
          </div>
        )}

        {calendarResult && calendarResult.status === "past_maturity" && (
          <div className="status-banner status-error">⚠️ {calendarResult.message}</div>
        )}
      </section>

      {/* --- Pest/Disease Detection Section --- */}
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
            <div className="disease-name">
              {formatDiseaseName(diseaseResult.predictedClass)}
            </div>
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
  return name
    .replace("Tomato___", "")
    .replace(/_/g, " ");
}