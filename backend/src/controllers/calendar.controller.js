import { getCropStageInfo, checkSowingWindow } from "../services/calendarEngine.service.js";

export function getStage(req, res) {
  const { crop, sowingDate } = req.body;
  if (!crop || !sowingDate) {
    return res.status(400).json({ error: "crop and sowingDate are required" });
  }
  try {
    const result = getCropStageInfo(crop, sowingDate);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export function getSowingWindow(req, res) {
  const { crop } = req.params;
  try {
    const result = checkSowingWindow(crop);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}