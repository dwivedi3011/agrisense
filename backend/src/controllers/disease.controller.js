import { detectDisease } from "../services/diseaseDetection.service.js";
import { getForecast } from "../services/weather.service.js";

// Simple rule: combine disease result with weather to suggest spray timing
function getSprayAdvice(forecast) {
  const { rainProbability, maxWindSpeed } = forecast;

  if (rainProbability >= 50) {
    return "⏳ Wait — rain expected soon. Spraying now would wash off before it works.";
  }
  if (maxWindSpeed >= 15) {
    return "⏳ Wait — wind is too strong right now. Spray will drift instead of landing on the plant.";
  }
  return "✅ Good conditions to spray today — low rain chance and calm wind.";
}

export async function analyzeCropPhoto(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  const { latitude, longitude } = req.body;

  try {
    const diseaseResult = await detectDisease(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    if (diseaseResult.status === "low_confidence") {
      return res.json(diseaseResult); // just pass through the "retake photo" message
    }

    let sprayAdvice = null;
    if (!diseaseResult.isHealthy && latitude && longitude) {
      const forecast = await getForecast(parseFloat(latitude), parseFloat(longitude));
      sprayAdvice = getSprayAdvice(forecast);
    }

    res.json({
      ...diseaseResult,
      sprayAdvice,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not analyze photo. Is the ML service running?" });
  }
}