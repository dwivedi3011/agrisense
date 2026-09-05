// Simplified soil-moisture simulation.
// Not sensor-driven (no real moisture data yet) — uses soil type + temperature
// as a proxy for evapotranspiration rate. Designed so this can be swapped for
// real sensor readings later without changing the API shape.

const DAILY_DEPLETION_RATE = {
  sandy: 8, // % moisture lost per day at moderate temperature
  loamy: 5,
  clay: 3,
};

const RAINFALL_RETENTION_FACTOR = {
  sandy: 0.5, // drains quickly, retains less
  loamy: 0.7,
  clay: 0.6, // retains well but infiltrates slowly
};

function getTemperatureMultiplier(avgTemperature) {
  if (avgTemperature > 32) return 1.3; // high heat -> faster evapotranspiration
  if (avgTemperature < 15) return 0.7; // cool -> slower moisture loss
  return 1.0;
}

/**
 * Projects soil moisture over the next N days assuming NO irrigation.
 */
export function simulateNoIrrigation({ currentMoisturePercent, soilType, avgTemperature, days = 5 }) {
  const baseDailyLoss = DAILY_DEPLETION_RATE[soilType] || DAILY_DEPLETION_RATE.loamy;
  const tempMultiplier = getTemperatureMultiplier(avgTemperature);
  const dailyLoss = baseDailyLoss * tempMultiplier;

  const projection = [];
  let moisture = currentMoisturePercent;

  for (let day = 1; day <= days; day++) {
    moisture = Math.max(0, moisture - dailyLoss);
    let stressLevel = "LOW";
    if (moisture < 20) stressLevel = "HIGH";
    else if (moisture < 35) stressLevel = "MODERATE";

    projection.push({ day, moisturePercent: Math.round(moisture), stressLevel });
  }

  return {
    dailyLossRate: Math.round(dailyLoss * 10) / 10,
    projection,
  };
}

/**
 * Estimates the soil moisture increase from a given rainfall amount.
 */
export function simulateRainfall({ currentMoisturePercent, rainMm, soilType }) {
  const retention = RAINFALL_RETENTION_FACTOR[soilType] || RAINFALL_RETENTION_FACTOR.loamy;

  // Simplified: each mm of rain contributes ~1% moisture, scaled by soil retention
  const moistureGain = rainMm * retention;
  const newMoisture = Math.min(100, currentMoisturePercent + moistureGain);

  let irrigationNeed = "LOW";
  if (newMoisture < 35) irrigationNeed = "HIGH";
  else if (newMoisture < 55) irrigationNeed = "MODERATE";

  return {
    moistureGain: Math.round(moistureGain),
    projectedMoisturePercent: Math.round(newMoisture),
    irrigationNeed,
  };
}