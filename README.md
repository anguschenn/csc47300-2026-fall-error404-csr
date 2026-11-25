# MetroPulse NYC 🚇
> A real-time transit tracker, community incident board, and commuter safety network for New York City riders.

---

## 📌 Project Overview

Every day, millions of New Yorkers rely on the MTA subway system, yet riders constantly navigate two major pain points: **disconnected transit data** and **commuter safety concerns**. 

While general mapping platforms provide static schedules, they often fail to capture real-time delays, platform-level conditions, or sudden infrastructure failures as they happen. Simultaneously, late-night riders, students, and solo commuters frequently experience safety anxiety when waiting on empty platforms or navigating transit corridors alone.

**MetroPulse NYC** is a civic transit monitor and community safety web application engineered to make urban commuting more predictable, transparent, and secure. 

The platform bridges real-time infrastructure feeds with grassroots rider reports:
* **Live Transit Intelligence:** Ingests official MTA data to give riders direct access to live train arrivals, line disruptions, and station alerts.
* **Crowdsourced Incident Feed:** Functions as a localized "Citizen for Transit," empowering commuters to report and verify real-time platform conditions, hazards, delays, and equipment outages.
* **SafeCommute Coordination:** A community-first hub where verified riders can coordinate travel windows, find others moving along the same lines, and travel together for safer commutes.

By uniting operational transit feeds with community-driven collaboration, MetroPulse transforms passive transit navigation into an active, connected civic network.

---

## 🚀 Core Features

### 1. Live Transit Arrival & Station Monitor
* Ingests real-time MTA GTFS feeds to display live countdown clocks and upcoming train arrival times for stations across the network.
* Highlights active MTA service alerts, planned weekend maintenance, and emergency line reroutes via a real-time status banner.
* Features an interactive transit map allowing users to browse stations, explore lines, and inspect live arrival boards.

### 2. User Accounts & Commute Profiles
* Secure account registration and authentication with email and password.
* Personalized commuter dashboards where users can bookmark frequent stops, save daily travel routes, and configure route-specific alert notifications.
* User profile badging to establish community trust and accountability across interaction boards.

### 3. "SafeCommute" Travel Coordination Hub
* Allows riders to publish upcoming planned trips (departure station, destination corridor, and departure time window) to connect with other commuters traveling along similar paths.
* Commuters can opt into a shared "Commute Group" to sync schedules for walking to stations or riding during late-night hours.
* Dedicated per-trip coordination threads where group members can confirm exact meetup spots (e.g., station turnstiles or specific platform markers).

### 4. Live Station Incident & Hazard Feed
* A community reporting system allowing riders to post immediate updates regarding platform conditions, unexpected delays, broken turnstiles, or safety concerns.
* Structured categorization tags (e.g., *Late Train*, *Station Hazard*, *Elevator Out of Service*, *Safety Alert*) for fast scanning.
* Community verification and upvoting system so fellow riders can vouch for active reports and confirm when an issue has cleared.

---
## Expanded Details on Features
### 1. Live Transit Arrival & Station Monitor
- **Live Countdown Clocks and Arrival Boards** - each station ingests MTA GTFS feeds to display live countdown clocks and upcoming train arrival times (separated by train direction to reduce clutter)
  - refreshes on short polling interval to stay in sync with actual train positions rather than static schedule
  - each entry shows a line bullet/color, destination, and estimated minutes-to-arrival, with a visual indicator (ex: pulsing dot) for trains currently "in the station" vs still en route
- **Real-Time Service Alert Banner** - persistent banner ingests MTA’s GTFS-Realtime alerts and surfaces anything relevant to the station or line currently being viewed
  - categorized with distinct visual severity levels (planned maintenance, service change, delay, emergency reroute, etc.)
  - alerts scoped contextually: rider at station A only see alerts affecting lines that actually stop there rather than system-wide
- **Interactive Transit Map** - browsable map that lets users explore the network geographically rather than by station search alone
  - Lines rendered also reflect live alert status
  - Users can pan and zoom across lines to explore across a station's full arrival board
- **Data Refresh and Fallback Handling** - shows a "last updated X seconds ago" timestamp or falling back to scheduled times with a clear "estimated, not live" label
  - UI never silently presents dead data as

### 2. User Accounts & Commute Profiles
- **Secure Registration & Authentication:**
  - Supports email and password signup.
- **Personalized Commuter Dashboard**
  - Bookmarked MTA Stations
  - Saved Routes
  - Route Notifications
- **Route-Specific Alert Subscriptions**
  - Only receive notifications for the MTA routes the user subscribes to.
- **Profile Badging & Community Trust**
  - Users accumulate good credit based on how other users rated traveling with them
  - The shared travel feature is oriented towards women traveling with women. 
- **Data Ownership & Privacy**
  - Users can delete saved routes
  - Users can edit saved routes
  - Users can control Profile Visibility 

### 3. "SafeCommute" Travel Coordination Hub
- SafeCommute is a peer-coordination feature that helps commuters feel safer and more connected during transit. Most transit safety risk is concentrated in a few predictable moments, such as walking from a station to home, waiting alone on a platform late at night, or riding a mostly empty car. SafeCommute targets exactly those higher-risk travel windows by making it easy to either find and team up with a compatible commuter or have a trusted contact passively track the trip. Rather than functioning as a ride-share or dating-adjacent "meet strangers" app, SafeCommute is built around the safety-first use case of helping people who are already traveling a similar route at the same time find each other, so they can walk together, wait together, or simply know someone nearby is aware of their trip. For example, people in the same apartment building can coordinate a trip back together to create a safe, social environment that improves their commuting experience. Also, by transitioning relationships from strangers to acquaintances, people will be more willing to act as a good Samaritan rather than a bystander. 
- Two smaller mechanisms drive this SafeCommute Travel Coordination Hub
  - **Trip Publishing:** a way to broadcast "I'm heading this way, around this time." 
  - **Commute Groups:** a more persistent, opt-in circle (coworkers, neighbors, classmates, friends) who regularly sync on shared legs of a commute.
- **Trip Publishing & Matching**
  - Trip creation: Rider specifies departure station, destination corridor (not necessarily exact address, corridor/neighborhood level for privacy), and a departure time window (e.g., "10:15–10:30 PM").
  - Route corridor matching: System matches riders whose stated paths overlap for a meaningful segment (e.g., same line, same set of stops), not just identical start/end points.
  - Time window overlap: Matching accounts for flexible windows so riders don't need exact synchronization, e.g., "leaving between 10 and 10:30" matches others in that range.
  - Trip visibility controls: Riders choose whether their published trip is visible to: everyone nearby, verified users only, or their existing Commute Group only.
  - One-tap "I'll wait for you" / "Let's ride together" response: Matched riders can signal intent to pair up without a lengthy chat exchange. 
  - In-app lightweight chat: Minimal messaging scoped only to trip coordination (e.g., "meet at the north entrance"), with no persistent DM history beyond the trip.
  - Auto-expiring posts: Published trips disappear automatically after the time window passes, so there's no stale data or lingering visibility.
- **Commute Groups**
  - Group creation & invites: Users form recurring groups (e.g., "Night Shift Crew," "Campus Commuters") via an invite link, ideal for coworkers, classmates, or neighbors with overlapping schedules.
  - Recurring schedule sync: Members can set standing commute patterns (e.g., "M–F, 6:45 AM from Elm St. Station") so the group can see at a glance who's likely traveling when.
  - Live "on my way" status: Group members can broadcast real-time status (walking to station, on train, arrived) visible only within the group.
  - Group-only trip visibility: Trips can be restricted to the group rather than the general public, for users who prefer coordinating only with known contacts.
  - Passive tracking/check-in: A member can share live location with the group (or a designated few) for the duration of a trip without requiring anyone to actively "join" the commute.
- **Safety & Trust Layer**
  - Identity verification tiers: Optional verification (phone number, ID, employer/school email) with visible trust badges, since riders may want to filter matches by verification level.
  - Ratings/feedback after shared trips: Lightweight post-trip confirmation ("Did you make it safely?" / thumbs-up on the co-commuter) to build a reputation signal over time without turning into a full social rating system.
  - Panic/alert button: Quick-access alert during an active shared or tracked trip that notifies the paired commuter, group, or emergency contact.
  - Block & report tools: Standard safety tooling to block a user or report a bad interaction, feeding into account-level trust scoring.
  - Geofenced safe zones: Stations, well-lit meeting points, or "safe waiting spots" can be flagged on the map as recommended meeting locations.
- **Notifications & Logistics**
  - Smart alerts: Push notifications when a compatible trip is published nearby, when a group member starts a commute, or when a matched partner is running late.
  - ETA sharing: Live ETA updates shared with matched riders or group members, similar to ride-share tracking.
  - Trusted contact auto-share: Option to auto-forward trip details (route, time, matched companion if any) to a designated trusted contact outside the app, no separate action required each trip.
  - Delay/disruption sync: If transit delays affect the route, matched riders/group members are notified together so plans can adjust in real time.

### 4. Live Station Incident & Hazard Feed
**Overview:** A crowdsourced transit monitoring system that enables verified commuters to report, filter, and track hyper-local platform conditions, accessibility outages, and route disruptions in real time.
**Core Functionality:**
- **Contextual Scoping & Structured Tagging:** When creating a report, users must select a preset category tag along with a custom title and descriptive note:
  - Station-Level Tags (e.g., Elevator/Escalator Outage, Broken Turnstile, Platform Hazard): Mapped directly to a specific station ID and surfaced exclusively on that station and routes arriving/departing from that station.
  - Line-Level Tags (e.g., Unscheduled Delay, Severe Overcrowding): Mapped to a subway line and travel direction (e.g., Uptown vs. Downtown) and broadcast across all stations along that corridor.
- **Community Verification & Flat Update Threads:**
  - Commuters can upvote or downvote reports to validate accuracy; reaching a net-negative threshold (e.g., -5) automatically flags and hides false reports or spam.
  - A dedicated "All Clear / Resolved" community button allows riders to signal that an issue has cleared ahead of schedule. Enough users agreeing will see the comment soft-archived.
  - Each report features a flat chronological comment thread, allowing riders to post brief real-time updates (e.g., "MTA crew arrived," "Train moving again") without branching comment trees.
- **Search, Sorting & Feed Discovery:**
  - Users can filter incident feeds by category tags (e.g., Accessibility Only vs. Delays).
  - Active feeds support switching between Most Recent and Most Helpful (ranked by net score).
- **Three-Stage Data Lifecycle & Archiving:**
  - Active (0–90 minutes): Prominently displayed as comments that are still viable/useful. (Some specific tags like elevator outages will have an extended active window as would take longer to resolve).
  - Soft-Archived (90 minutes to 24 hours): Flagged as inactive and tucked into a collapsed "View Past / Resolved Reports" drawer so riders can inspect recent comments without cluttering the active board.
  - Hard Purged (24+ hours): Automatically cleared from the active database to maintain database performance and eliminate obsolete data.


## 🛠️ Architecture & Tech Stack

This project is built as a decoupled **Single Page Application (SPA)** with **Client-Side Rendering (CSR)**, splitting UI presentation from backend service logic:

* **Client-Side Frontend:**
  * **Framework:** React.js + TypeScript (via Vite)
  * **Deployment/Hosting:** Vercel

* **Backend REST API:**
  * **Framework:** Python (FastAPI)
  * **Deployment/Hosting:** Render

* **Database & Storage:**
  * **Database:** Cloud PostgreSQL (managed via Supabase)

---

## 💻 Local Development Setup

Follow these steps to run both the frontend and backend locally on your machine.

### Prerequisites
* **Node.js** (v18+ recommended) & `npm`
* **Python** (v3.10+ recommended)
* **Git**

---

### 1. Backend Setup (FastAPI)

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   * **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * **Windows (CMD):**
     ```cmd
     python -m venv venv
     .\venv\Scripts\activate.bat
     ```
   * **macOS / Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your local `.env` file from the example:
   * **Windows:**
     ```powershell
     copy .env.example .env
     ```
   * **macOS / Linux:**
     ```bash
     cp .env.example .env
     ```
   *(Update `DATABASE_URL` with the team's Supabase credentials if database access is needed)*

5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend API will be available at [http://localhost:8000](http://localhost:8000). Interactive Swagger API docs are at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### 2. Frontend Setup (React + Vite)

1. Open a **second terminal** and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your local `.env.local` file from the example:
   * **Windows:**
     ```powershell
     copy .env.example .env.local
     ```
   * **macOS / Linux:**
     ```bash
     cp .env.example .env.local
     ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend app will be running at [http://localhost:5173](http://localhost:5173).
