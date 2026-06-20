# Anamoria

Patient-centred medical history platform — hackathon MVP.

## Project structure

```
anamoria/
├── frontend/          # React + Vite + TypeScript + Tailwind
├── backend/           # Express + TypeScript + Zod (mock data, no DB)
├── shared/
│   └── types/         # Shared TypeScript interfaces and enums
└── README.md
```

## Quick start

### 1. Install dependencies

```bash
# From repo root
npm run install:all

# Or manually
cd frontend && npm install
cd ../backend && npm install
```

### 2. Environment variables

```bash
# Frontend
cp frontend/.env.example frontend/.env

# Backend
cp backend/.env.example backend/.env
```

No changes needed — defaults work out of the box.

### 3. Run (two terminals)

**Terminal 1 — backend (port 4000)**
```bash
cd backend && npm run dev
```

**Terminal 2 — frontend (port 5173)**
```bash
cd frontend && npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

---

## API routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/patients` | List patients |
| GET | `/api/patients/:id` | Get patient by ID |
| POST | `/api/patients` | Create patient |
| POST | `/api/patients/:id/symptoms` | Add symptom |
| GET | `/api/patients/:id/timeline` | Get timeline nodes |
| POST | `/api/patients/:id/timeline` | Add timeline node |
| GET | `/api/patients/:id/records` | Get uploaded records |
| POST | `/api/patients/:id/records` | Add uploaded record |
| GET | `/api/patients/:id/family` | Get family members |
| POST | `/api/patients/:id/family` | Add family member |
| GET | `/api/physicians` | List physicians |
| GET | `/api/physicians/:id` | Get physician by ID |
| POST | `/api/physicians` | Create physician |
| GET | `/api/timeline/:nodeId` | Get timeline node |
| PATCH | `/api/timeline/:nodeId/verify` | Update verification status |
| POST | `/api/timeline/:nodeId/notes` | Add physician note |
| GET | `/api/access-requests` | List access requests |
| POST | `/api/access-requests` | Create access request |
| PATCH | `/api/access-requests/:id/approve` | Approve request |
| PATCH | `/api/access-requests/:id/deny` | Deny request |
| POST | `/api/referrals` | Create referral packet |
| GET | `/api/referrals/:id` | Get referral packet |

## Demo data

- **Patient:** Layla Hassan (`pat-001`)
- **Physician:** Dr. Amir Khan (`phys-001`) — Dermatology, Riverside Family Health Clinic
- **Physician:** Dr. Omar Benali (`phys-002`) — Family Medicine

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Axios |
| Backend | Node.js, Express, TypeScript, Zod, CORS, dotenv |
| Data | In-memory mock data (no database) |
| Shared | TypeScript interfaces + enums in `shared/types/` |
