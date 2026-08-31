# Threadline — Tailoring Studio (Phase-1 prototype)

> This repository is the **Phase-1 interactive prototype** of **Threadline**, a tailoring-shop management application. It implements the Phase-1 scope as a single responsive web app. The authoritative requirements, data schema, and full production architecture live in **[`ARCHITECTURE.md`](./ARCHITECTURE.md)**. (In-app the prototype is still branded "Silai".)

A local-first management app for a family tailoring shop, dressed as a movable **macOS-style desktop**. It runs fully offline on `localStorage` and upgrades to a serverless **Postgres** backend the moment a database is connected — so it works anywhere with zero setup, and scales when you want it to.

Built with a hand-made design system in a **Punjabi × Tamil Indian** palette (kumkum maroon, turmeric gold, mehndi, peacock) — no UI framework, no icon pack, light + dark.

> **Live demo logins** — Owner: `+91 90000 00000` · Family member: `+91 98110 20304`

---

## What it does

- **Orders** — every stitching job as a ticket: material source (shop / customer's own), design & remarks, delivery date + alerts, **Normal / Urgent / Express priority**, and the full **8-stage workflow** (Order Created → Material Received → Cutting → Stitching → Quality Check → Ready → Delivered/Dispatched → Closed).
- **Customers & families** — households grouped by a shared phone; **versioned** per-garment measurements (history never overwritten) with a 2-month refresh reminder, and an **immutable measurement snapshot locked to each order**.
- **Payments** — advances, balances, and a full transaction ledger.
- **Admin console** — a searchable, sortable, **virtualized** customer table (handles thousands of rows) with **CSV / JSON export** and live-editable records.
- **Service requests** — customers raise requests (new stitching, alteration, pickup, delivery, fitting, consultation, reorder, express, home measurement, remake) with a status timeline; the owner gets an **inbox** to manage them and convert one into an order.
- **Showcase** — a public storefront with a garment gallery and contact section.
- **Phone auth + roles** — the owner sees the full studio; a family member sees only their own orders, measurements, history and requests.
- **A real window manager** — orders and customer records open as draggable, resizable, stackable windows, with a dock and drifting-bubble desktop.

---

## Tech stack

| Area | Choices |
| --- | --- |
| **Frontend** | React 18, TypeScript, Vite 5, CSS custom-property tokens, self-hosted Inter + Fraunces |
| **Backend** | Vercel Serverless Functions (Node), Prisma ORM, zod validation |
| **Database** | PostgreSQL (Neon / Vercel Postgres) — pooled + direct connections |
| **State** | React Context store, `localStorage` persistence, hybrid online/offline sync |
| **Deploy** | GitHub → Vercel (static Vite build + `/api` functions) |

No component library, no icon pack — the interface (icons, garment illustrations, windows) is hand-built.

---

## Quick start (offline — no database needed)

```bash
npm install
npm run dev
```

Open `http://localhost:5180`. The app seeds sample data and runs entirely in the browser. The menubar shows an **Offline** chip.

---

## Going online (Postgres)

1. Create a free Postgres database ([Neon](https://neon.tech) or Vercel Postgres).
2. Copy the env template and fill in your connection strings:
   ```bash
   cp .env.example .env
   ```
   ```env
   DATABASE_URL="postgresql://…-pooler…/db?sslmode=require&pgbouncer=true&connection_limit=1"
   DIRECT_URL="postgresql://…/db?sslmode=require"
   ```
3. Create the schema and seed it:
   ```bash
   npm run prisma:migrate
   npm run db:seed
   ```
4. Run with functions (serves `/api` + the app together):
   ```bash
   vercel dev
   ```
   The menubar chip turns **Synced** and data persists to Postgres.

---

## Deploy (Vercel)

1. Push to GitHub and import the repo in Vercel (framework auto-detected as **Vite**).
2. Add **`DATABASE_URL`** and **`DIRECT_URL`** under Project → Settings → Environment Variables.
3. Deploy. The build runs `vercel-build` (`prisma generate && vite build`); `/api/*` deploy as functions.
4. First production deploy only: apply migrations with `npm run db:deploy` (using your production `DIRECT_URL`).

> Note: the app ships **11 serverless functions**, one under the Vercel Hobby-plan limit of 12. If you add endpoints, consolidate to stay within the cap (or upgrade the plan).

Full backend details are in **[`BACKEND.md`](./BACKEND.md)**.

---

## Scripts

| Script | Does |
| --- | --- |
| `npm run dev` | Vite dev server (port 5180) |
| `npm run build` | Type-check + production build |
| `npm run vercel-build` | `prisma generate` + build (used by Vercel) |
| `npm run prisma:migrate` | Create/apply a dev migration |
| `npm run db:deploy` | Apply migrations to production |
| `npm run db:seed` | Seed sample families, customers, orders, requests |
| `npm run typecheck:api` | Type-check the serverless functions |

---

## Project structure

```
src/
  main.tsx  App.tsx            entry + role-based routing
  components/
    Shell.tsx  Dock.tsx        macOS desktop, menubar, dock
    Icon.tsx  GarmentArt.tsx   bespoke SVG icons + illustrations
    VirtualList.tsx            windowed rendering for large tables
    windows/                   floating window manager
    ui/                        buttons, cards, modals, fields…
  modules/                     feature screens (Dashboard, Orders,
                               Customers, Admin, Payments, Reports,
                               Requests, Portal, Showcase, Auth…)
  data/     store · types · seed · api · remote
  lib/      format · stages · requests · exportData
  hooks/    useDrag.ts
  styles/   tokens.css · global.css
api/                           11 serverless functions
lib/         http · prisma · validation · codes   (shared by /api)
prisma/      schema.prisma · seed.ts
vercel.json  .env.example  BACKEND.md
```

---

## Architecture in one breath

**UI** (React) → **State** (Context store + localStorage) → **Data access** (typed API client + mapping layer) → **API** (Vercel functions + zod) → **Database** (Prisma + Postgres).

On load, the store probes `/api/health`; if a database answers, `/api/bootstrap` hydrates the whole model in one call and the app switches to online mode where every change mirrors to Postgres. Otherwise it stays offline on `localStorage`. Human ids (`CUS-0001`, `S-42`) stay stable in the UI via a code→id reference map.

Domain model: `Family → Customer → { Measurement, Order → Payment, Request }`, plus `User` (phone auth), `Activity` (audit log), and `Counter` (mints unique human codes).

---

## Design notes

- **Palette** — kumkum maroon, turmeric gold, mehndi green, peacock teal, rani pink on sandalwood ivory; full light + dark, driven entirely from `tokens.css`.
- **House rules** — custom SVG icons only (no emojis, no lucide), matte surfaces (no neon/glow), no em-dashes in copy.
- **Motifs** — a faint kolam dot-grid on the desktop, a temple-scallop edge on the showcase ribbon, maroon→gold brand marks.

---

Repository: `github.com/wyattstanson/silaai-studio` · deploys on Vercel.
