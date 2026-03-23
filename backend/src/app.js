import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import authRoutes from "./modules/auth/auth.routes.js";
import sensorRoutes from "./modules/sensor/sensor.routes.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";
import sheetsRoutes from "./modules/sheets/sheets.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());

  app.get("/health", (req, res) => {
    res.json({ ok: true, environment: env.nodeEnv });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api", sensorRoutes);
  app.use("/api", analyticsRoutes);
  app.use("/api", sheetsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
