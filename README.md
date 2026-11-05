# FindMySpecialist

A responsive, full-stack capstone demonstration for exploring rule-based specialty suggestions and synthetic provider listings. The interface uses HTML, CSS, and vanilla JavaScript; the backend uses Node.js, Express, class-based controllers/services/models/repositories, SQLite, and bcrypt password hashing.

## Requirements

- Node.js 18 or newer
- npm

## Run locally

```sh
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). The app creates `storage/findmyspecialist.sqlite` on first run. For local configuration, copy `.env.example` to `.env` and set a private `SESSION_SECRET` if desired; the default is intended only for local development.

Run the automated service and API tests with:

```sh
npm test
```

For development with automatic restarts, use `npm run dev`.

## Capstone features

1. **Login or Guest Access:** Register and log in with an email and password, or start a guest session. Passwords are bcrypt-hashed. Registered accounts and their validated search preferences persist in SQLite. Guest intake is temporary and is cleared on logout or when the session is no longer active.
2. **Select Symptoms:** Search the approved symptom list and select one to three symptoms. Urgent symptoms such as Chest Pain stop routine matching and display emergency guidance.
3. **Match Specialty:** Predefined rules match Skin Rash and Acne to Dermatology, Knee Pain to Orthopedics, and Frequent Headaches to Neurology. Results are alphabetized. This is not AI diagnosis or medical advice.
4. **Find Specialists:** Filter synthetic providers by specialty, five-digit ZIP, approved demo insurance provider/plan, and maximum distance. Results are alphabetized by provider last name.
5. **View Details:** See available provider, specialty, clinic, and location information. An external booking link is shown only when the provider data includes an accepted HTTPS URL; otherwise the page states that online booking is unavailable.

## Project structure

- `server.js` — loads optional `.env` configuration and starts Express
- `src/Application.js` — Express setup and API routes
- `src/controllers/` — class-based request handlers
- `src/services/` — class-based authentication, symptom, matching, filtering, and booking rules
- `src/repositories/` — SQLite account and demo-provider data access
- `src/models/` — class-based data models
- `src/data/` — approved symptoms, specialty rules, insurance catalog, and synthetic providers
- `public/` — complete HTML pages, responsive CSS, and vanilla JavaScript
- `tests/` — service/business-rule and API journey tests
- `storage/` — generated local SQLite database (not included in source control)

## Demo limits and safety

- This educational demonstration is **not for medical diagnosis, emergency triage, or clinical use**. For emergencies, call 911 or seek immediate medical care.
- Providers, clinics, distances, and insurance acceptance are synthetic. Search data is available only for the demo ZIP code `55106`; distances are predefined, not calculated from a real address.
- Insurance information is not verified in real time. There is no live provider lookup, real booking, or internal appointment scheduling.
- No provider in the supplied demo dataset has a booking URL, so appointment booking is unavailable.
- Express's default in-memory session store is suitable only for local demonstration. Configure a production session store, HTTPS, and production security controls before deployment. Do not enter real passwords or sensitive health information.
