  import express from "express";
  import cors from "cors";
  import irrigationRoutes from "./routes/irrigation.routes.js";
  import calendarRoutes from "./routes/calendar.routes.js";
  import diseaseRoutes from "./routes/disease.routes.js";
  import whatIfRoutes from "./routes/whatIf.routes.js";
  import mandiRoutes from "./routes/mandi.routes.js";
  import dotenv from "dotenv";

  const app = express();
    dotenv.config();
  const PORT = 5000;

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      message: "AgriSense backend is running",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/irrigation", irrigationRoutes);
  app.use("/api/calendar", calendarRoutes);
  app.use("/api/disease", diseaseRoutes);
  app.use("/api/whatif", whatIfRoutes);
  app.use("/api/mandi", mandiRoutes);


  app.listen(PORT, () => {
    console.log(`AgriSense backend running on http://localhost:${PORT}`);
  });