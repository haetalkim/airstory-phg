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
      { email: "ada@tamgu.com", fullName: "Ada", password: "password", role: "student", groupCode: "G1", period: "P1", studentCode: "STU004" },
      { email: "ida@tamgu.com", fullName: "Ida", password: "password", role: "student", groupCode: "G2", period: "P1", studentCode: "STU007" },
      { email: "lucy@tamgu.com", fullName: "Lucy", password: "password", role: "student", groupCode: "G2", period: "P1", studentCode: "STU008" },
      { email: "davin@tamgu.com", fullName: "Davin", password: "password", role: "student", groupCode: "G1", period: "P1", studentCode: "STU005" },
      { email: "yimei@tamgu.com", fullName: "Yimei", password: "password", role: "student", groupCode: "G2", period: "P1", studentCode: "STU009" },
      { email: "liz@tamgu.com", fullName: "Liz", password: "password", role: "student", groupCode: "G3", period: "P1", studentCode: "STU011" },
      { email: "min@tamgu.com", fullName: "Min", password: "password", role: "student", groupCode: "G3", period: "P1", studentCode: "STU012" },
      { email: "bella@tamgu.com", fullName: "Bella", password: "password", role: "student", groupCode: "G3", period: "P1", studentCode: "STU013" },
      { email: "jay@tamgu.com", fullName: "Jay", password: "password", role: "student", groupCode: "G2", period: "P1", studentCode: "STU010" },
      { email: "stella@tamgu.com", fullName: "Stella", password: "password", role: "student", groupCode: "G1", period: "P1", studentCode: "STU006" },
      { email: "juun@tamgu.com", fullName: "Juun", password: "password", role: "student", groupCode: "G3", period: "P1", studentCode: "STU014" },
      { email: "jennifer@tamgu.com", fullName: "Jennifer", password: "password", role: "student", groupCode: "G4", period: "P1", studentCode: "STU020" },
      { email: "niki@tamgu.com", fullName: "Niki", password: "password", role: "student", groupCode: "G4", period: "P1", studentCode: "STU021" },
      { email: "bea@tamgu.com", fullName: "Bea", password: "password", role: "student", groupCode: "G4", period: "P1", studentCode: "STU022" },
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

    await pool.query(
      `DELETE FROM measurement_edits WHERE workspace_id = $1`,
      [workspaceId]
    );
    await pool.query(`DELETE FROM measurements WHERE workspace_id = $1`, [workspaceId]);
    await pool.query(`DELETE FROM sessions WHERE workspace_id = $1`, [workspaceId]);

    const sessions = [
      {
        sessionCode: "DEMO-G1-001",
        name: "Campus Walk Group 1",
        groupCode: "G1",
        schoolCode: "MTN12",
        instructor: "Demo Instructor",
        period: "P1",
        locationName: "North Campus",
        notes: "Morning collection route",
        createdBy: userIds["jiin@tamgu.com"],
      },
      {
        sessionCode: "DEMO-G4-001",
        name: "Campus Walk Group 4",
        groupCode: "G4",
        schoolCode: "MTN12",
        instructor: "Shim",
        period: "P2",
        locationName: "South Campus",
        notes: "Afternoon collection route",
        createdBy: userIds["julia@tamgu.com"],
      },
    ];

    const sessionIds = [];
    for (const s of sessions) {
      const sessionRes = await pool.query(
        `INSERT INTO sessions (
          workspace_id, created_by, session_code, name, notes, location_name,
          school_code, instructor, period, group_code, started_at, ended_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, NOW() - INTERVAL '7 days', NOW()
        )
        RETURNING id`,
        [
          workspaceId,
          s.createdBy,
          s.sessionCode,
          s.name,
          s.notes,
          s.locationName,
          s.schoolCode,
          s.instructor,
          s.period,
          s.groupCode,
        ]
      );
      sessionIds.push({ id: sessionRes.rows[0].id, groupCode: s.groupCode });
    }

    for (const s of sessionIds) {
      for (let i = 0; i < 60; i += 1) {
        const baseLat = s.groupCode === "G1" ? 40.744 : 40.758;
        const baseLng = s.groupCode === "G1" ? -73.991 : -73.972;
        const pm25 = s.groupCode === "G1" ? 8 + (i % 14) : 12 + (i % 18);
        const co = s.groupCode === "G1" ? 0.3 + (i % 8) * 0.05 : 0.45 + (i % 10) * 0.05;
        const temp = 20 + (i % 6);
        const humidity = 42 + (i % 20);
        const capturedAt = new Date(Date.now() - (60 - i) * 60 * 1000).toISOString();

        await pool.query(
          `INSERT INTO measurements (
            workspace_id, session_id, captured_at, latitude, longitude, indoor_outdoor,
            pm25, co, temp, humidity
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            workspaceId,
            s.id,
            capturedAt,
            baseLat + i * 0.00015,
            baseLng + i * 0.00015,
            i % 2 === 0 ? "OUTDOOR" : "INDOOR",
            pm25,
            Number(co.toFixed(2)),
            temp,
            humidity,
          ]
        );
      }
    }

    const firstMeasurement = await pool.query(
      `SELECT id, pm25 FROM measurements WHERE workspace_id = $1 ORDER BY captured_at DESC LIMIT 1`,
      [workspaceId]
    );
    if (firstMeasurement.rowCount) {
      await pool.query(
        `INSERT INTO measurement_edits (
          workspace_id, measurement_id, edited_by_user_id, field_name, original_value, edited_value, edit_note
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          workspaceId,
          firstMeasurement.rows[0].id,
          userIds["jiin@tamgu.com"],
          "pm25",
          Number(firstMeasurement.rows[0].pm25),
          Number(firstMeasurement.rows[0].pm25) + 2,
          "Adjusted after manual validation",
        ]
      );
    }

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
