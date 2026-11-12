# Trigrexam Admin Dashboard (design competition prototype)

A clickable front-end prototype. No backend, no database: everything runs in the browser on sample data from a fictional institute ("Shikhar Academy"). Refreshing the page resets the demo.

## Run it

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # normal build in dist/ (host anywhere)
npm run build:single   # ONE html file in dist-single/index.html (opens by double-click, works offline)
```

## 3-minute demo script

The site opens on the **product website** (Apple-style scroll story). Press **Open the dashboard**, pick a role on the sign-in screen (`Sign out` in the account menu returns to it), or use **Preview as** in the top bar to switch. Or open **About this design** and follow the 4-step tour.

1. **Admin home** - "needs your attention" list, each item has one button. Click *Send reminder*.
2. **New assignment** - one screen: type a title, tick a batch, *Publish now*. Everything else is pre-filled (open *More options* to change it). A live "what students will see" preview sits alongside.
3. **Student** - the new assignment is already on their home screen. Open it, answer, see the instant score. Try *Need more time?*.
4. **Teacher** - approve the extension in one tap, then *Start reviewing* (marks, feedback chips, `Cmd/Ctrl + Enter` to save and move on).
5. **Admin** - open the assignment: statuses, late work and reminders have updated on their own.
6. Press `Cmd/Ctrl + K` for search. Try dark mode and **Settings > Brand colour**. Resize to phone width.

## Pages beyond the dashboard

- **Product website** (`#/welcome`, linked from the sign-in screen): hero, how it works, features, customers, pricing, testimonial and contact, with scroll animations. Content comes from the Trigrexam site.
- **Plan and billing** (admin): current plan and usage, a plan finder slider, the real plans (Basic Rs 5,000, Professional Rs 8,000, Business Rs 15,000, billed annually + GST), comparison table and invoices you can download.
- **Test store** (admin): ready-made test packs, free packs, activation by token or payment, and seller earnings.

## What was designed

- One idea: *nobody should have to chase anyone.* Reminders, status and extensions run themselves.
- Same six status words and colours for admin, teacher and student.
- Covers the brief: user management, student and teacher records, courses, live classes (week timetable with clash warning), reports (overview, by subject, by time, by question), notifications, performance tracking, and the full assignment workflow.

## Notes

- The "What we set out to fix" list on the About page is based on common pain points. Edit it in `src/pages/About.tsx` to match the real current workflow.
- Brand colours and logo come from the Trigrexam wordmark. All names and numbers are sample data (`src/data/seed.ts`).
