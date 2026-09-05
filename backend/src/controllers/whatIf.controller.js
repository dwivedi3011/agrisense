import { simulateNoIrrigation, simulateRainfall } from "../services/whatIfEngine.service.js";
import { getForecast } from "../services/weather.service.js";

export async function simulateSkipIrrigation(req, res) {
  const { currentMoisturePercent, soilType, latitude, longitude, days } = req.body;

  if (currentMoisturePercent === undefined || !soilType || !latitude || !longitude) {
    return res.status(400).json({ error: "currentMoisturePercent, soilType, latitude, and longitude are required" });
  }

  try {
    const forecast = await getForecast(parseFloat(latitude), parseFloat(longitude));
    const result = simulateNoIrrigation({
      currentMoisturePercent: parseFloat(currentMoisturePercent),
      soilType,
      avgTemperature: forecast.avgTemperature,
      days: days || 5,
    });
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not run simulation" });
  }
}

export function simulateRainScenario(req, res) {
  const { currentMoisturePercent, soilType, rainMm } = req.body;

  if (currentMoisturePercent === undefined || !soilType || rainMm === undefined) {
    return res.status(400).json({ error: "currentMoisturePercent, soilType, and rainMm are required" });
  }

  const result = simulateRainfall({
    currentMoisturePercent: parseFloat(currentMoisturePercent),
    soilType,
    rainMm: parseFloat(rainMm),
  });
  res.json(result);
}