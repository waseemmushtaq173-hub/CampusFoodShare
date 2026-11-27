# CampusFoodShare: A Web Platform to Reduce Food Waste by Connecting Surplus Food Donors with NGOs

**Department of Computer Science and Engineering**  
**Domain:** Web Development (Full-Stack) | Social Impact (SDG 2, 11 and 12)  
**Team Members:**  
- **Waseem Mushtaq Mir** (`1BG25CS184`)  
- **Harsha S** (`11BN26CS401`)  
**Project Guide:** AT Sangeeta, Assistant Professor  

---

## Project structure: frontend and backend

CampusFoodShare is a full-stack project with two clearly separated parts that talk over a JSON API.

```
CampusFoodShare/
├── frontend/                  FRONTEND (what people see, plain HTML / CSS / JavaScript, no build step)
│   ├── index.html, site.css, site.js    Public website: explains the project, donate WITHOUT an account,
│   │                                    track your donation, live food listings, helplines, FAQ, contact form
│   └── app/                             Platform web app: role dashboards (donor, NGO, volunteer, admin),
│       ├── index.html, styles.css       live map, GPS, claim / PIN collect / rate, requests, admin console
│       └── app.js, easy.js, ux.js
├── backend/                   BACKEND (Node.js + Express REST API, serves the frontend too)
│   ├── server.js                        Routes: auth, listings, requests, live updates (SSE), public API, admin
│   ├── src/models, src/storage, src/utils, src/seed    Validation, JSON-file database, Haversine, heap queue, seed data
│   ├── data/db.json                     Database file (created and seeded on first run)
│   └── test/api.test.js                 25 automated API tests (npm test)
├── package.json, render.yaml, .env.example
```

**How the two parts connect:** the frontend never stores real data. The public website and the platform call the backend (`/api/...`); the backend validates, applies role permissions, stores data and pushes live updates to every open browser. Open **`/`** for the public website and **`/app/`** for the platform.

### What a brand-new visitor can do (no account, no prior knowledge)
1. Open the website, read **"What would you like to do?"** (donate / need food / NGO or volunteer) and the FAQ.
2. **Donate food without signing up:** fill the short form. The backend creates a real listing for nearby NGOs and volunteers and returns a private tracking link.
3. **Track the donation:** see when an NGO claims it, who is coming, and the 4-digit handover PIN to give the volunteer. Withdraw it any time before it is claimed.
4. **Need food?** Find free food nearby with directions, or ask for help and call a helpline.
5. **Contact the team:** messages go to the admin's inbox in the platform.

### Main API endpoints
| Area | Endpoints |
|---|---|
| Public (no login) | `GET /api/listings`, `GET /api/impact`, `GET /api/directory`, `POST /api/public/donations`, `GET /api/public/donations/:id?token=`, `POST /api/public/donations/:id/withdraw`, `POST /api/public/contact`, `POST /api/requests`, `GET /api/requests/:id` |
| Auth | `POST /api/auth/signup`, `signin`, `signout`, `forgot`, `reset`, `password`, `GET /api/auth/me` |
| Donor / NGO / Volunteer | `POST /api/listings`, `/:id/claim`, `/:id/release`, `/:id/collect`, `/:id/feedback`, `GET /api/dashboard`, `/api/locations`, `POST /api/location` |
| Admin | `GET /api/admin/users`, `PATCH /api/admin/users/:id`, `GET/PATCH /api/admin/messages`, `POST /api/admin/start-fresh`, `POST /api/reset-demo` |
| Live | `GET /api/stream` (server-sent events) |

---

## 1. Project Overview & Problem Statement
Colleges, hostels, canteens, and campus events often throw away good cooked food while people nearby go hungry. There is no quick, simple way to notify NGOs and volunteers that surplus food is available and must be collected within a few hours before it spoils.

**CampusFoodShare** connects campus food donors with nearby NGOs and volunteers in real time, ranking available surplus food using the **Haversine distance formula** and a **Binary Min-Heap Priority Queue** for soonest-expiring listings, tracking claims until collection, enforcing a donor food-safety checklist, and visualizing social/environmental impact aligned with **UN SDGs 2, 11, and 12**.

---

## 2. Key Features Mapped to Synopsis Objectives
1. **Donor Surplus Posting (Objective 1):** Donors post surplus food with dietary type (`Veg`, `Non-Veg`, `Vegan`, `Bakery`), meal quantity, GPS pickup coordinates, and a "use before" expiry window.
2. **Nearest & Soonest-Expiring Ranking (Objective 2):** Combines the **Haversine Formula** (`src/utils/haversine.js`) and a **Min-Heap Priority Queue** (`src/utils/priorityQueue.js`) to rank listings for NGOs and volunteers.
3. **NGO Claim & Pickup Lifecycle Tracking (Objective 3):** Full state machine (`posted` → `claimed` → `collected` → `expired`) with volunteer attribution and timestamps.
4. **Automatic Expiry Cleanup & Food-Safety Checklist (Objective 4):** Expired listings are automatically swept on every query, and donors must verify a 4-point food-safety checklist before publishing.
5. **SDG 2, 11 & 12 Impact Dashboard (Objective 5):** Real-time dashboard tracking total meals saved, kilograms of food rescued, and CO₂e emissions prevented.

### Extensions beyond the five objectives (working today)
- **Role-based accounts and dashboards** (donor, NGO, volunteer, admin) with server-enforced permissions, scrypt-hashed passwords, token sessions and sign-in lockout.
- **Live map, live GPS and real-time updates** (server-sent events), including a volunteer-tracking marker on claimed pickups.
- **Handover PIN** verification at collection, and quality ratings afterwards.
- **Find food and ask for help:** people can find free food nearby without signing in, or ask for food and follow the request until a named helper accepts it. NGOs and volunteers see the queue and accept or complete requests.
- **Tap-only donating**, English / Hindi / Kannada, read-aloud, helpline directory.
- **Insights, leaderboards, admin console and audit log.**

### On hold (visible in the app, clearly marked "Soon")
Recurring surplus schedules, route planner, SMS / WhatsApp alerts, reports and certificates, photo-based freshness analysis, email delivery of reset codes, multi-campus network.

### Access
Sign-in sessions are stored hashed in the database (30 days), so people stay signed in across restarts. Forgotten passwords are recovered with a one-time 6-digit code (shown on screen in demo mode, written to the server log otherwise; email delivery is on hold). Signed-in users can change their password in Settings. Requests nobody answers expire after 3 hours.

### Demo data
Sample data is labelled in the app, and admins can click **Start empty** to clear it. Set `DEMO_MODE=off` to stop the app from regenerating demo listings when they expire.

The app seeds a believable dataset: five Bengaluru areas, a week of history, 5 donors, 3 NGOs, 3 volunteers, open food requests and demo helplines (numbers are placeholders). Primary demo accounts: `admin@campusfoodshare.org / admin123`, `donor@campusfoodshare.org / donor123`, `ngo@campusfoodshare.org / ngo123`, `volunteer@campusfoodshare.org / vol123`. Other seeded users follow the same pattern (`<role>123`). Choose your role when signing in; the server rejects a role that does not match the account.

**Tests:** `npm test` boots the real server on a throwaway database and checks auth, RBAC, the PIN lifecycle, tracking privacy, admin controls, the help-request lifecycle and the live event stream.

---

## 3. Quick Start Instructions (VS Code / Local)

```bash
# 1. Unzip the project and open the folder in VS Code
cd CampusFoodShare

# 2. Install dependencies
npm install

# 3. (Optional) Re-seed dummy campus data
npm run seed

# 4. Start the Express + Frontend server
npm start
```

Open **`http://localhost:3000`** for the public website and **`http://localhost:3000/app/`** for the platform.

---

## 4. Deploying on Render
1. Push this repository to GitHub.
2. In Render, click **New + → Blueprint** (or **Web Service**).
3. Connect the repository; Render automatically reads `render.yaml` (`Build Command: npm install`, `Start Command: npm start`).
