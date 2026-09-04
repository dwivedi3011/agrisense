// Simple rule-based irrigation decision engine.
// Takes forecast + soil type and returns a clear verdict + reason.

const RAIN_THRESHOLD = 60; // % probability above which we skip irrigation
const SOIL_MOISTURE_RETENTION = {
  sandy: "low",
  loamy: "medium",
  clay: "high",
};

export function decideIrrigation({ forecast, soilType }) {
  const { rainProbability, avgTemperature, avgHumidity } = forecast;
  const retention = SOIL_MOISTURE_RETENTION[soilType] || "medium";

  // Rule 1: High rain probability -> skip irrigation
  if (rainProbability >= RAIN_THRESHOLD) {
    return {
      verdict: "SKIP",
      icon: "🌧️",
      reason: `${Math.round(rainProbability)}% chance of rain in the next 24 hours — no need to irrigate.`,
      diseaseRisk: getDiseaseRisk(avgHumidity, avgTemperature),
    };
  }

  // Rule 2: Sandy soil dries faster -> irrigate even with moderate rain chance
  if (retention === "low" && rainProbability < 40) {
    return {
      verdict: "IRRIGATE",
      icon: "💧",
      reason: "Sandy soil drains quickly and rain chance is low — irrigation recommended today.",
      diseaseRisk: getDiseaseRisk(avgHumidity, avgTemperature),
    };
  }

  // Rule 3: Default — moderate conditions
  if (rainProbability >= 30) {
    return {
      verdict: "WAIT",
      icon: "⏳",
      reason: `${Math.round(rainProbability)}% chance of rain — check again this evening before irrigating.`,
      diseaseRisk: getDiseaseRisk(avgHumidity, avgTemperature),
    };
  }

  return {
    verdict: "IRRIGATE",
    icon: "💧",
    reason: "Low rain chance and soil retention doesn't favor skipping — irrigate today.",
    diseaseRisk: getDiseaseRisk(avgHumidity, avgTemperature),
  };
}

// Simple heuristic: high humidity + warm temps = higher fungal disease risk
function getDiseaseRisk(avgHumidity, avgTemperature) {
  if (avgHumidity > 80 && avgTemperature > 20 && avgTemperature < 32) {
    return "HIGH";
  }
  if (avgHumidity > 65) {
    return "MODERATE";
  }
  return "LOW";
}