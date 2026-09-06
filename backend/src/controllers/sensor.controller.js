import { getSensorReading, recordIrrigationEvent, configureSensor } from "../services/sensorSimulator.service.js";
import { getForecast } from "../services/weather.service.js";

export async function readSensor(req, res) {
  const { soilType, latitude, longitude } = req.query;

  try {
    if (soilType) configureSensor(soilType);

    let avgTemperature = 25;
    if (latitude && longitude) {
      const forecast = await getForecast(parseFloat(latitude), parseFloat(longitude));
      avgTemperature = forecast.avgTemperature;
    }

    const reading = getSensorReading(avgTemperature);
    res.json(reading);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not read sensor" });
  }
}

export function simulateIrrigation(req, res) {
  const reading = recordIrrigationEvent();
  res.json({ message: "Irrigation event recorded", reading });
}