# Deployment Architecture

## 1. Production Hosting & Runtime Model

The production deployment of **SchoolOps** is partitioned into three decoupled tiers:
1. **Frontend Tier**: Next.js 16 App Router application deployed on frontend hosting (Render / Vercel).
2. **Backend Tier**: Node.js + Express + TypeScript REST API deployed as a **Render Web Service**.
3. **Database Tier**: Relational **Render PostgreSQL** database.

```mermaid
graph TD
    subgraph Client ["Client Device (Browser)"]
        BrowserApp["React 19 SPA (Next.js 16)"]
    end

    subgraph FrontendHosting ["Frontend Tier (Render / Vercel)"]
        NextServer["Next.js App Server & Static CDN"]
        NextConfig["API Proxy / Rewrites (/api/*, /health)"]
    end

    subgraph BackendHosting ["Backend Tier (Render Web Service)"]
        ExpressApp["Express + Node.js + TypeScript"]
        AuthMiddleware["Authentication & RBAC Middleware"]
        Controllers["Express Controllers & Validators"]
        Services["Business Logic & Domain Invariants"]
        HealthEndpoint["GET /health"]
    end

    subgraph DatabaseTier ["Database Tier (Render PostgreSQL)"]
        PgDatabase[("PostgreSQL 16 Engine<br/>12 Tables, Triggers, Constraints")]
    end

    BrowserApp -->|"HTTPS / User Interaction"| NextServer
    NextServer -->|"Proxy / Reverse Route"| NextConfig
    NextConfig -->|"REST API / JSON<br/>(Bearer Token / Cookie)"| ExpressApp
    ExpressApp --> AuthMiddleware
    AuthMiddleware --> Controllers
    Controllers --> Services
    Services -->|"Parameterized SQL<br/>(pg Connection Pool)"| PgDatabase
    ExpressApp -.-> HealthEndpoint
```

---

## 2. Render Web Service (Express Backend)

### 2.1. Service Settings
- **Service Type**: Web Service
- **Environment**: Node
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Health Check Path**: `/health`

### 2.2. Environment Variables
| Variable | Example / Purpose | Secret? |
| :--- | :--- | :---: |
| `PORT` | Set automatically by Render (e.g., `10000` or `4000`) | No |
| `NODE_ENV` | `production` | No |
| `DATABASE_URL` | Connection string from Render PostgreSQL (`postgresql://...`) | Yes |
| `JWT_SECRET` | 32+ character random secret for signing tokens | Yes |
| `CORS_ORIGIN` | Allowed frontend origin URL (e.g. `https://schoolops.onrender.com`) | No |

---

## 3. Render PostgreSQL (Database)

### 3.1. Provisioning & Connection
- **Engine**: PostgreSQL 16+
- **Access**: Internal connection string used by the backend in the same region (avoids public internet egress and latency).
- **SSL**: Encrypted connections enforced with `{ rejectUnauthorized: false }`.

### 3.2. Migration Execution
Database migrations are versioned under `backend/migrations/` and executed sequentially:
```bash
# Execute migrations against Render PostgreSQL
DATABASE_URL="postgresql://user:password@render-host/school_ops" npm run migrate
```
Migration sequence:
1. `001_initial_schema.sql` (Tables: users, classes, students, desks, seats, attendance...)
2. `002_constraints.sql` (Unique keys and check constraints)
3. `003_indexes.sql` (Query performance indexes)
4. `004_functions.sql` (Triggers and capacity functions)
5. `005_triggers.sql` (Auto updated_at and max students triggers)
6. `006_seed.sql` (Seed dataset with bcrypt hashed accounts)

---

## 4. Frontend Configuration & Next.js Rewrites

### 4.1. Local & Production Rewrites (`next.config.ts`)
Next.js acts as an API gateway, proxying `/api/*` and `/health` requests directly to the Express backend without cross-origin configuration friction:

```typescript
const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:4000";

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${backendUrl}/health`,
      },
    ];
  },
};
```

---

## 5. Health Monitoring & Zero-Downtime Deploys

Render continuously polls the `/health` endpoint:
- **Endpoint**: `GET /health`
- **Behavior**: Executes a lightweight `SELECT 1` query to verify PostgreSQL connectivity.
- **Success Response**: `HTTP 200 OK`
  ```json
  {
    "status": "ok",
    "database": "connected",
    "timestamp": "2026-09-23T10:45:00.000Z"
  }
  ```
- **Failure Response**: `HTTP 503 Service Unavailable` if database connection drops.
- Render holds incoming traffic to the new instance until `/health` returns `200 OK`, guaranteeing zero-downtime rollouts.
