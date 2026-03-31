# Instructor Curriculum Guide — Air Story

Use this guide when you design a learning unit (class, project, or camp): **when** to use the platform, **in what order**, and **in which roles**.  
For day-to-day operations, see [`instructor-guide.md`](./instructor-guide.md); for a live stakeholder walkthrough, see [`instructor-demo-guide.md`](./instructor-demo-guide.md).

---

## 1. What “Air Story” names in your curriculum

In many K–12 STEM materials, **Air Story** is simply the **name for this platform** (the product may also be labeled **AIR @TAMGU**). It is the **web layer** that receives, organizes, and visualizes **air-quality sensor data** so classes can work on a **socio-scientific issue (SSI)** together—not only as a gadget exercise.

- **SSI framing:** Air quality connects **evidence** (measurements, uncertainty, comparisons) with **human stakes** (health, exposure, equity, policy, values). Use Air Story so students argue from **data plus context**, not from slogans or a single reading.
- **Data literacy goals:** Reading metrics and summaries responsibly; understanding **session and group** structure; distinguishing **raw values** from **student annotations** (`*`); ethical reporting and exports.
- **Data agency goals:** Students **interpret**, **compare groups**, and **propose** justified annotations within guardrails—building ownership without erasing the audit trail the SSI discussion needs.

Share the student-facing explanation in [`student-guide.md`](./student-guide.md) (“What Air Story is”) so vocabulary matches yours.

---

## 2. Why this guide exists (curriculum design lens)

- Align **learning outcomes → activities → tool use** so teaching is grounded in “why this screen now,” not a feature list.
- Air-quality work naturally flows **field collection → visualization and comparison → interpretation and reporting**; splitting the unit the same way keeps pacing predictable.
- The workspace, session, group, measurement, and student-annotation (`*`) model assumes **collaboration and traceability**, which pairs well with staged teacher/student roles and with **SSI + data literacy + data agency** outcomes.

---

## 3. Recommended unit arc (four stages for backward design)

The table below assumes a **one- to two-week** project; adjust the number of days to your school calendar.  
**Note:** Labels **A–D** here are **unit-stage names** for pacing (setup through reporting). They are **not** the platform name **Air Story**—**Air Story** is the whole environment described in Section 1.

| Stage | Learning focus (what students can do) | Where it lives in the platform |
|-------|--------------------------------------|--------------------------------|
| **A. Setup** | Understand what a measurement means; group and session rules | Workspace access, role checks, (instructor) session creation and metadata |
| **B. Collection** | Leave data with a consistent procedure | Session and measurement upload via mobile/field app (see backend and [`MOBILE_INTEGRATION_GUIDE.md`](../mobile/MOBILE_INTEGRATION_GUIDE.md)) |
| **C. Analysis** | Switch metrics; compare groups and time; describe patterns | Dashboard: trends, summary cards, heatmap, session filters |
| **D. Interpretation and reporting** | Justify outliers and annotations; produce deliverables | Student annotations (`*`), CSV export, (optional) spreadsheet integration |

**Backward-design tip:** Decide first what a successful presentation or report must include, then require the data and behaviors in **B** that **C** and **D** need, and align vocabulary and rules in **A**.

---

## 4. Module map (outcomes, activities, tools)

### Module 0 — Orientation (about 1 hour)

| Item | Content |
|------|---------|
| **Learning outcomes** | Sign-in; workspace and role (instructor/student); names of air-quality metrics (`PM2.5`, `CO`, temperature, humidity). |
| **Activities** | Log in with demo accounts; switch metrics; read summary numbers. |
| **Instructor prep** | Rehearse the 5–7 minute demo path in [`instructor-demo-guide.md`](./instructor-demo-guide.md). |
| **Student-facing** | Share [`student-guide.md`](./student-guide.md) on your LMS—at minimum the **What Air Story is** section (SSI, data literacy, data agency). |

### Module 1 — Session design (instructor-led, about 30–45 minutes + async)

| Item | Content |
|------|---------|
| **Learning outcomes** | Why one field visit or lab run is bundled as a session; how school, period, group, and notes fields support reporting. |
| **Activities** | Create sessions; set session code, location, lead, and notes. |
| **Tools** | Session CRUD and metadata (school code, instructor, period, group, etc.—exact fields follow your deployment schema). |
| **Assessment idea** | Ask for **one line** in session notes: a hypothesis or measurement question (links forward to analysis). |

### Module 2 — Data collection (field or simulated)

| Item | Content |
|------|---------|
| **Learning outcomes** | Produce comparable data with consistent fields and timestamp practice. |
| **Activities** | Per-group uploads; check for gaps and duplicates. |
| **Tools** | Measurement POST and session linkage; for mobile, [`../mobile/API_SPEC.md`](../mobile/API_SPEC.md) and [`../mobile/EXAMPLE_PAYLOADS.md`](../mobile/EXAMPLE_PAYLOADS.md). |
| **Instructor** | During collection, lightly monitoring **latest measurements per session** on the dashboard is often enough. |

### Module 3 — Exploratory analysis (student-led, 1–2 hours)

| Item | Content |
|------|---------|
| **Learning outcomes** | Read trends per metric; describe differences across groups and time windows. |
| **Activities** | Switch metrics; use heatmap and summary stats (mean, median, min, max) to find “hot” segments. |
| **Tools** | Dashboard analytics and heatmap; session and filter queries. |
| **Role** | Instructors can structure discussion with **prompt cards** only (e.g., “Name two plausible reasons groups differ in the same time window”). |

### Module 4 — Annotations and ethics (students, 45–60 minutes)

| Item | Content |
|------|---------|
| **Learning outcomes** | Original sensor values vs. **annotations (edit proposals)**; auditability and honest recording of outliers. |
| **Activities** | Reserve annotations for **verification and typo fixes**, not gaming the data; one line of rationale in the note. |
| **Tools** | Measurement PATCH (annotations), `*` in the UI; instructors review per “Student Edit Annotations” in [`instructor-guide.md`](./instructor-guide.md). |
| **Assessment idea** | Short paragraph: why reporting without annotation discipline is risky (scientific habits, data literacy). |

### Module 5 — Reporting and sharing (whole group, about 1 hour)

| Item | Content |
|------|---------|
| **Learning outcomes** | Cite original vs. annotated values distinctly; produce stakeholder-ready outputs. |
| **Activities** | CSV export; simple charts and tables in a spreadsheet; optionally the Sheets export API. |
| **Tools** | Export endpoints (see backend [`../../backend/README.md`](../../backend/README.md)). |

---

## 5. Sample scheduling (two 90-minute blocks)

| Block | Content |
|-------|---------|
| **Day 1 (90 min)** | Module 0 + Module 1 (orientation + session design). |
| **Day 2 (90 min)** | Part of Module 3 (exploration) + Module 4 (annotation norms) + short discussion. |
| **Async** | Module 2 collection, remainder of Module 3, Module 5 report draft. |

For a short workshop, **Module 0 → 3 → 4** alone can stand as a tool experience unit.

---

## 6. Differentiation (by level)

| Level | Emphasis |
|-------|----------|
| **Intro** | One fixed metric, one session; one annotation round after a teacher demo. |
| **Intermediate** | Compare two groups; describe spatial patterns with the heatmap; simple stats from CSV. |
| **Advanced** | Test hypotheses with filters and date ranges; read API/mobile docs and discuss field mapping (STEM + software integration). |

---

## 7. Operations checklist (before the unit starts)

- [ ] Confirm student accounts, group assignments, and demo instructor credentials ([`backend/README.md`](../../backend/README.md) seed accounts).
- [ ] Announce “original vs. annotation” rules on day one (same message as [`student-guide.md`](./student-guide.md)).
- [ ] Lock the collection path: web-only vs. mobile integration—if integrated, share base URL and token flow ([`../mobile/MOBILE_INTEGRATION_GUIDE.md`](../mobile/MOBILE_INTEGRATION_GUIDE.md)).
- [ ] Specify deliverable format (e.g., CSV + screenshots).
- [ ] Rehearse the live demo order with [`instructor-demo-guide.md`](./instructor-demo-guide.md).

---

## 8. Related documents

| Document | Use |
|----------|-----|
| [`instructor-guide.md`](./instructor-guide.md) | Day-to-day workflow (dashboard, annotation review, export). |
| [`instructor-demo-guide.md`](./instructor-demo-guide.md) | Stakeholder or class demo script. |
| [`student-guide.md`](./student-guide.md) | What Air Story is (SSI, data literacy, data agency) and student norms for annotations. |
| [`../mobile/MOBILE_INTEGRATION_GUIDE.md`](../mobile/MOBILE_INTEGRATION_GUIDE.md) | App integration, auth, sessions, measurements. |
| [`../../backend/README.md`](../../backend/README.md) | API, seed accounts, local run. |

---

## 9. Maintaining this document

When the unit shape changes, update **Section 4 (module tables)** and **Section 5 (timing)** first. When new features ship, add a single line to the “Tools” row of the relevant module.
