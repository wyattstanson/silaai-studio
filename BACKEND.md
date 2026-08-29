# Silai — Backend & Database

A scalable, serverless data layer for the Silai studio app, designed for **Vercel + PostgreSQL**.

- **Frontend** — the existing Vite/React app (static on Vercel). Runs fully offline on `localStorage` when no database is configured.
- **API** — Vercel **serverless functions** in `/api/*` (Node runtime).
- **Database** — **PostgreSQL** (Neon or Vercel Postgres) via **Prisma** ORM, with indexes and DB-side aggregation so it stays fast as records grow.

## Architecture

```
Browser ──► /api/* (Vercel serverless) ──► Prisma ──► Postgres (pooled)
   │                                                        ▲
   └── offline fallback: localStorage (no DB required)      migrations / seed via DIRECT_URL
```

## Data model (`prisma/schema.prisma`)

`Family → Customer → { Measurement, Order → Payment }`, plus `User` (phone auth), `Activity` (audit log), and a `Counter` table that mints human codes (`CUS-0001`, `S-42`) atomically under concurrency.

Indexes cover every real query: `User.phone` (unique), `Customer` by `familyId / name / phone`, `Order` by `customerId / stage / deliveryDate / deadline`, `Payment.orderId`, `Activity` by `familyId / customerId / orderId / at`. Deletes cascade (removing a customer removes their orders, payments, measurements).

## API surface

| Method + path | Purpose |
| --- | --- |
| `GET /api/health` | Liveness + DB reachability |
| `POST /api/auth` | `{action:"login"\|"signup", phone, name?}` |
| `GET/POST /api/customers` | Aggregated, searchable, sorted, **paginated** list / create |
| `GET/PATCH/DELETE /api/customers/:id` | Full dossier / live edit / delete |
| `POST /api/customers/:id/measurements` | Add measurement |
| `GET/POST /api/orders` | Filter by stage/customer/deadline, paginated / create |
| `GET/PATCH/DELETE /api/orders/:id` | Read / edit / delete |
| `POST /api/orders/:id/stage` | Advance stage |
| `POST /api/orders/:id/payment` | Record advance/balance/refund |
| `GET/POST /api/families` | List / create |
| `GET /api/activity` | Family/customer feed, **keyset** pagination |
| `GET /api/stats` | Headline totals, computed in SQL |

**Scalability choices:** customer listing aggregates orders/payments in two CTEs then joins (no fan-out double-counting) and paginates with `LIMIT/OFFSET`; the activity feed uses **keyset** (`cursor`) pagination; headline stats are `SUM`/`COUNT` in the database, never by loading rows. Inputs are validated with `zod`; sort clauses are whitelisted (no SQL injection).

## Setup

1. **Create a Postgres database** — [Neon](https://neon.tech) free tier or Vercel Postgres.
2. `cp .env.example .env` and fill `DATABASE_URL` (pooled) + `DIRECT_URL` (direct).
3. Generate client + run the first migration + seed:
   ```bash
   npm install
   npm run prisma:migrate     # creates tables (dev)
   npm run db:seed            # 4 families, 5 customers, 5 orders, 4 users
   ```
4. Verify locally with `vercel dev` (serves `/api` + the Vite app), then open `/api/health`.

## Deploy (Vercel)

1. Push to GitHub and import the repo in Vercel (framework auto-detected as Vite).
2. Add env vars **DATABASE_URL** and **DIRECT_URL** in Project → Settings → Environment Variables.
3. Deploy. Build runs `vercel-build` (`prisma generate && tsc -b && vite build`); `/api/*` deploy as functions.
4. First deploy only: run `npm run db:deploy` (applies migrations to prod) — locally with prod `DIRECT_URL`, or via a one-off.

## Demo logins

- Owner — `+91 90000 00000`
- Family — `+91 98110 20304`

## Frontend wiring (done)

The store (`src/data/store.tsx`) is now hybrid:

- **On load** it probes `GET /api/health`. If a database is reachable it calls `GET /api/bootstrap`, hydrates the in-memory model from the server, and switches to **online** mode. Otherwise it stays **offline** on `localStorage`. The menubar shows a `Synced` / `Offline` chip.
- **Reads** use the same in-memory model as before, so no screen changed.
- **Writes** apply locally for an instant UI *and*, in online mode, mirror to the API in the background (`src/data/remote.ts` maps lowercase↔UPPERCASE enums and app ids↔`cuid`s). A `code→cuid` ref map lets the store address the server while the UI keeps human ids (`CUS-0001`, `S-42`), so **no component needed changing**.
- **Offline changes** are kept in `localStorage`; on next online load the server is authoritative (there is no offline write-queue/merge yet — see limitations).

### Known limitations (by design, for now)

- `bootstrap` is **not auth-scoped** — it returns the whole working set (fine for a single shop; add per-user filtering before multi-tenant use).
- **Auth stays local** (validated against the hydrated user list) even online; a new signup is also POSTed to the server. Full server-side login is a small follow-up.
- The **demo-data generator** is local only.
- `bootstrap` is capped (1000 customers / 2000 orders); past that, move the Admin console and lists onto the paginated endpoints (already built).

## At very large scale

- Add a `pg_trgm` GIN index for fuzzy name/phone search (`CREATE INDEX ... USING gin (name gin_trgm_ops)`).
- Denormalize `Customer.outstanding` (maintained by triggers or on write) to sort millions of rows without the aggregate CTE.
- Use Prisma driver adapters (`@prisma/adapter-neon`) or Prisma Accelerate for connection pooling at high function concurrency.
