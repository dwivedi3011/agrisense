import { Router } from "express";
import multer from "multer";
import { analyzeCropPhoto } from "../controllers/disease.controller.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post("/analyze", upload.single("photo"), analyzeCropPhoto);

export default router;