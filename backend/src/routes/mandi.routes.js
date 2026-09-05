import { Router } from "express";
import { getPrices } from "../controllers/mandi.controller.js";

const router = Router();

router.get("/prices/:crop", getPrices);

export default router;