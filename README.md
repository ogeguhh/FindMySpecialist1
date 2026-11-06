# FindMySpecialist — runnable capstone starter

A demonstration of the five capstone features: **Login or Guest Access**, **Select Symptoms**, **Match Specialty**, **Find Specialists**, and **View Details**.

## Requirements
- Node.js 18 or newer (Node 20/22 recommended)
- npm

## Run locally
1. Extract the ZIP.
2. Open the `FindMySpecialist_Starter` folder in VS Code.
3. Open the terminal in that folder.
4. Run `npm install` (downloads Express, express-session, and bcryptjs).
5. Run `npm start`.
6. Open **http://localhost:3000**.

Run tests with `npm test`. For auto-restart during development, run `npm run dev`.

## Quick demo
- Choose **Continue as Guest**.
- Select `Skin Rash` and `Acne`, then click **Next: Match Specialty** to see `Dermatology`.
- Click **Find Specialists** to load matching providers automatically. Enter a supported Minnesota ZIP such as `55106`, and optionally filter by insurance or maximum distance.
- Demo providers are available in the Twin Cities, Northeast Minnesota, Southeast Minnesota, South Central Minnesota, Central Minnesota, and Northwest Minnesota.
- Alternatively, create an account, log in, and save preferences.

## Backend design
- `server.js`: starts the server
- `src/Application.js`: configures Express and routes
- `src/controllers/`: class-based HTTP controllers
- `src/services/`: class-based validation, matching, authentication, provider filtering, booking URL checks
- `src/models/`: class-based data models
- `src/repositories/`: class-based data access
- `public/`: plain HTML/CSS/JavaScript frontend (not class-based)

## Deployment
Upload/extract the project to a Node.js hosting provider or push it to GitHub. Set **build command** to `npm install`, **start command** to `npm start`, and **SESSION_SECRET** to a long random value. Use the host-assigned `PORT` environment variable. For a real deployment, replace the demo file-based user store and in-memory session store with a persistent database/session store. The current account file (`storage/users.json`) may be lost on ephemeral hosting. HTTPS and production-grade session/security configuration are required before handling real user data.

## Important limitations
- **Not for medical diagnosis, emergency triage, or clinical use.** The warning rules are demonstration-only.
- All providers, distances, insurance acceptance, and clinics are synthetic. ZIP codes are grouped into broad Minnesota demo service areas; ZIP-to-provider mileage is not calculated. Listed distance values are synthetic examples within those areas, not travel estimates from the entered ZIP.
- No real patient data, live insurer verification, live provider lookup, or booking API integration.
- No verified booking URLs are provided; booking buttons are intentionally unavailable.
- This is a **working starter**, not a finished or production-secure capstone. Guest session data is temporary; frontend selections use browser session storage and are cleared when starting a new guest session or logging in.
- `express-session`'s default MemoryStore is for local development only.
- Accounts use bcrypt password hashes and a local JSON file for demo persistence. Do not use real passwords or sensitive health information in this prototype.
