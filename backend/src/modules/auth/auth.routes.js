import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../db/pool.js";
import { env } from "../../config/env.js";
import { requireAuth, requireWorkspaceRole, signAccessToken, signRefreshToken } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  createJoinCodeSchema,
  loginSchema,
  registerSchema,
  resetStudentPasswordSchema,
  toggleJoinCodeSchema,
} from "./auth.schemas.js";

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
    joinCode,
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
    let profileSchoolCode = schoolCode || "";
    let profileInstructor = instructor || "";
    if (!workspaceId && role === "student") {
      if (!joinCode) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Student signup requires a teacher join code." });
      }
      if (joinCode) {
        const codeResult = await client.query(
          `SELECT workspace_id, school_code, instructor
           FROM join_codes
           WHERE UPPER(code) = UPPER($1) AND active = TRUE
           LIMIT 1`,
          [joinCode.trim()]
        );
        if (!codeResult.rowCount) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "Invalid or inactive join code" });
        }
        workspaceId = codeResult.rows[0].workspace_id;
        profileSchoolCode = codeResult.rows[0].school_code || profileSchoolCode;
        profileInstructor = codeResult.rows[0].instructor || profileInstructor;
      } else {
        const existingWorkspace = await client.query(
          `SELECT id FROM workspaces WHERE name = $1 ORDER BY created_at ASC LIMIT 1`,
          [workspaceName]
        );
        if (existingWorkspace.rowCount) {
          workspaceId = existingWorkspace.rows[0].id;
        }
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
      [
        user.id,
        workspaceId,
        profileSchoolCode,
        profileInstructor,
        period || "",
        groupCode || "",
        studentCode || "",
      ]
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

router.get(
  "/workspaces/:workspaceId/join-codes",
  requireAuth,
  requireWorkspaceRole(["owner", "teacher"]),
  async (req, res) => {
    const { workspaceId } = req.params;
    const result = await pool.query(
      `SELECT id, code, school_code, instructor, active, created_at
       FROM join_codes
       WHERE workspace_id = $1
       ORDER BY created_at DESC`,
      [workspaceId]
    );
    res.json({ joinCodes: result.rows });
  }
);

router.post(
  "/workspaces/:workspaceId/join-codes",
  requireAuth,
  requireWorkspaceRole(["owner", "teacher"]),
  validate(createJoinCodeSchema),
  async (req, res, next) => {
    try {
      const { workspaceId } = req.params;
      const { code, schoolCode, instructor, active } = req.validated.body;
      const created = await pool.query(
        `INSERT INTO join_codes (workspace_id, created_by, code, school_code, instructor, active)
         VALUES ($1, $2, UPPER($3), $4, $5, $6)
         RETURNING id, code, school_code, instructor, active, created_at`,
        [workspaceId, req.user.userId, code.trim(), schoolCode || "", instructor || "", active]
      );
      res.status(201).json({ joinCode: created.rows[0] });
    } catch (error) {
      if (String(error.message).includes("join_codes_code_key")) {
        return res.status(409).json({ error: "Join code already exists" });
      }
      next(error);
    }
  }
);

router.patch(
  "/workspaces/:workspaceId/join-codes/:codeId",
  requireAuth,
  requireWorkspaceRole(["owner", "teacher"]),
  validate(toggleJoinCodeSchema),
  async (req, res) => {
    const { workspaceId, codeId } = req.params;
    const { active } = req.validated.body;
    const result = await pool.query(
      `UPDATE join_codes
       SET active = $1
       WHERE id = $2 AND workspace_id = $3
       RETURNING id, code, school_code, instructor, active, created_at`,
      [active, codeId, workspaceId]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Join code not found" });
    res.json({ joinCode: result.rows[0] });
  }
);

router.post(
  "/workspaces/:workspaceId/users/:userId/reset-password",
  requireAuth,
  requireWorkspaceRole(["owner", "teacher"]),
  validate(resetStudentPasswordSchema),
  async (req, res) => {
    const { workspaceId, userId } = req.params;
    const { newPassword } = req.validated.body;

    const student = await pool.query(
      `SELECT wm.user_id
       FROM workspace_memberships wm
       WHERE wm.workspace_id = $1 AND wm.user_id = $2 AND wm.role = 'student'`,
      [workspaceId, userId]
    );
    if (!student.rowCount) {
      return res.status(404).json({ error: "Student not found in this workspace" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, userId]);
    await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId]);
    res.status(204).send();
  }
);

export default router;
