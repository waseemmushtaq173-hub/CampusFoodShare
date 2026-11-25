# CampusFoodShare: A Web Platform to Reduce Food Waste by Connecting Surplus Food Donors with NGOs

**Department of Computer Science and Engineering**  
**Domain:** Web Development (Full-Stack) | Social Impact (SDG 2, 11 and 12)  
**Team Members:**  
- **Waseem Mushtaq Mir** (`1BG25CS184`)  
- **Harsha S** (`11BN26CS401`)  
**Project Guide:** AT Sangeeta, Assistant Professor  

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
Recurring surplus schedules, route planner, SMS / WhatsApp alerts, reports and certificates, photo-based freshness analysis, password reset, multi-campus network.

### Demo data
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

Open **`http://localhost:3000`** in your browser.

---

## 4. Deploying on Render
1. Push this repository to GitHub.
2. In Render, click **New + → Blueprint** (or **Web Service**).
3. Connect the repository; Render automatically reads `render.yaml` (`Build Command: npm install`, `Start Command: npm start`).
