# FindMySpecialist1
A web application that helps users find medical specialists based on symptoms and location.

## Run the app

The Express server serves both the API and the frontend files.

1. Install dependencies:

   ```sh
   npm install
   ```

2. Start the app in development mode (automatically restarts when backend files change):

   ```sh
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

For a regular start without automatic restarts, run `npm start`.

## Matching and provider results

Specialty suggestions use a transparent rule table based on the selected
healthcare concerns. Suggestions are educational and are not diagnoses.
Predefined urgent-warning concerns continue to show emergency guidance instead
of routine provider recommendations.

The provider records are synthetic mock listings. Search applies the entered
age group, preferred language, appointment type, location, and distance limit.
Distance estimates are available only for Minneapolis, Saint Paul,
Bloomington, Maple Grove, and the supported nearby ZIP codes shown in the
matching service. Insurance carrier-name comparisons are against mock data
only; plans and network participation are never verified. Accessibility
features and telehealth availability are also mock data and must be confirmed
with a provider. No provider has a verified website configured, so external
scheduling links remain disabled.

Guest intake is temporarily held in the current browser tab for matching. The
application does not persist or log intake data. This MVP does not yet include
symptom storage or appointment history.

## Optional accounts and saved preferences

Account registration and sign-in use Supabase Auth. Profile routes require a
verified Supabase access token in an HttpOnly, SameSite cookie; the browser
does not receive or persist bearer tokens. Configure `SUPABASE_URL` and
`SUPABASE_ANON_KEY` in the server environment, then apply
[`database/user_preferences.sql`](./database/user_preferences.sql) to the
Supabase project. The table uses row-level security and contains only
consented matching preferences; it has no symptoms or medical-history fields.
Users can edit or delete the saved preferences from the account page.

Without those server environment variables, account endpoints explicitly
report that account services are not configured. No service-role key or
password database is used by this application.
