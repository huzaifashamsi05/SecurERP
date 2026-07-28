# Security Guard ERP

A comprehensive full-stack Security Guard Enterprise Resource Planning system for managing operations, HR, finance, and asset tracking.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite + TypeScript |
| **Styling** | Tailwind CSS 4 + shadcn/ui (Radix primitives) |
| **State/Data** | TanStack React Query + Orval-generated API hooks |
| **Routing** | Wouter (lightweight React router) |
| **Backend** | Express 5 + TypeScript |
| **Database** | PostgreSQL + Drizzle ORM |
| **Auth** | JWT (jsonwebtoken) + bcrypt password hashing |
| **Logging** | Pino (structured JSON logging) |
| **Build** | esbuild (API server), Vite (frontend) |
| **Monorepo** | npm workspaces |

## Project Structure

```
security-guard-erp/
├── artifacts/
│   ├── api-server/          # Express 5 API server
│   │   ├── src/
│   │   │   ├── index.ts     # Entry point (port 5000)
│   │   │   ├── app.ts       # Express app setup
│   │   │   ├── routes/      # API route handlers
│   │   │   ├── middlewares/  # Auth middleware (JWT)
│   │   │   └── lib/         # Logger, utilities
│   │   ├── build.mjs        # esbuild config
│   │   └── package.json
│   │
│   └── security-erp/        # React frontend
│       ├── src/
│       │   ├── App.tsx       # Root component
│       │   ├── app-routes.tsx # Route definitions
│       │   ├── components/   # UI components (shadcn/ui)
│       │   ├── contexts/     # Auth context
│       │   ├── hooks/        # Custom hooks
│       │   ├── lib/          # Utilities
│       │   └── pages/        # Page components
│       ├── vite.config.ts
│       └── package.json
│
├── lib/
│   ├── db/                   # Database schema & connection
│   │   ├── src/
│   │   │   ├── index.ts      # Drizzle client + pg pool
│   │   │   └── schema/       # Table definitions
│   │   └── drizzle.config.ts
│   │
│   ├── api-spec/             # OpenAPI specification
│   │   ├── openapi.yaml      # API contract
│   │   └── orval.config.ts   # Code generator config
│   │
│   ├── api-client-react/     # Generated React Query hooks
│   │   └── src/generated/    # Auto-generated from OpenAPI
│   │
│   └── api-zod/              # Generated Zod schemas
│       └── src/generated/    # Auto-generated from OpenAPI
│
├── scripts/                  # Dev scripts & utilities
├── .env.example              # Environment variable template
├── tsconfig.base.json        # Shared TypeScript config
└── package.json              # Root workspace config
```

## Prerequisites

- **Node.js** >= 20
- **npm** >= 10
- **PostgreSQL** >= 15

## Quick Start

### 1. Clone & Install Dependencies

```bash
git clone <your-repo-url>
cd security-guard-erp
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL` — Your PostgreSQL connection string
- `JWT_SECRET` — A strong secret key (min 32 characters)
- `PORT` — API server port (default: 5000)

### 3. Set Up the Database

Create the PostgreSQL database:

```bash
createdb security_guard_erp
```

Push the schema to the database:

```bash
npm run db:push
```

### 4. Run in Development

Start the API server (port 5000):

```bash
npm run dev:api
```

In a separate terminal, start the frontend (port 5173):

```bash
npm run dev:web
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## API Endpoints

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Login with email + password |
| GET | `/api/auth/me` | Get current user (requires JWT) |
| POST | `/api/auth/logout` | Logout (client-side token discard) |

### Core Resources
| Module | Endpoints |
|--------|-----------|
| **Dashboard** | `/api/dashboard/summary`, `/api/dashboard/activity`, `/api/dashboard/attendance-overview`, `/api/dashboard/incident-stats` |
| **Users** | CRUD at `/api/users` |
| **Guards** | CRUD at `/api/guards`, `/api/guards/stats` |
| **Clients** | CRUD at `/api/clients` |
| **Sites** | CRUD at `/api/sites` |
| **Operations** | `/api/operations/shifts`, `/api/operations/attendance`, `/api/operations/patrols`, `/api/operations/checkpoints`, `/api/operations/incidents`, `/api/operations/daily-reports` |
| **HR** | `/api/hr/leave`, `/api/hr/training`, `/api/hr/recruitment` |
| **Finance** | `/api/finance/payroll`, `/api/finance/invoices`, `/api/finance/expenses` |
| **Assets** | `/api/assets/equipment`, `/api/assets/vehicles` |
| **Notifications** | `/api/notifications` |

## Database Schema

The database uses **Drizzle ORM** with schemas organized by domain:

- `users.ts` — User accounts with role-based access (8 roles)
- `clients.ts` — Clients and their sites
- `guards.ts` — Guard profiles linked to user accounts
- `operations.ts` — Shifts, attendance, checkpoints, patrols, incidents, daily reports
- `hr.ts` — Leave requests, training sessions, applicants
- `finance.ts` — Payroll, invoices, expenses
- `assets.ts` — Equipment and vehicles
- `notifications.ts` — Notifications and activity log

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:api` | Start API server in development |
| `npm run dev:web` | Start frontend dev server |
| `npm run build` | Typecheck + build all packages |
| `npm run typecheck` | Run TypeScript checks across all packages |
| `npm run db:push` | Push DB schema changes to PostgreSQL |

## Deployment

### Frontend (Vercel / Netlify)

```bash
# Build the frontend
cd artifacts/security-erp
npm run build
# Output is in artifacts/security-erp/dist/
```

**Vercel:** Connect repo → set root directory to `artifacts/security-erp` → build command: `npm run build` → output: `dist`

**Netlify:** Same setup. Add a `_redirects` file for SPA routing:
```
/*    /index.html   200
```

### Backend (Render / Railway / VPS)

```bash
# Build the API server
cd artifacts/api-server
npm run build
# Start production server
NODE_ENV=production PORT=8080 npm run start
```

**Render:** Create a Web Service → build command: `npm run build` → start command: `node artifacts/api-server/dist/index.mjs` → set `DATABASE_URL`, `JWT_SECRET`, `PORT` env vars.

### Environment Variables for Production

```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=<strong-random-string-min-32-chars>
JWT_EXPIRES_IN=7d
PORT=8080
NODE_ENV=production
```

## License

MIT
