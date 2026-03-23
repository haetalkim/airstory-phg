import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../db/pool.js";
import { env } from "../../config/env.js";
import { requireAuth, signAccessToken, signRefreshToken } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";

const router = express.Router();

function makeAuthResponse(user, workspaceId) {
  const payload = { userId: user.id, email: user.email };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      workspaceId,
    },
  };
}

router.post("/register", validate(registerSchema), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      email,
      password,
      fullName,
      workspaceName,
      role,
      schoolCode,
      instructor,
      period,
      groupCode,
      studentCode,
      joinWorkspaceId,
    } = req.validated.body;
    const passwordHash = await bcrypt.hash(password, 10);

    await client.query("BEGIN");
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name`,
      [email, passwordHash, fullName]
    );
    const user = userResult.rows[0];

    let workspaceId = joinWorkspaceId;
    if (!workspaceId && role === "student") {
      const existingWorkspace = await client.query(
        `SELECT id FROM workspaces WHERE name = $1 ORDER BY created_at ASC LIMIT 1`,
        [workspaceName]
      );
      if (existingWorkspace.rowCount) {
        workspaceId = existingWorkspace.rows[0].id;
      }
    }
    if (!workspaceId) {
      const wsResult = await client.query(
        `INSERT INTO workspaces (name, created_by)
         VALUES ($1, $2)
         RETURNING id`,
        [workspaceName, user.id]
      );
      workspaceId = wsResult.rows[0].id;
    }

    await client.query(
      `INSERT INTO workspace_memberships (workspace_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [workspaceId, user.id, joinWorkspaceId ? role : "owner"]
    );

    await client.query(
      `INSERT INTO user_profiles (
        user_id, workspace_id, school_code, instructor, period, group_code, student_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.id, workspaceId, schoolCode || "", instructor || "", period || "", groupCode || "", studentCode || ""]
    );

    const auth = makeAuthResponse(user, workspaceId);
    await client.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
      [user.id, auth.refreshToken]
    );

    await client.query("COMMIT");
    res.status(201).json(auth);
  } catch (error) {
    await client.query("ROLLBACK");
    if (String(error.message).includes("users_email_key")) {
      return res.status(409).json({ error: "Email already exists" });
    }
    return next(error);
  } finally {
    client.release();
  }
});

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validated.body;
    const userResult = await pool.query(
      `SELECT id, email, full_name, password_hash FROM users WHERE email = $1`,
      [email]
    );
    if (!userResult.rowCount) return res.status(401).json({ error: "Invalid credentials" });
    const user = userResult.rows[0];

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const wsResult = await pool.query(
      `SELECT workspace_id FROM workspace_memberships WHERE user_id = $1 ORDER BY workspace_id LIMIT 1`,
      [user.id]
    );
    const workspaceId = wsResult.rows[0]?.workspace_id || null;

    const auth = makeAuthResponse(user, workspaceId);
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
      [user.id, auth.refreshToken]
    );
    res.json(auth);
  } catch (error) {
    next(error);
  }
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: "refreshToken is required" });
  try {
    const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);
    const tokenResult = await pool.query(
      `SELECT 1 FROM refresh_tokens
       WHERE token = $1 AND user_id = $2 AND expires_at > NOW()`,
      [refreshToken, decoded.userId]
    );
    if (!tokenResult.rowCount) return res.status(401).json({ error: "Refresh token invalid" });

    const accessToken = signAccessToken({ userId: decoded.userId, email: decoded.email });
    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ error: "Refresh token invalid" });
  }
});

router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body || {};
  if (refreshToken) {
    await pool.query(`DELETE FROM refresh_tokens WHERE token = $1`, [refreshToken]);
  }
  res.status(204).send();
});

router.get("/me", requireAuth, async (req, res) => {
  const userResult = await pool.query(
    `SELECT id, email, full_name FROM users WHERE id = $1`,
    [req.user.userId]
  );
  const wsResult = await pool.query(
    `SELECT workspace_id, role FROM workspace_memberships WHERE user_id = $1`,
    [req.user.userId]
  );
  const profileResult = await pool.query(
    `SELECT workspace_id, school_code, instructor, period, group_code, student_code
     FROM user_profiles
     WHERE user_id = $1
     LIMIT 1`,
    [req.user.userId]
  );
  res.json({
    user: userResult.rows[0],
    memberships: wsResult.rows,
    profile: profileResult.rows[0] || null,
  });
});

router.get("/workspaces/:workspaceId/roster", requireAuth, async (req, res) => {
  const { workspaceId } = req.params;
  const membership = await pool.query(
    `SELECT role FROM workspace_memberships WHERE workspace_id = $1 AND user_id = $2`,
    [workspaceId, req.user.userId]
  );
  if (!membership.rowCount) return res.status(403).json({ error: "Not a workspace member" });

  const roster = await pool.query(
    `SELECT
      u.id,
      u.full_name,
      u.email,
      wm.role,
      up.school_code,
      up.instructor,
      up.period,
      up.group_code,
      up.student_code
    FROM workspace_memberships wm
    JOIN users u ON u.id = wm.user_id
    LEFT JOIN user_profiles up ON up.user_id = wm.user_id
    WHERE wm.workspace_id = $1
    ORDER BY wm.role DESC, up.period, up.group_code, u.full_name`,
    [workspaceId]
  );

  res.json({ members: roster.rows });
});

export default router;
