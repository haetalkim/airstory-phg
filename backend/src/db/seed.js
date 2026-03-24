import bcrypt from "bcryptjs";
import { pool } from "./pool.js";

async function run() {
  await pool.query("BEGIN");
  try {
    const demoUsers = [
      {
        email: "shim@tamgu.com",
        fullName: "Shim",
        password: "password",
        role: "teacher",
        groupCode: "INSTRUCTOR",
        period: "P1",
        studentCode: "INST001",
      },
      { email: "jiin@tamgu.com", fullName: "Jiin", password: "password", role: "student", groupCode: "G1", period: "P1", studentCode: "STU003" },
      { email: "julia@tamgu.com", fullName: "Julia", password: "password", role: "student", groupCode: "G4", period: "P1", studentCode: "STU019" },
    ];

    const userIds = {};
    for (const user of demoUsers) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      const userRes = await pool.query(
        `INSERT INTO users (email, password_hash, full_name)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           full_name = EXCLUDED.full_name
         RETURNING id`,
        [user.email, passwordHash, user.fullName]
      );
      userIds[user.email] = userRes.rows[0].id;
    }

    const instructorId = userIds["shim@tamgu.com"];
    const workspaceName = "Demo Sensor Platform Workspace";

    let workspaceId;
    const existingWs = await pool.query(
      `SELECT id FROM workspaces WHERE name = $1 LIMIT 1`,
      [workspaceName]
    );
    if (existingWs.rowCount) {
      workspaceId = existingWs.rows[0].id;
    } else {
      const wsRes = await pool.query(
        `INSERT INTO workspaces (name, created_by)
         VALUES ($1, $2)
         RETURNING id`,
        [workspaceName, instructorId]
      );
      workspaceId = wsRes.rows[0].id;
    }

    const keepUserIds = demoUsers.map((u) => userIds[u.email]).filter(Boolean);
    await pool.query(
      `DELETE FROM workspace_memberships
       WHERE workspace_id = $1 AND user_id <> ALL($2::uuid[])`,
      [workspaceId, keepUserIds]
    );

    for (const user of demoUsers) {
      await pool.query(
        `INSERT INTO workspace_memberships (workspace_id, user_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
        [workspaceId, userIds[user.email], user.role]
      );
    }

    await pool.query(`DELETE FROM user_profiles WHERE workspace_id = $1`, [workspaceId]);
    for (const user of demoUsers) {
      await pool.query(
        `INSERT INTO user_profiles (user_id, workspace_id, school_code, instructor, period, group_code, student_code)
         VALUES ($1, $2, 'MTN12', 'Shim', $3, $4, $5)`,
        [userIds[user.email], workspaceId, user.period || "P1", user.groupCode === "INSTRUCTOR" ? "" : user.groupCode, user.studentCode || user.email.split("@")[0].toUpperCase()]
      );
    }

    await pool.query(`DELETE FROM join_codes WHERE workspace_id = $1`, [workspaceId]);
    await pool.query(
      `INSERT INTO workspace_class_structures (workspace_id, period_count, group_count, updated_by, updated_at)
       VALUES ($1, 1, 4, $2, NOW())
       ON CONFLICT (workspace_id)
       DO UPDATE SET period_count = EXCLUDED.period_count, group_count = EXCLUDED.group_count, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
      [workspaceId, instructorId]
    );

    await pool.query(
      `DELETE FROM measurement_edits WHERE workspace_id = $1`,
      [workspaceId]
    );
    await pool.query(`DELETE FROM measurements WHERE workspace_id = $1`, [workspaceId]);
    await pool.query(`DELETE FROM sessions WHERE workspace_id = $1`, [workspaceId]);

    // Start with no measurements/sessions so class can import fresh data.

    await pool.query("COMMIT");
    console.log("Seed complete.");
    console.log({
      workspaceId,
      personas: demoUsers.map((u) => ({
        email: u.email,
        password: u.password,
        role: u.role,
        group: u.groupCode,
      })),
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
