import bcrypt from "bcryptjs";
import { pool } from "./pool.js";

/** Single-class seed: Philadelphia PHG01, teacher Sikich, no sessions/measurements (ready for CSV import).
 * Join codes are not seeded—teachers create them in Manage Classes (random 5-character generator). */
const WORKSPACE_NAME = "PHG01 — Philadelphia";
const SCHOOL_CODE = "PHG01";
const INSTRUCTOR_NAME = "Mr. Sikich";

async function run() {
  await pool.query("BEGIN");
  try {
    const demoUsers = [
      {
        email: "sikich@tamgu.com",
        fullName: "Mr. Sikich",
        password: "sikich2026",
        role: "owner",
        groupCode: "INSTRUCTOR",
        period: "P1",
        studentCode: "INST001",
      },
      // Shared "PHG students" account: the airstory/phg variant silently signs
      // every student browser into this single account so CSV uploads + reads
      // can hit the existing JWT-protected endpoints without showing a login
      // form. Per-group attribution is stamped client-side onto each row.
      {
        email: "phg-students@airstory.local",
        fullName: "PHG Students",
        password: "phg-students-2026",
        role: "student",
        groupCode: "",
        period: "P1",
        studentCode: "PHGSTU",
      },
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

    const teacherId = userIds["sikich@tamgu.com"];

    let workspaceId;
    const existingWs = await pool.query(`SELECT id FROM workspaces WHERE name = $1 LIMIT 1`, [WORKSPACE_NAME]);
    if (existingWs.rowCount) {
      workspaceId = existingWs.rows[0].id;
      await pool.query(`UPDATE workspaces SET created_by = $1 WHERE id = $2`, [teacherId, workspaceId]);
    } else {
      const wsRes = await pool.query(
        `INSERT INTO workspaces (name, created_by)
         VALUES ($1, $2)
         RETURNING id`,
        [WORKSPACE_NAME, teacherId]
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
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userIds[user.email],
          workspaceId,
          SCHOOL_CODE,
          INSTRUCTOR_NAME,
          user.period || "P1",
          user.groupCode === "INSTRUCTOR" ? "" : user.groupCode,
          user.studentCode || user.email.split("@")[0].toUpperCase(),
        ]
      );
    }

    await pool.query(`DELETE FROM join_codes WHERE workspace_id = $1`, [workspaceId]);

    await pool.query(
      `INSERT INTO workspace_class_structures (workspace_id, period_count, group_count, updated_by, updated_at)
       VALUES ($1, 1, 6, $2, NOW())
       ON CONFLICT (workspace_id)
       DO UPDATE SET period_count = EXCLUDED.period_count, group_count = EXCLUDED.group_count, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
      [workspaceId, teacherId]
    );

    await pool.query(`DELETE FROM measurement_edits WHERE workspace_id = $1`, [workspaceId]);
    await pool.query(`DELETE FROM measurements WHERE workspace_id = $1`, [workspaceId]);
    await pool.query(`DELETE FROM sessions WHERE workspace_id = $1`, [workspaceId]);

    await pool.query("COMMIT");
    console.log("Seed complete.");
    console.log({
      workspaceId,
      workspaceName: WORKSPACE_NAME,
      location: "Philadelphia, PA (school code PHG01; app defaults use PA)",
      teacher: {
        email: "sikich@tamgu.com",
        password: "sikich2026",
        role: "owner",
      },
      joinCodes: "(none) — open Manage Classes → generate a random 5-char code (or type one) → create. Share that with students.",
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
