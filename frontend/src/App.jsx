import { useEffect, useState } from "react";

export default function App() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    fetch("http://localhost:5000/api/health")
      .then((res) => res.json())
      .then(() => setStatus("connected"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-icon">🌾</span>
        <h1>AgriSense</h1>
        <p className="tagline">Simple, clear farm advice — powered by weather and crop data.</p>
      </header>

      <div className={`status-banner status-${status}`}>
        {status === "checking" && "Checking connection to backend..."}
        {status === "connected" && "✅ Backend connected — Phase 0 complete."}
        {status === "error" && "⚠️ Could not reach backend. Is it running on port 5000?"}
      </div>

      <main className="placeholder-main">
        <p>The irrigation, disease-detection, and cultivation-calendar screens arrive in later phases.</p>
      </main>
    </div>
  );
}