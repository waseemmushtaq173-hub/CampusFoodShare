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

6. **Roles & Security (extension):** Donor / NGO / Volunteer / Admin accounts with scrypt-hashed passwords, token sessions, and server-enforced role permissions (donors post & withdraw, NGOs/volunteers claim, release, collect & rate, admins manage everything).
7. **Insights (extension):** 7-day posted-vs-rescued chart, rescued-by-diet donut, rescue rate, donor & NGO leaderboards, live expiry countdowns, one-tap Google Maps directions, and an admin user console.

8. **Role dashboards (extension):** Every role gets its own sidebar menu and dashboard (guest, donor, NGO, volunteer, admin), a colourful light/dark theme, a Ctrl+K command palette and a notification drawer.
9. **Live GPS & real-time feed (extension):** `watchPosition` tracking re-ranks distances as you move, and server-sent events (`/api/stream`) refresh every open browser the moment a listing is posted, claimed, collected or expires.
10. **Handover PIN (extension):** Claiming generates a 4-digit PIN that the donor shares; collection is only accepted with the right PIN.

**Demo logins:** `admin@campusfoodshare.org / admin123`, `donor@campusfoodshare.org / donor123`, `ngo@campusfoodshare.org / ngo123`, `volunteer@campusfoodshare.org / vol123` (set `DB_FILE_PATH` to use a different data file).

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
