import { getForecast } from "../services/weather.service.js";
import { decideIrrigation } from "../services/decisionEngine.service.js";

export async function getIrrigationAdvice(req, res) {
  const { latitude, longitude, soilType, crop } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: "latitude and longitude are required" });
  }

  try {
    const forecast = await getForecast(latitude, longitude);
    const advice = decideIrrigation({ forecast, soilType });

    res.json({
      crop,
      forecast,
      advice,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not fetch weather or compute advice" });
  }
}