# Class Manager — REST API Backend

A dedicated REST API service for the Class Manager platform, built on **Node.js**, **Express**, **TypeScript**, and a relational **PostgreSQL** database.

---

## 🛠️ Technology Stack

* **Runtime:** Node.js (>= 20)
* **Framework:** Express 4.21
* **Language:** TypeScript 5.8
* **Database:** PostgreSQL 16 (Native PostgreSQL or Render PostgreSQL)
* **Database Client:** `pg` (node-postgres connection pool)
* **Security & Auth:** `bcryptjs` (password hashing), `jsonwebtoken` (signed JWT tokens & HttpOnly cookies)
* **Request Validation:** Zod 3.24 (runtime validation on request parameters, query strings, and body payloads)
* **Development Tooling:** `tsx` (TypeScript runtime execution & watch mode)

---

## 📁 Directory Structure

```text
backend/
├── src/
│   ├── config/               # Database pool and environment configuration
│   │   ├── database.ts       # pg Pool client initialization & query helper
│   │   └── env.ts            # Environment variable validation & typing (dotenv)
│   │
│   ├── controllers/          # HTTP request handlers & response formatters
│   │   ├── announcement.controller.ts
│   │   ├── attendance.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── class.controller.ts
│   │   ├── note.controller.ts
│   │   ├── report.controller.ts
│   │   ├── seating.controller.ts
│   │   ├── student.controller.ts
│   │   ├── teacher.controller.ts
│   │   └── timetable.controller.ts
│   │
│   ├── middleware/           # Request interception, authentication & guards
│   │   ├── auth.middleware.ts     # JWT token verification from HttpOnly cookie or Bearer header
│   │   ├── error.middleware.ts    # Centralized AppError handling & standardized JSON errors
│   │   ├── rbac.middleware.ts     # Permission guards: requireRole, requireClassAccess
│   │   └── validate.middleware.ts # Zod schema validation for body, query, and params
│   │
│   ├── repositories/         # Parameterized PostgreSQL data access layer (pg Pool)
│   │   ├── announcement.repo.ts
│   │   ├── attendance.repo.ts
│   │   ├── class.repo.ts
│   │   ├── note.repo.ts
│   │   ├── report.repo.ts
│   │   ├── seating.repo.ts
│   │   ├── student.repo.ts
│   │   ├── subject.repo.ts
│   │   ├── teacher.repo.ts
│   │   ├── timetable.repo.ts
│   │   └── user.repo.ts
│   │
│   ├── routes/               # Endpoint route definitions & middleware chaining
│   │   ├── index.ts          # Master API router (prefixes /api and /health)
│   │   ├── auth.routes.ts
│   │   ├── class.routes.ts
│   │   ├── student.routes.ts
│   │   ├── seating.routes.ts
│   │   ├── attendance.routes.ts
│   │   ├── timetable.routes.ts
│   │   ├── announcement.routes.ts
│   │   ├── note.routes.ts
│   │   ├── teacher.routes.ts
│   │   ├── report.routes.ts
│   │   └── health.routes.ts
│   │
│   ├── services/             # Domain business logic, invariant enforcement & transactions
│   │   ├── announcement.service.ts
│   │   ├── attendance.service.ts
│   │   ├── auth.service.ts
│   │   ├── class.service.ts
│   │   ├── note.service.ts
│   │   ├── report.service.ts
│   │   ├── seating.service.ts
│   │   ├── student.service.ts
│   │   ├── teacher.service.ts
│   │   └── timetable.service.ts
│   │
│   ├── types/                # TypeScript type definitions & Express Request extensions
│   ├── utils/                # Bcrypt helpers, JWT utilities, AppError error classes
│   ├── validators/           # Zod schema definitions for all endpoint payloads
│   ├── app.ts                # Express application configuration, CORS, and cookie parsing
│   └── server.ts             # HTTP server listener bootstrapper & graceful shutdown handling
│
├── migrations/               # Sequenced PostgreSQL SQL migration files
│   ├── 001_initial_schema.sql  # 12 normalized secondary school database tables
│   ├── 002_constraints.sql     # Foreign keys, check constraints, and capacity limits
│   ├── 003_indexes.sql         # Query acceleration indexes on frequent lookups
│   ├── 004_functions.sql       # PostgreSQL stored procedures & utility functions
│   ├── 005_triggers.sql        # Automated timestamp update triggers
│   └── 006_seed.sql            # Deterministic baseline data (16 classes, 24 teachers, 480 students)
│
├── scripts/                  # Administrative database scripts
│   └── migrate.ts            # Migration runner applying SQL files in sequence
│
├── .env.example              # Backend environment variable template
├── .gitignore
├── tsconfig.json
└── package.json
```

---

## 🚀 Running Locally

### 1. Install Dependencies (from within `backend/`):
```bash
npm install
```

### 2. Configure Environment Variables:
Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```

Required settings in `.env`:
```env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/class_manager
JWT_SECRET=super_secret_jwt_key_change_in_production_32chars
SESSION_SECRET=super_secret_session_key_change_in_production
CORS_ORIGIN=http://localhost:3000
```

### 3. Run Database Migrations:
Create database schema, apply constraints, and load seed data:
```bash
npm run migrate
```

### 4. Start Development Server:
```bash
npm run dev
```
The REST API will be accessible at: **`http://localhost:4000`**  
Health check endpoint: **`http://localhost:4000/health`**

### 5. Compile & Run Production:
```bash
npm run build
npm run start
```

---

## 📡 REST API Endpoint Catalog

| Endpoint | Method | Authorization | Description |
| :--- | :---: | :--- | :--- |
| `/health` | GET | Public | Server health status check |
| `/api/auth/login` | POST | Public | Authenticates credentials, sets HttpOnly JWT cookie |
| `/api/auth/logout` | POST | Authenticated | Clears auth cookie, terminates session |
| `/api/auth/me` | GET | Authenticated | Returns current authenticated user record |
| `/api/classes` | GET | Authenticated | Retrieves classes list with homeroom assignments |
| `/api/classes/:classId/students` | GET, POST | GVCN / Admin | Retrieves or enrolls students in a class |
| `/api/classes/:classId/students/import` | POST | GVCN / Admin | Bulk imports student records from Excel data |
| `/api/classes/:classId/seating` | GET, POST | GVCN / Admin | Fetches seating chart or updates seat assignments |
| `/api/classes/:classId/attendance` | GET, POST | GVBM / GVCN / Admin | Retrieves history or submits period/daily attendance |
| `/api/classes/:classId/timetable` | GET, POST | Authenticated (POST: Admin) | Fetches weekly timetable or mutates slots |
| `/api/teachers` | GET, POST | Admin | Manages teacher profiles and teaching assignments |
| `/api/reports/school-summary` | GET | Admin | School-wide attendance KPIs and executive analytics |
