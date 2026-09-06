import { Router } from "express";
import { readSensor, simulateIrrigation } from "../controllers/sensor.controller.js";

const router = Router();

router.get("/reading", readSensor);
router.post("/simulate-irrigation", simulateIrrigation);

export default router;