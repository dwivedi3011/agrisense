import { getMandiPrices } from "../services/mandiPrice.service.js";

export async function getPrices(req, res) {
  const { crop } = req.params;
  const { state } = req.query;

  try {
    const result = await getMandiPrices(crop, state || "Uttar Pradesh");
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not fetch mandi prices", detail: err.message });
  }
}