import express from "express";
import cors from "cors";
import irrigationRoutes from "./routes/irrigation.routes.js";
import calendarRoutes from "./routes/calendar.routes.js";
import diseaseRoutes from "./routes/disease.routes.js";

const app = express();
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

app.listen(PORT, () => {
  console.log(`AgriSense backend running on http://localhost:${PORT}`);
});