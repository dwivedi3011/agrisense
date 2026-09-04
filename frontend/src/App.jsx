import { useEffect, useState } from "react";

export default function App() {
  const [locationStatus, setLocationStatus] = useState("locating"); // locating | ready | denied
  const [coords, setCoords] = useState(null);
  const [soilType, setSoilType] = useState("loamy");
  const [crop, setCrop] = useState("wheat");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
            {loading ? "Checking..." : "Get Today's Advice"}
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
    </div>
  );
}