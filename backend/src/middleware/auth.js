import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { pool } from "../db/pool.js";

export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessExpires });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpires });
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing auth token" });

  try {
    req.user = jwt.verify(token, env.jwtAccessSecret);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireWorkspaceRole(allowedRoles = []) {
  return async (req, res, next) => {
    const workspaceId = req.params.workspaceId;
    if (!workspaceId) return res.status(400).json({ error: "workspaceId is required" });

    const membership = await pool.query(
      `SELECT role
       FROM workspace_memberships
       WHERE workspace_id = $1 AND user_id = $2`,
      [workspaceId, req.user.userId]
    );

    if (!membership.rowCount) {
      return res.status(403).json({ error: "Not a workspace member" });
    }

    const role = membership.rows[0].role;
    req.workspaceRole = role;
    if (allowedRoles.length && !allowedRoles.includes(role)) {
      return res.status(403).json({ error: "Insufficient role" });
    }

    return next();
  };
}
