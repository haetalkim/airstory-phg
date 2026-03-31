# Student Guide — AIR @TAMGU

This guide explains how to use **ABC** as a student: sign-in, reading data, and submitting **edit annotations** (`*`) the right way. **ABC** is this platform (you may also see the name **AIR @TAMGU**). Your instructor may pair this guide with a written unit plan.

---

## What ABC is

**ABC** is the **air-quality learning platform** your class uses in **K–12 STEM** lessons. It connects to **sensors** (handheld or mobile apps in the field, depending on your school’s setup) so measurements are not stuck on one device—they show up in a **shared workspace** where your group can see trends, compare conditions, and talk about evidence together.

### Why air quality is a socio-scientific issue (SSI)

Air quality sits at the boundary of **science and society**. The numbers describe particles and gases, but the stakes include **health**, **who is exposed**, **schools and neighborhoods**, **rules and technology**, and **what should be done** when data are uncertain or disagree. In an SSI unit, you are not only learning to read a graph—you are practicing how **communities use evidence** to argue, decide, and care for people and the environment.

### Data literacy on ABC

**Data literacy** here means you can:

- Read what the metrics **mean** (for example `PM2.5`, `CO`, temperature, humidity) and what they **do not** prove by themselves.
- Notice **context**: time, place, session, group, and how the sensor was used.
- Tell the difference between **raw sensor values** and **your annotations** (`*`), and why both matter for honesty and grading.
- Use exports or screenshots **fairly** when you report (cite what the dashboard showed and when).

### Data agency on ABC

**Data agency** means you are not a passive viewer. Within the rules of your class, you can **look**, **compare**, **question**, and **propose** annotation edits with a note—so the record stays traceable. Agency is **not** “change numbers until the story looks good”; it is **taking responsibility** for how data are interpreted and communicated in a socio-scientific debate.

### How this ties to your sensor work

Sensors **collect**; ABC **organizes and displays** that stream under **sessions** your teacher sets up. If your class uses a phone or field app, your teacher will share the procedure; technical integration details for developers live in [`../mobile/MOBILE_INTEGRATION_GUIDE.md`](../mobile/MOBILE_INTEGRATION_GUIDE.md).

---

## Account and access

- Sign in with the **student account** your instructor assigns.
  - Demo Group 1: `jiin@tamgu.com`
  - Demo Group 4: `julia@tamgu.com`
- Students can view analytics for their workspace context and submit **edit annotations**; they cannot replace raw sensor history.

---

## Core workflow

1. Log in and open the dashboard.
2. Find **your group’s session** and the latest **measurements**.
3. **Switch metrics** to see how air-quality signals change over time.
4. Add **reflections or notes** when your instructor asks (separate from numeric annotations).
5. For assignments, use **export or screenshots** only as allowed by your teacher.

---

## Metrics you will see

| Metric | In plain language |
|--------|-------------------|
| **PM2.5** | Very fine particles in the air; often used as a key air-quality indicator. |
| **CO** | Carbon monoxide; relevant in some indoor or traffic-related contexts. |
| **Temperature** | Ambient temperature at the sensor. |
| **Humidity** | Moisture in the air; useful context alongside particles and comfort. |

Your instructor will say which metrics matter most for your project.

---

## Editing data (annotation mode)

- You can **propose** a correction to a displayed value in the measurement table (for example after validating a sensor or catching a typo).
- Enter the new value, save, and optionally add a **short note** with your reason.
- Corrected values show with **`*`** so everyone knows they were annotated.
- The **original sensor value stays on record** for transparency and grading.

---

## Best practices

- Submit annotations **only with a clear, honest reason** (validation, calibration check, obvious entry error—not to hide outliers).
- Keep notes **short and specific** (“Duplicate row removed after teacher check,” “Probe swapped at 10:42”).
- **Do not use edits to hide outliers**; if something looks surprising, discuss it or write a reflection that explains context.
- When comparing groups, stick to **evidence on the dashboard** plus what you observed in the field.

---

## What students cannot do

- Overwrite or delete **canonical source** measurement history directly.
- Change **workspace roles**, invite users, or change backend settings.
- Create **sessions** unless your instructor has given that responsibility to students in your cohort.

---

## Quick demo path (optional)

If you are practicing in front of the class, follow [`student-demo-guide.md`](./student-demo-guide.md).

---

## Related documents

| Document | Use |
|----------|-----|
| [`student-demo-guide.md`](./student-demo-guide.md) | Short scripted demo (two groups, one annotation). |
| [`../mobile/MOBILE_INTEGRATION_GUIDE.md`](../mobile/MOBILE_INTEGRATION_GUIDE.md) | How mobile apps talk to the same API (if your class uses an app). |
