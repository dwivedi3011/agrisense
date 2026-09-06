// Simulated soil moisture sensor.
// No real hardware yet — this maintains an in-memory "virtual sensor" state
// that decays realistically over time and resets on simulated irrigation events.
// Designed so a real MQTT/HTTP sensor feed could replace this module later
// without changing the API shape (getSensorReading / recordIrrigationEvent).

const DAILY_DEPLETION_RATE = {
  sandy: 8,
  loamy: 5,
  clay: 3,
};

// In-memory state (single simulated field for now — resets if server restarts)
let sensorState = {
  soilMoisturePercent: 55,
  soilType: "loamy",
  lastUpdated: new Date(),
};

export function configureSensor(soilType) {
  sensorState.soilType = soilType;
}

/**
 * Computes the current sensor reading by applying moisture decay
 * since the last update, plus small random sensor noise for realism.
 */
export function getSensorReading(avgTemperature = 25) {
  const now = new Date();
  const hoursSinceUpdate = (now - sensorState.lastUpdated) / (1000 * 60 * 60);
  const daysSinceUpdate = hoursSinceUpdate / 24;

  const baseDailyLoss = DAILY_DEPLETION_RATE[sensorState.soilType] || DAILY_DEPLETION_RATE.loamy;
  const tempMultiplier = avgTemperature > 32 ? 1.3 : avgTemperature < 15 ? 0.7 : 1.0;
  const decay = baseDailyLoss * tempMultiplier * daysSinceUpdate;

  const noise = (Math.random() - 0.5) * 2; // +/- 1% sensor noise, for realism
  const currentMoisture = Math.max(0, Math.min(100, sensorState.soilMoisturePercent - decay + noise));

  let status = "LOW";
  if (currentMoisture >= 55) status = "OPTIMAL";
  else if (currentMoisture >= 35) status = "MODERATE";

  return {
    soilMoisturePercent: Math.round(currentMoisture * 10) / 10,
    soilType: sensorState.soilType,
    status,
    lastReadingAt: now.toISOString(),
    minutesSinceLastIrrigation: Math.round(hoursSinceUpdate * 60),
  };
}

/**
 * Simulates an irrigation event — resets moisture up, as real irrigation would.
 */
export function recordIrrigationEvent() {
  sensorState.soilMoisturePercent = 85; // freshly irrigated soil
  sensorState.lastUpdated = new Date();
  return getSensorReading();
}