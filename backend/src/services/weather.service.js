import axios from "axios";

// Fetches forecast for the next 48 hours using Open-Meteo (free, no API key)
export async function getForecast(latitude, longitude) {
  const url = "https://api.open-meteo.com/v1/forecast";

  const response = await axios.get(url, {
    params: {
      latitude,
      longitude,
      hourly: "precipitation_probability,temperature_2m,relative_humidity_2m,wind_speed_10m",
      forecast_days: 2,
      timezone: "auto",
    },
  });

  const hourly = response.data.hourly;

  // Look at the next 24 hours only
  const next24 = {
    rainProbability: Math.max(...hourly.precipitation_probability.slice(0, 24)),
    avgTemperature: average(hourly.temperature_2m.slice(0, 24)),
    avgHumidity: average(hourly.relative_humidity_2m.slice(0, 24)),
    maxWindSpeed: Math.max(...hourly.wind_speed_10m.slice(0, 24)),
  };

  return next24;
}

function average(arr) {
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}