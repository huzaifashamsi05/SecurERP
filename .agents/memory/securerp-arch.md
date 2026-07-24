---
name: SecurERP Architecture
description: Key decisions and layout for the Security Guard ERP full-stack app
---

## Stack
- Frontend: `artifacts/security-erp` — React + Vite, Tailwind, react-query hooks from `@workspace/api-client-react`
- API: `artifacts/api-server` — Express 5, pino logger, all routes under `/api/*`
- DB: `lib/db` — Drizzle ORM + PostgreSQL; schema in `lib/db/src/schema/`
- Generated hooks: `lib/api-client-react/src/generated/api.ts` (from OpenAPI spec `lib/api-spec/openapi.yaml`)
- Zod schemas: `lib/api-zod/src/generated/api.ts`

## DB Schema files
- `users.ts` — all user roles (super_admin, company_admin, operations_manager, hr_manager, finance_manager, field_supervisor, guard, client)
- `clients.ts` — clients + sites tables
- `guards.ts` — guards (linked to users via userId FK)
- `operations.ts` — shifts, attendance, checkpoints, patrols, incidents, daily_reports
- `hr.ts` — leave_requests, training_sessions, applicants
- `finance.ts` — payroll (net_salary col, NOT amount), invoices, expenses
- `assets.ts` — equipment, vehicles
- `notifications.ts` — notifications, activity_log

**Why:** payroll uses `net_salary` not `amount` — caused 500 on dashboard query until fixed.

## API Routes
- `auth.ts` — demo mode: /auth/me returns first company_admin; no real session
- `dashboard.ts` — uses `net_salary` for payroll expense aggregation
- `guards.ts`, `clients.ts`, `operations.ts`, `hr.ts`, `finance.ts`, `assets.ts`, `notifications.ts`

## Seed data
All tables populated with realistic demo data (8 guards, 5 clients, 6 sites, 8 shifts, 8 incidents, etc.).

## Auth
Demo auth — no session tokens. `/auth/me` returns the first `company_admin` user (James Okafor). Frontend stores nothing server-side.

**Why:** Chosen for speed; a real deployment would add express-session + bcrypt.

## Typecheck workflow
Run `pnpm run typecheck:libs` first to rebuild lib declarations before `pnpm --filter @workspace/api-server run typecheck`.
