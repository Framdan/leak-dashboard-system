# 🚀 Deployment Guide — Kigali Water Leak Monitor

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL (Free Tier)                       │
│                                                             │
│  /              → React Dashboard (Vite SPA)               │
│  /api/*         → Express.js Backend (Serverless Node)     │
│                          ↕                                  │
│               MongoDB Atlas (Free M0 cluster)               │
└─────────────────────────────────────────────────────────────┘
            ↑                           ↑
   [Wokwi Browser Sim]        [Python Simulation Scripts]
   POST /api/ingest            POST /api/readings
   (X-Device-Secret header)    (JWT Bearer token)
   — from any browser —        — from any machine with Python —
```

---

## STEP 1 — MongoDB Atlas: Allow All IPs

Your Atlas cluster only accepts connections from whitelisted IPs. Since Vercel serverless functions use dynamic IPs, you must allow all:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click your cluster → **Network Access**
3. Click **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`)
4. Click **Confirm**

> ⚠️ For production security, consider using a VPC or Vercel's static IPs (Pro plan). For your FYP demo, allowing all IPs is fine.

---

## STEP 2 — Deploy to Vercel

### Option A: Via Vercel CLI (Recommended)

```powershell
# Install Vercel CLI once
npm install -g vercel

# In your project root
cd "c:\Users\USER\Documents\YEAR 4\FINAL YEAR PROJECT\leak-dashboard-system"

# Login (opens browser)
vercel login

# Deploy to production
vercel --prod
```

### Option B: Via GitHub (Auto-deploy on push)

1. Push your project to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import from GitHub
3. Select `leak-dashboard-system` → Deploy
4. Every `git push` auto-deploys

---

## STEP 3 — Set Environment Variables on Vercel

After deploying, go to your Vercel project → **Settings** → **Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | `mongodb+srv://admin:admin123@waterproject.ll3rhnl.mongodb.net/?appName=waterproject` |
| `JWT_SECRET` | `super_secret_leak_tracer_key_2026` |
| `DEVICE_SECRET` | `wokwi-kgl002-secret-2026` |
| `FRONTEND_URL` | `https://leak-dashboard-system.vercel.app` (your actual URL) |
| `NODE_ENV` | `production` |

Click **Save** → Vercel will redeploy automatically.

---

## STEP 4 — Verify Live Backend

Once deployed, test your backend is alive:

```powershell
# Replace with your actual Vercel URL
curl https://leak-dashboard-system.vercel.app/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

Or visit in browser: `https://leak-dashboard-system.vercel.app/api/health`

---

## STEP 5 — Update Wokwi Sketch with Live URL

In `simulation/wokwi_simulation/sketch.ino`, update these two lines:

```cpp
// Line ~70 — your actual Vercel URL
const char* API_URL = "https://YOUR-PROJECT.vercel.app/api/ingest";

// Line ~76 — find your node's deviceId in the Dashboard → Monitoring Nodes
// It looks like "sim-68480a1bb8..." or a custom ID you set
const char* DEVICE_ID = "sim-<your-node-id-here>";
```

### How to find your deviceId:
1. Open dashboard → **Monitoring Nodes**
2. Click a node → note the **Node ID** / **Device ID** field
3. Paste it into `DEVICE_ID` in the sketch

---

## STEP 6 — Run Wokwi Simulation (from any browser)

1. Open [Wokwi.com](https://wokwi.com) 
2. Create a new project or open your existing one
3. Import/paste the updated `sketch.ino` and `diagram.json`
4. Click **▶ Play**
5. Turn the potentiometer → watch readings appear on your live dashboard!

> ✅ **Yes — you can run this from any browser anywhere!** The Wokwi ESP32 virtual WiFi connects to the internet, POSTs readings to your Vercel backend, which saves to MongoDB Atlas, which the React dashboard reads. Everything is cloud-hosted.

---

## STEP 7 — Run Python Simulations from Anywhere

Once the backend is live, point Python scripts to it:

**Windows:**
```powershell
$env:API_BASE_URL = "https://YOUR-PROJECT.vercel.app/api"
python simulation/run_simulation.py
```

**Mac/Linux:**
```bash
export API_BASE_URL="https://YOUR-PROJECT.vercel.app/api"
python simulation/run_simulation.py
```

The script will authenticate, fetch your node configs, and stream data to the live dashboard — from any machine with Python and internet access.

---

## Local Development (as before)

```powershell
# Terminal 1 — Backend
cd leak-dashboard-system/backend
npm run dev
# Runs on http://localhost:5000

# Terminal 2 — Frontend
cd leak-dashboard-system
npm run dev
# Runs on http://localhost:5173

# Terminal 3 — Python simulation (local)
python simulation/run_simulation.py
# (API_BASE_URL defaults to localhost:5000)
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `/api/health` returns 500 | Check MongoDB Atlas IP whitelist + Vercel env vars |
| Wokwi sketch shows "ERR: no connection" | Verify `API_URL` in sketch matches your Vercel URL |
| Wokwi shows "ERR:401" | `DEVICE_SECRET` in sketch must match Vercel env var |
| Wokwi shows "ERR:404" | `DEVICE_ID` doesn't match any node's deviceId in DB |
| Python auth fails | Check `SIM_EMAIL` / `SIM_PASS` env vars or default credentials |
| Dashboard shows no data | Check `/api/dashboard/summary` returns data |

---

## Security Checklist (for FYP submission)

- [x] JWT authentication on all dashboard API routes
- [x] Device secret (`X-Device-Secret`) on IoT ingest endpoint
- [x] Passwords hashed with bcrypt (not stored in plaintext)
- [x] CORS restricted to known origins (Vercel + Wokwi)
- [ ] *Optional: rotate `DEVICE_SECRET` after demo*
- [ ] *Optional: add rate limiting to `/api/ingest` (e.g. express-rate-limit)*
