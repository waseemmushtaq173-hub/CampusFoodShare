# CampusFoodShare: A Web Platform to Reduce Food Waste by Connecting Surplus Food Donors with NGOs

**Department of Computer Science and Engineering**  
**Domain:** Web Development (Full-Stack) | Social Impact (SDG 2, 11 and 12)  
**Team Members:**  
- **Waseem Mushtaq Mir** (`1BG25CS184`)  
- **Harsha S** (`11BN26CS401`)  
**Project Guide:** AT Sangeeta, Assistant Professor  

---

## Project structure: frontend, application logic and backend

The project has three layers. The **Backend console** (`/system.html`) shows all three working live, so it can be demonstrated in front of an examiner.

| Layer | What it is | Where |
|---|---|---|
| **1. Frontend** | What people see: the public website (`/`), the platform web app (`/app/`) and the backend console (`/system.html`). Plain HTML, CSS and JavaScript, no build step. | `frontend/` |
| **2. Application logic (backend)** | Node.js + Express REST API. Holds the rules: the **matching engine**, ranking (Haversine distance + min-heap), roles and permissions, PIN handover, validation, spam protection, live updates. | `backend/server.js`, `backend/src/` |
| **3. Data** | A JSON-file database (collections: users, organizations, listings, requests, messages). Created and seeded on first run. | `backend/data/db.json` |

```
CampusFoodShare/
├── frontend/
│   ├── index.html, site.css, site.js     Public website: donate with NO account, "where can I donate this?", ashram directory, tracker, FAQ, contact
│   ├── system.html                       Backend console: architecture, live database counts, matching tester, API list, live request log
│   └── app/                              Platform web app: donor / NGO / volunteer / admin dashboards, live map, GPS, claim, PIN, requirements
├── backend/
│   ├── server.js                         REST API (about 47 endpoints) and static hosting of the frontend
│   ├── src/utils/matcher.js              Matching engine
│   ├── src/models, src/storage, src/utils, src/seed
│   ├── data/db.json                      Database file
│   └── test/api.test.js                  31 automated API tests (npm test)
└── package.json, render.yaml, .env.example
```

### "I have 50 kg of food. Where can I donate it?"
Organisations (ashrams, old-age homes, orphanages, shelters, community kitchens, hostels) keep their **requirements** up to date: how much food they need today, daily capacity, which food they accept (Veg / Non-Veg / Vegan / Bakery), opening hours, whether they can send a volunteer, and where they are. NGO users edit this on the **Our Requirements** page.

When a donor enters an amount and a food type, `GET /api/match` ranks every organisation:

`score = 40% how much of the food it can take + 25% closeness (Haversine) + 20% how much it still needs today + 15% open now`

Organisations that do not accept that food (for example a vegetarian-only ashram for non-veg food) are excluded with the reason shown. If no single place can take everything, the engine suggests a **split** (for example "97 kg to A, 172 kg to B"). A donor can then **direct** the donation to a chosen ashram: it is reserved for that organisation for 30 minutes, after which any NGO can claim it. Capacity is reduced as food is claimed or directed during the day, so the numbers stay honest.

### What a brand-new visitor can do (no account, no prior knowledge)
1. Open the website, read **"What would you like to do?"** (donate / need food / NGO or volunteer) and the FAQ.
2. **Donate food without signing up:** fill the short form. The backend creates a real listing for nearby NGOs and volunteers and returns a private tracking link.
3. **Track the donation:** see when an NGO claims it, who is coming, and the 4-digit handover PIN to give the volunteer. Withdraw it any time before it is claimed.
4. **Need food?** Find free food nearby with directions, or ask for help and call a helpline.
5. **Contact the team:** messages go to the admin's inbox in the platform.

### Main API endpoints
| Area | Endpoints |
|---|---|
| Public (no login) | `GET /api/match`, `GET /api/organizations`, `GET /api/system/status`, `GET /api/system/logs`, `GET /api/listings`, `GET /api/impact`, `GET /api/directory`, `POST /api/public/donations`, `GET /api/public/donations/:id?token=`, `POST /api/public/donations/:id/withdraw`, `POST /api/public/contact`, `POST /api/requests`, `GET /api/requests/:id` |
| Auth | `POST /api/auth/signup`, `signin`, `signout`, `forgot`, `reset`, `password`, `GET /api/auth/me` |
| Donor / NGO / Volunteer | `GET/PUT /api/organization` (NGO requirements), `POST /api/listings`, `/:id/claim`, `/:id/release`, `/:id/collect`, `/:id/feedback`, `GET /api/dashboard`, `/api/locations`, `POST /api/location` |
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
