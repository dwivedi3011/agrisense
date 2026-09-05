import { Router } from "express";
import { simulateSkipIrrigation, simulateRainScenario } from "../controllers/whatIf.controller.js";

const router = Router();

router.post("/skip-irrigation", simulateSkipIrrigation);
router.post("/rain-scenario", simulateRainScenario);

export default router;