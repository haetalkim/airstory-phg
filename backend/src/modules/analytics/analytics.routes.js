import express from "express";
import { stringify } from "csv-stringify/sync";
import { pool } from "../../db/pool.js";
import { requireAuth, requireWorkspaceRole } from "../../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

router.get(
  "/workspaces/:workspaceId/analytics/summary",
  requireWorkspaceRole(["owner", "teacher", "student"]),
  async (req, res) => {
    const { workspaceId } = req.params;
    const { metric = "pm25", from, to } = req.query;
    if (!["pm25", "co", "temp", "humidity"].includes(metric)) {
      return res.status(400).json({ error: "Invalid metric" });
    }
    const values = [workspaceId];
    const where = ["workspace_id = $1"];
    if (from) {
      values.push(from);
      where.push(`captured_at >= $${values.length}`);
    }
    if (to) {
      values.push(to);
      where.push(`captured_at <= $${values.length}`);
    }
    const result = await pool.query(
      `SELECT
        AVG(${metric}) AS mean,
        MIN(${metric}) AS min,
        MAX(${metric}) AS max,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${metric}) AS median,
        STDDEV_POP(${metric}) AS stddev,
        COUNT(*) AS sample_count
      FROM measurements
      WHERE ${where.join(" AND ")}`,
      values
    );

    res.json({ metric, summary: result.rows[0] });
  }
);

router.get(
  "/workspaces/:workspaceId/heatmap",
  requireWorkspaceRole(["owner", "teacher", "student"]),
  async (req, res) => {
    const { workspaceId } = req.params;
    const { metric = "pm25" } = req.query;
    if (!["pm25", "co", "temp", "humidity"].includes(metric)) {
      return res.status(400).json({ error: "Invalid metric" });
    }
    const result = await pool.query(
      `SELECT
        ROUND(CAST(latitude AS numeric), 4) AS latitude,
        ROUND(CAST(longitude AS numeric), 4) AS longitude,
        AVG(${metric}) AS value,
        COUNT(*) AS point_count
      FROM measurements
      WHERE workspace_id = $1
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
      GROUP BY 1, 2
      ORDER BY point_count DESC`,
      [workspaceId]
    );
    res.json({ metric, points: result.rows });
  }
);

router.get(
  "/workspaces/:workspaceId/export/measurements.csv",
  requireWorkspaceRole(["owner", "teacher", "student"]),
  async (req, res) => {
    const { workspaceId } = req.params;
    const result = await pool.query(
      `SELECT
        m.id, m.captured_at, m.pm25, m.co, m.temp, m.humidity, m.latitude, m.longitude, m.indoor_outdoor,
        s.session_code, s.name AS session_name, s.school_code, s.instructor, s.period, s.group_code
      FROM measurements m
      JOIN sessions s ON s.id = m.session_id
      WHERE m.workspace_id = $1
      ORDER BY m.captured_at DESC`,
      [workspaceId]
    );

    const csv = stringify(result.rows, { header: true });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=measurements.csv");
    res.status(200).send(csv);
  }
);

export default router;
