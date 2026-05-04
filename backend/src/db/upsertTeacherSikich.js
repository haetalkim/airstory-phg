/**
 * Idempotent: Sikich teacher + PHG01 workspace + shared "PHG students" login used by the
 * phg/ static site (silent JWT for group buttons). Safe on production — does NOT delete
 * sessions, measurements, join codes, or other students.
 *
 * Runs automatically on `npm start` after migrations. Manual: `npm run db:upsert-teacher`.
 */
import bcrypt from "bcryptjs";
import { pool } from "./pool.js";

const WORKSPACE_NAME = "PHG01 — Philadelphia";
const SCHOOL_CODE = "PHG01";
const INSTRUCTOR_NAME = "Mr. Sikich";
const TEACHER = {
  email: "sikich@tamgu.com",
  fullName: "Mr. Sikich",
  password: "sikich2026",
  role: "owner",
  period: "P1",
  studentCode: "INST001",
};

/** Same defaults as phg/src/utils/studentContext.js — all group buttons share this JWT. */
const PHG_SHARED_STUDENT = {
  email: "phg-students@airstory.local",
  fullName: "PHG Students",
  password: "phg-students-2026",
  role: "student",
  period: "P1",
  studentCode: "PHGSTU",
};

async function run() {
  await pool.query("BEGIN");
  try {
    const passwordHash = await bcrypt.hash(TEACHER.password, 10);
    const userRes = await pool.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         full_name = EXCLUDED.full_name
       RETURNING id`,
      [TEACHER.email, passwordHash, TEACHER.fullName]
    );
    const teacherId = userRes.rows[0].id;

    let workspaceId;
    const existingWs = await pool.query(`SELECT id FROM workspaces WHERE name = $1 LIMIT 1`, [WORKSPACE_NAME]);
    if (existingWs.rowCount) {
      workspaceId = existingWs.rows[0].id;
      await pool.query(`UPDATE workspaces SET created_by = COALESCE(created_by, $1) WHERE id = $2`, [
        teacherId,
        workspaceId,
      ]);
    } else {
      const wsRes = await pool.query(
        `INSERT INTO workspaces (name, created_by)
         VALUES ($1, $2)
         RETURNING id`,
        [WORKSPACE_NAME, teacherId]
      );
      workspaceId = wsRes.rows[0].id;
    }

    await pool.query(
      `INSERT INTO workspace_memberships (workspace_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
      [workspaceId, teacherId, TEACHER.role]
    );

    await pool.query(
      `INSERT INTO user_profiles (user_id, workspace_id, school_code, instructor, period, group_code, student_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
         workspace_id = EXCLUDED.workspace_id,
         school_code = EXCLUDED.school_code,
         instructor = EXCLUDED.instructor,
         period = EXCLUDED.period,
         group_code = EXCLUDED.group_code,
         student_code = EXCLUDED.student_code,
         updated_at = NOW()`,
      [
        teacherId,
        workspaceId,
        SCHOOL_CODE,
        INSTRUCTOR_NAME,
        TEACHER.period,
        "",
        TEACHER.studentCode,
      ]
    );

    await pool.query(
      `INSERT INTO workspace_class_structures (workspace_id, period_count, group_count, updated_by, updated_at)
       VALUES ($1, 1, 6, $2, NOW())
       ON CONFLICT (workspace_id) DO NOTHING`,
      [workspaceId, teacherId]
    );

    const phgHash = await bcrypt.hash(PHG_SHARED_STUDENT.password, 10);
    const phgUserRes = await pool.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         full_name = EXCLUDED.full_name
       RETURNING id`,
      [PHG_SHARED_STUDENT.email, phgHash, PHG_SHARED_STUDENT.fullName]
    );
    const phgUserId = phgUserRes.rows[0].id;

    await pool.query(
      `INSERT INTO workspace_memberships (workspace_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
      [workspaceId, phgUserId, PHG_SHARED_STUDENT.role]
    );

    await pool.query(
      `INSERT INTO user_profiles (user_id, workspace_id, school_code, instructor, period, group_code, student_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
         workspace_id = EXCLUDED.workspace_id,
         school_code = EXCLUDED.school_code,
         instructor = EXCLUDED.instructor,
         period = EXCLUDED.period,
         group_code = EXCLUDED.group_code,
         student_code = EXCLUDED.student_code,
         updated_at = NOW()`,
      [
        phgUserId,
        workspaceId,
        SCHOOL_CODE,
        INSTRUCTOR_NAME,
        PHG_SHARED_STUDENT.period,
        "",
        PHG_SHARED_STUDENT.studentCode,
      ]
    );

    await pool.query("COMMIT");
    console.log("Upsert complete.", {
      teacher: { email: TEACHER.email, password: TEACHER.password },
      phgSharedStudent: {
        email: PHG_SHARED_STUDENT.email,
        password: PHG_SHARED_STUDENT.password,
        note: "PHG site group buttons log in with this account",
      },
      workspaceId,
      workspaceName: WORKSPACE_NAME,
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
