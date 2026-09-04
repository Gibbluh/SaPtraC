# SaPTraC — Complete Setup Guide

This guide walks you through setting up **SaPTraC** (Sistema ng Pamamahala sa Transportasyon at Kooperatiba) on a Windows machine from scratch — including Node.js, MongoDB Atlas, environment variables, database seeding, and running the app locally.

---

## Table of Contents

1. [What is SaPTraC?](#what-is-saptrac)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [MongoDB Atlas — Connect Your Existing Cluster](#mongodb-atlas--connect-your-existing-cluster)
5. [Upstash Redis Setup](#upstash-redis-setup)
6. [Backend Environment Configuration](#backend-environment-configuration)
7. [Frontend Environment Configuration](#frontend-environment-configuration)
8. [Hardcoded IP Checklist (Critical)](#hardcoded-ip-checklist-critical)
9. [Install Dependencies](#install-dependencies)
10. [Seed Initial Database Users](#seed-initial-database-users)
11. [Run the Application](#run-the-application)
12. [Database Schema Overview](#database-schema-overview)
13. [Optional Services](#optional-services)
14. [Production Build](#production-build)
15. [Troubleshooting](#troubleshooting)
16. [Security Notes](#security-notes)

---

## What is SaPTraC?

SaPTraC is a **fleet and transport cooperative management system**. It is a full-stack **JavaScript** application — **not** a PHP/XAMPP app. Even though the project lives under `f:\XAMPP\htdocs\SaPTraC`, you do **not** need Apache or MySQL from XAMPP to run it.

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 8, Tailwind CSS, DaisyUI |
| Backend | Node.js, Express 5, Socket.IO |
| Database | **MongoDB** (via Mongoose) — database name: `notes_db` |
| Rate limiting | Upstash Redis |
| Auth | JWT (jsonwebtoken + bcryptjs) |

**Default ports:**

| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite dev server) | `5173` | `http://localhost:5173` |
| Backend API + Socket.IO | `3000` | `http://localhost:3000` |

**User roles:** Super Admin, Administrator, Cashier, Fuel Pump Attendant, Operational Manager, Mechanic.

---

## Prerequisites

Install the following before proceeding:

### 1. Node.js (required)

- **Version:** Node.js **20.19+** or **22.12+** (required by Vite 8)
- Download from [https://nodejs.org](https://nodejs.org) (LTS recommended)
- Verify installation:

```powershell
node -v
npm -v
```

### 2. MongoDB Atlas account (required)

You already have an existing Atlas cluster. This guide explains how to connect to it in the next section.

### 3. Upstash account (required)

- Free tier at [https://upstash.com](https://upstash.com)
- Used for API rate limiting in the backend

### 4. Git (optional)

Only needed if you want version control.

### What you do NOT need

- **XAMPP Apache** — not used for development
- **XAMPP MySQL/MariaDB** — SaPTraC uses MongoDB, not SQL
- **PHP** — not used anywhere in this project
- **Composer** — not applicable

---

## Project Structure

```
SaPTraC/
├── backend/                  # Express API server
│   ├── .env                  # Backend secrets (create/configure this)
│   ├── package.json
│   ├── src/
│   │   ├── server.js         # App entry point
│   │   ├── config/
│   │   │   ├── db.js         # MongoDB connection
│   │   │   └── upstash.js    # Redis rate limiting
│   │   ├── models/           # Mongoose schemas (12 collections)
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── socket/
│   │   └── utils/
│   │       └── createUser.js # Seed script for default users
│   └── uploads/              # File uploads (auto-created at runtime)
│       ├── drivers/
│       └── maintenance/
├── frontend/                 # React SPA
│   ├── .env                  # Frontend config (create/configure this)
│   ├── package.json
│   ├── vite.config.js        # Dev server on port 5173
│   └── src/
│       ├── App.jsx           # Route definitions
│       ├── lib/axios.js      # API client
│       └── pages/
└── diagrams/
    ├── system-architecture-diagram.md
    └── entity-relationship-diagram.md
```

---

## MongoDB Atlas — Connect Your Existing Cluster

SaPTraC stores all data in **MongoDB Atlas** (cloud). There are **no SQL files, migrations, or schema dumps** — collections are created automatically when the app writes data for the first time.

### Step 1: Log in to MongoDB Atlas

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Sign in with the account that owns the existing cluster

### Step 2: Find your cluster

1. On the Atlas dashboard, click **Database** (or **Clusters**) in the left sidebar
2. You should see your existing cluster (e.g. `Cluster0`)
3. Click **Connect** on that cluster

### Step 3: Get the connection string

1. Choose **Drivers** as the connection method
2. Select **Node.js** as the driver and the latest version
3. Copy the connection string — it looks like:

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

4. Replace `<password>` with the actual password for your database user
5. **Add the database name** `notes_db` before the `?` in the URI:

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/notes_db?retryWrites=true&w=majority&appName=Cluster0
```

> **Tip:** If the project already has a `backend/.env` with a `MONGO_URI`, you may only need to whitelist your IP (Step 5) and confirm you know the database user's password. Ask the person who set up the cluster if you don't have the credentials.

### Step 4: Verify database user access

1. In Atlas, go to **Database Access** (left sidebar under Security)
2. Confirm a user exists with **read and write** permissions
3. If no user exists, click **Add New Database User**:
   - Authentication method: **Password**
   - Set a username and password (save the password — you need it for the URI)
   - Database User Privileges: **Read and write to any database** (or restrict to `notes_db`)
   - Click **Add User**

### Step 5: Whitelist your IP address

Atlas blocks connections from unknown IPs by default. This is the most common reason a connection fails.

1. In Atlas, go to **Network Access** (left sidebar under Security)
2. Click **Add IP Address**
3. For local development, choose one of:
   - **Add Current IP Address** (recommended) — adds your machine's public IP
   - **Allow Access from Anywhere** (`0.0.0.0/0`) — convenient for dev, less secure; do not use in production
4. Click **Confirm**
5. Wait 1–2 minutes for the rule to take effect

### Step 6: Set MONGO_URI in backend/.env

Open `backend/.env` and set:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/notes_db?retryWrites=true&w=majority&appName=Cluster0
```

Replace `<username>`, `<password>`, and `<cluster>` with your actual values.

### Step 7: Test the connection

Run the seed script (see [Seed Initial Database Users](#seed-initial-database-users)). If you see `MongoDB Connected`, the connection works.

### How the database works

- **No manual table/collection creation** — Mongoose creates collections on first write
- **No migration scripts** — schema is defined in `backend/src/models/`
- **Database name:** `notes_db`
- **Full schema diagram:** see `diagrams/entity-relationship-diagram.md`

---

## Upstash Redis Setup

The backend uses Upstash Redis for API rate limiting.

### Step 1: Create an Upstash database

1. Sign up or log in at [https://upstash.com](https://upstash.com)
2. Click **Create Database**
3. Choose a name and region (pick one close to you)
4. Select the **Free** tier
5. Click **Create**

### Step 2: Copy credentials

On your database's page, find:

- **UPSTASH_REDIS_REST_URL** — looks like `https://your-name-xxxxx.upstash.io`
- **UPSTASH_REDIS_REST_TOKEN** — a long token string

### Step 3: Add to backend/.env

```env
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

---

## Backend Environment Configuration

Create or edit `backend/.env` with the following variables:

```env
# MongoDB Atlas connection string
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/notes_db?retryWrites=true&w=majority&appName=Cluster0

# API server port (default: 3000)
PORT=3000

# JWT signing secret — use a long random string
TOKEN=your_super_secret_jwt_key_here

# Frontend URL — used for QR codes, fuel receipts, and driver/unit dashboard links
# Use localhost for local dev, or your LAN IP if testing QR codes from a phone
FRONTEND_URL=http://localhost:5173

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here

# Optional: Android SMS gateway (LAN device)
ANDROID_SMS_GATEWAY_URL=http://<sms-device-ip>:8080/send-sms
ANDROID_SMS_GATEWAY_TOKEN=your_sms_token
```

### Variable reference

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `PORT` | No | API port (default `3000`) |
| `TOKEN` | Yes | JWT signing secret for login sessions |
| `FRONTEND_URL` | Yes | Base URL for QR links and public dashboards |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis auth token |
| `ANDROID_SMS_GATEWAY_URL` | No | SMS notification gateway endpoint |
| `ANDROID_SMS_GATEWAY_TOKEN` | No | SMS gateway auth token |

### JWT secret note

Some auth middleware references `JWT_SECRET` while the main auth flow uses `TOKEN`. To avoid login issues, you can add both with the same value:

```env
TOKEN=your_super_secret_jwt_key_here
JWT_SECRET=your_super_secret_jwt_key_here
```

---

## Frontend Environment Configuration

Create or edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

### Variable reference

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_API_URL` | Yes | Backend API base URL |
| `VITE_SOCKET_URL` | No | Socket.IO server URL (defaults to port 5000 in some components — set this explicitly) |

> **Important:** Several frontend files still have hardcoded LAN IPs that ignore these env vars. See the next section.

---

## Hardcoded IP Checklist (Critical)

The project was originally developed on a machine with LAN IP `192.168.68.105`. Several files still point to that address. **You must update these for the app to work on your machine.**

### Quick fix: find and replace

Search the project (excluding `node_modules`) for `192.168.68.105` and replace with:

- `localhost` — if you only use the app on this PC
- Your machine's LAN IP — if you need QR codes or mobile access (find it with `ipconfig` in PowerShell, look for IPv4 Address)

### Files that need updating

| File | What to change |
|------|----------------|
| `frontend/src/lib/axios.js` | `baseURL` is hardcoded to `http://192.168.68.105:3000/api` — change to `http://localhost:3000/api` or use `import.meta.env.VITE_API_URL` |
| `frontend/src/lib/fuelApi.js` | Two hardcoded URLs on lines 11 and 56 — replace `192.168.68.105` with your host |
| `frontend/src/lib/socket.js` | Fallback URL uses `192.168.68.105` — replace or rely on `VITE_API_URL` in `.env` |
| `frontend/src/pages/public/DriverDashboard.jsx` | Profile image URL hardcoded to `192.168.68.105:3000` |
| `frontend/.env` | `VITE_API_URL` may still point to old IP |
| `backend/.env` | `FRONTEND_URL` may still point to `http://192.168.68.105:5173` |

### Socket.IO port mismatch

Some components default to port **5000** for Socket.IO, but the backend runs on port **3000**. Always set in `frontend/.env`:

```env
VITE_SOCKET_URL=http://localhost:3000
```

Affected files (they read `VITE_SOCKET_URL` with a wrong fallback):

- `frontend/src/pages/mechanic/MechanicDashboard.jsx`
- `frontend/src/components/fuel/FuelAlertNotification.jsx`

### Recommended axios.js fix

Change `frontend/src/lib/axios.js` from:

```js
baseURL: "http://192.168.68.105:3000/api",
```

To:

```js
baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
```

This makes the frontend respect your `.env` file.

---

## Install Dependencies

Open **two** PowerShell terminals (you'll need both later). Run these commands:

### Backend

```powershell
cd f:\XAMPP\htdocs\SaPTraC\backend
npm install
```

### Frontend

```powershell
cd f:\XAMPP\htdocs\SaPTraC\frontend
npm install
```

This installs all packages listed in each `package.json`. The root `SaPTraC/package.json` has a few shared deps but is **not** required for normal development.

---

## Seed Initial Database Users

After MongoDB is connected, create the default login accounts by running the seed script **once**:

```powershell
cd f:\XAMPP\htdocs\SaPTraC\backend
node src/utils/createUser.js
```

Expected output:

```
Mongo URI: mongodb+srv://...
MongoDB Connected
Super Admin created
Administrator created
Cashier User created
...
```

If a role already exists, you'll see `already exists` instead of `created`.

### Default login accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@sptc.com` | `Admin123!` |
| Administrator | `administrator@gmail.com` | `Admin123!` |
| Cashier | `cashier@gmail.com` | `Cashier123!` |
| Mechanic | `mechanic@gmail.com` | `Mechanic123!` |
| Fuel Pump Attendant | `fuel@gmail.com` | `Fuel123!` |
| Operational Manager | `opmanager@gmail.com` | `Manager123!` |

Use **Super Admin** for first login and full system access.

> Passwords are hashed with bcrypt before being stored in MongoDB. The script only creates users that don't already exist (matched by email).

---

## Run the Application

You need **two terminals** running at the same time.

### Terminal 1 — Backend

```powershell
cd f:\XAMPP\htdocs\SaPTraC\backend
npm run dev
```

Expected output:

```
MongoDB Connected: ...
Server running on port 3000
```

`npm run dev` uses **nodemon** to auto-restart on file changes. For production, use `npm start`.

### Terminal 2 — Frontend

```powershell
cd f:\XAMPP\htdocs\SaPTraC\frontend
npm run dev
```

Expected output:

```
VITE v8.x.x  ready in ...ms
➜  Local:   http://localhost:5173/
```

### Verify everything works

1. Open **http://localhost:5173** in your browser
2. You should see the login page
3. Log in with `admin@sptc.com` / `Admin123!`
4. Check backend health: **http://localhost:3000/health** — should return `{"ok":true}`

### API routes

All API endpoints are under `/api`:

| Prefix | Purpose |
|--------|---------|
| `/api/auth` | Login, register, logout |
| `/api/users` | User management |
| `/api/drivers` | Driver CRUD + public dashboard |
| `/api/units` | Vehicle/unit management |
| `/api/schedules` | Scheduling |
| `/api/fuel` | Fuel transactions, receipts, QR |
| `/api/remittances` | Remittance tracking |
| `/api/maintenance` | Maintenance requests |
| `/api/analytics` | Dashboard analytics |
| `/api/repair-history` | Repair audit trail |
| `/api/notes` | Notes |
| `/api/revenue` | Revenue data |

### Frontend routes

| Path | Access |
|------|--------|
| `/`, `/login` | Public |
| `/dashboard`, `/users`, `/drivers`, `/units`, `/schedules`, `/fuel`, `/remittances`, `/maintenance`, `/analytics` | Protected (requires login) |
| `/driver/:id`, `/unit/:id`, `/fuel/:id` | Public QR dashboards |
| `/fuel/daily-receipt/:dateKey` | Public daily fuel receipt |

---

## Database Schema Overview

SaPTraC uses **12 MongoDB collections**, defined by Mongoose models in `backend/src/models/`:

| Model file | Collection (approx.) | Purpose |
|------------|----------------------|---------|
| `User.js` | `users` | System accounts and roles |
| `driver.model.js` | `drivers` | Driver profiles, licenses, QR codes |
| `unit.model.js` | `units` | Vehicles/units |
| `schedule.model.js` | `schedules` | Driver-unit scheduling |
| `fuelTransaction.model.js` | `fueltransactions` | Fuel purchases and receipts |
| `remittance.model.js` | `remittances` | Driver remittances |
| `maintenance.model.js` | `maintenances` | Maintenance requests |
| `notification.model.js` | `notifications` | User notifications |
| `scheduleHistory.model.js` | `schedulehistories` | Schedule change audit trail |
| `remittanceHistory.model.js` | `remittancehistories` | Remittance change audit trail |
| `repairHistory.model.js` | `repairhistories` | Repair audit trail |
| `Note.js` | `notes` | Standalone notes |

### Key relationships

- **Users** create drivers/units, assign schedules, record fuel, verify remittances
- **Drivers** can be assigned to **Units**
- **Schedules** link a driver + unit → fuel transactions → remittances
- **Units** → maintenance requests → repair history
- Several models use soft deletes via a `deletedAt` field

For a visual diagram, see `diagrams/entity-relationship-diagram.md`.

**No manual setup is needed** — just connect MongoDB and run the app. Collections appear when data is first written.

---

## Optional Services

### Android SMS Gateway

SMS notifications are sent through a custom LAN Android SMS gateway, not a cloud provider like Twilio.

```env
ANDROID_SMS_GATEWAY_URL=http://<device-ip>:8080/send-sms
ANDROID_SMS_GATEWAY_TOKEN=your_token
```

If these are not configured, the rest of the app still works — only SMS features are affected.

### File uploads

The backend stores uploaded files on disk:

- `backend/uploads/drivers/` — driver photos and documents
- `backend/uploads/maintenance/` — maintenance documents

These folders are created automatically. Ensure the Node.js process has write permission to the `backend/` directory.

---

## Production Build

### Build the frontend

```powershell
cd f:\XAMPP\htdocs\SaPTraC\frontend
npm run build
```

Output goes to `frontend/dist/`.

### Start the backend in production mode

```powershell
cd f:\XAMPP\htdocs\SaPTraC\backend
npm start
```

### Preview the production build locally

```powershell
cd f:\XAMPP\htdocs\SaPTraC\frontend
npm run preview
```

### Optional: serve via XAMPP Apache

If you want to use XAMPP Apache as a reverse proxy in production, add a virtual host (example only — not included in the repo):

```apache
<VirtualHost *:80>
    ServerName saptrac.local
    DocumentRoot "f:/XAMPP/htdocs/SaPTraC/frontend/dist"

    <Directory "f:/XAMPP/htdocs/SaPTraC/frontend/dist">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    ProxyPass /api http://127.0.0.1:3000/api
    ProxyPassReverse /api http://127.0.0.1:3000/api
    ProxyPass /socket.io http://127.0.0.1:3000/socket.io
    ProxyPassReverse /socket.io http://127.0.0.1:3000/socket.io
</VirtualHost>
```

Enable Apache modules: `mod_proxy`, `mod_proxy_http`, `mod_proxy_wstunnel`, `mod_rewrite`.

---

## Troubleshooting

### MongoDB connection errors

| Error | Cause | Fix |
|-------|-------|-----|
| `MongoServerError: bad auth` | Wrong username or password in `MONGO_URI` | Verify credentials in Atlas → Database Access; URL-encode special characters in the password |
| `MongoNetworkError` / `ETIMEOUT` | Your IP is not whitelisted | Atlas → Network Access → Add Current IP Address; wait 1–2 minutes |
| `MongoServerSelectionError` | Cluster is paused or URI is wrong | Check cluster is running in Atlas; verify the connection string |
| `MongoDB Connected` never appears | `.env` not loaded or `MONGO_URI` missing | Ensure `backend/.env` exists and `MONGO_URI` is set; restart the backend |

### Frontend cannot reach the API

| Symptom | Cause | Fix |
|---------|-------|-----|
| Network errors on login | Hardcoded IP in `axios.js` | Update `frontend/src/lib/axios.js` to use `localhost` or `VITE_API_URL` (see [Hardcoded IP Checklist](#hardcoded-ip-checklist-critical)) |
| Fuel pages fail but others work | Hardcoded IP in `fuelApi.js` | Replace `192.168.68.105` in `frontend/src/lib/fuelApi.js` |
| CORS errors | Backend not running | Start the backend on port 3000 first |
| `ECONNREFUSED` | Wrong port or backend down | Confirm backend is running; check `PORT` in `backend/.env` |

### Socket.IO / real-time features not working

| Symptom | Cause | Fix |
|---------|-------|-----|
| Mechanic dashboard not updating | Wrong socket port (defaults to 5000) | Set `VITE_SOCKET_URL=http://localhost:3000` in `frontend/.env` |
| Notifications not appearing | Socket URL mismatch | Same fix as above; restart the frontend dev server after changing `.env` |

### Upstash / rate limiting errors

| Error | Cause | Fix |
|-------|-------|-----|
| Redis connection error on startup | Missing or invalid Upstash credentials | Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `backend/.env` |
| Rate limit errors during normal use | Too many requests | Wait a minute and retry; check Upstash dashboard for usage |

### Login / auth issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Invalid credentials" | Users not seeded | Run `node src/utils/createUser.js` from the `backend/` folder |
| Login succeeds but pages redirect back | JWT secret mismatch | Set both `TOKEN` and `JWT_SECRET` to the same value in `backend/.env` |
| Token expired errors | Session timeout | Log out and log back in |

### General tips

- After changing `.env` files, **restart** the affected server (backend or frontend)
- Vite only reads `VITE_*` variables at startup — restart `npm run dev` after editing `frontend/.env`
- Check the backend terminal for error messages when something fails
- Test the API directly: `http://localhost:3000/health` should return `{"ok":true}`

---

## Security Notes

- **Never commit `.env` files** with real credentials to version control
- **Rotate credentials** if they were ever shared or exposed
- **Change default seeded passwords** (`Admin123!`, etc.) before deploying to production
- **Restrict Atlas Network Access** to specific IPs in production — avoid `0.0.0.0/0`
- Use a **strong, unique `TOKEN`** value for JWT signing (long random string)
- The `backend/src/config/db.js` file may contain a commented-out connection string — do not uncomment it; use `backend/.env` instead

---

## Quick Start Checklist

Use this checklist to confirm your setup is complete:

- [ ] Node.js 20.19+ installed (`node -v`)
- [ ] MongoDB Atlas cluster accessible; IP whitelisted
- [ ] `MONGO_URI` set in `backend/.env`
- [ ] Upstash Redis credentials set in `backend/.env`
- [ ] `TOKEN` (and optionally `JWT_SECRET`) set in `backend/.env`
- [ ] `FRONTEND_URL` set in `backend/.env`
- [ ] `VITE_API_URL` and `VITE_SOCKET_URL` set in `frontend/.env`
- [ ] Hardcoded `192.168.68.105` IPs replaced in frontend source files
- [ ] `npm install` completed in both `backend/` and `frontend/`
- [ ] Seed script run: `node src/utils/createUser.js`
- [ ] Backend running: `npm run dev` in `backend/`
- [ ] Frontend running: `npm run dev` in `frontend/`
- [ ] Login works at `http://localhost:5173` with `admin@sptc.com` / `Admin123!`
- [ ] Health check passes: `http://localhost:3000/health`

---

*For architecture and database diagrams, see the `diagrams/` folder.*
