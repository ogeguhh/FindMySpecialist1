
# FindMySpecialist

**A clearer path to specialist care**

FindMySpecialist is an ICS 499 capstone project developed by **Team Code Club** (Amen W, Brian O, and Ismail O). The web application helps visitors select symptoms, identify relevant medical specialties using predefined rules, and discover nearby healthcare providers. It provides provider contact details and links to external provider pages when those links have been verified.

> **Educational prototype:** FindMySpecialist does not diagnose medical conditions, access real patient records, confirm insurance benefits or appointment availability, or schedule appointments internally. For urgent or emergency symptoms, seek appropriate medical care rather than relying on this tool.

## Project Overview

The original concept involved scheduling appointments within FindMySpecialist. The project scope was revised to **specialist discovery and external booking/profile links** because direct integration with healthcare scheduling systems would require additional partnerships, infrastructure, and security work.

The application supports registered users and temporary guest access. A visitor can enter healthcare needs and a location, receive rule-based specialty suggestions, search provider directory information, and follow an available verified external link.

## Main Features

- **Login or Guest Access:** Register, sign in, or continue without creating an account.
- **Healthcare Intake:** Enter city, state, ZIP code, supported symptoms, optional insurer/plan, and search radius.
- **Symptom Selection:** Select one to three symptoms from the supported catalog.
- **Specialty Matching:** Use predefined rules to suggest specialties, without claiming to provide a diagnosis.
- **Provider Discovery:** Query the public NPPES NPI Registry for provider directory records.
- **Distance Filtering:** Use location/geocoding data and approximate straight-line mileage.
- **Insurance Filtering:** Apply locally curated insurance and plan matching information.
- **Provider Details:** Show available provider names, specialties, addresses, and contact information.
- **External Links:** Distinguish verified booking/profile links from unavailable or unverified links.
- **Saved Preferences:** Support preferences for signed-in users; guest information is intended to remain temporary.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express |
| Provider Directory | NPPES NPI Registry API |
| Geocoding | ArcGIS geocoding and ZIP coordinate data |
| Matching | Rule-based specialty mapping |
| Reference Data | JSON catalogs for symptoms, specialties, ZIP coordinates, insurance, and booking links |
| Authentication | Session-based access with hashed passwords |
| Hosting Target | Vercel |

## Data Sources and Limitations

### NPPES Provider Registry

FindMySpecialist retrieves provider directory information from the public NPPES API.

NPPES can provide:

- Provider names
- Medical specialties
- Practice addresses
- Available phone numbers
- Provider directory information

However, NPPES does not guarantee that a provider is currently licensed, accepts a specific insurance plan, is accepting new patients, or has appointments available.

### Insurance Information

Insurance records are curated separately.

If a provider is absent from the matching insurance data, that means coverage has **not been verified**, not necessarily that the provider rejects the insurance.

Users should confirm insurance acceptance directly with the healthcare provider and insurance company.

### Distance Calculation

FindMySpecialist uses location and ZIP coordinate information to calculate approximate distances between the user's location and healthcare providers.

Distances represent **straight-line miles**, not driving distances.

### Booking Links

Booking and provider-profile links are maintained separately from NPPES.

Verified external links may direct users to a provider's website. Opening an external link does not mean an appointment has been scheduled or confirmed.

## How FindMySpecialist Works

1. Open FindMySpecialist and choose **Log In** or **Continue as Guest**.
2. Enter location, symptoms, and optional insurance information.
3. Review the suggested medical specialty or specialties.
4. Search for providers using the selected location and radius.
5. Review provider details and the verification status of external links.
6. Visit the provider's website or contact the clinic to confirm insurance and appointment options.

## Project Architecture

FindMySpecialist follows a modular architecture using controllers, services, and repositories.

### Controllers

Controllers receive HTTP requests, validate inputs, and return responses.

Examples include:

- `AuthController.js`
- `IntakeController.js`
- `MatchController.js`
- `ProviderController.js`

### Services

Services contain the application's business logic.

- **SpecialistService.js:** Coordinates provider searches and filtering.
- **MatchingService.js:** Applies predefined symptom-to-specialty rules.
- **DistanceService.js:** Supports geocoding and distance calculations.
- **BookingLinkService.js:** Handles external booking/profile link selection and validation.
- **AuthService.js:** Handles registration, authentication, and user preferences.

### Repositories

Repositories manage access to provider and user information.

- **NppesProviderRepository.js:** Retrieves provider information from NPPES.
- **ProviderRepository.js:** Provides access to locally configured demonstration provider records.
- **UserRepository.js:** Manages registered account information.

### JSON Reference Files

The application uses JSON files for reference information, including:

- `zipCoordinates.json`
- `clinicInsurance.json`
- `clinicBookingLinks.json`
- `specialtyRules.json`
- `insuranceCatalog.json`

These files support specialty matching, location searches, insurance filtering, and external link management.

## Installation and Local Setup

### Requirements

- Node.js
- npm
- Internet connection for NPPES and ArcGIS requests

### 1. Clone the Repository

```bash
git clone https://github.com/ogeguhh/FindMySpecialist1.git
```

### 2. Navigate to the Project

```bash
cd FindMySpecialist1
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Application

```bash
npm start
```

Open the localhost URL displayed in your terminal, commonly:

`http://localhost:3000`

### 5. Development Mode

If supported by your branch:

```bash
npm run dev
```

### 6. Run Tests

If the test script is available:

```bash
npm test
```

**Configuration:** Environment variables and persistent storage requirements depend on the branch being deployed. Do not commit session secrets, database credentials, `.env` files, or real user information.

## Deployment to Vercel

Vercel is the intended deployment platform for FindMySpecialist.

Before production deployment:

1. Configure a Vercel-compatible Express entry point.
2. Configure production environment variables.
3. Set a strong session secret.
4. Use persistent storage for registered accounts.
5. Configure a persistent session store instead of the default in-memory store.
6. Verify that frontend pages and backend API routes work.
7. Test NPPES and ArcGIS requests from the deployed environment.
8. Verify login, guest access, provider searches, and booking links.

**Deployment Status:** A successful production deployment has not yet been verified in this README.

## Project Scope

### Included

- User login and guest access
- Healthcare intake and validation
- Symptom selection
- Rule-based specialty matching
- Provider search
- Location and distance filtering
- Insurance matching using available records
- Provider details
- External booking/profile redirects
- Clear handling of missing or unverified information

### Not Included

- Medical diagnosis or treatment recommendations
- Access to production patient records
- Direct appointment scheduling
- Appointment confirmation
- Guaranteed insurance eligibility
- Live appointment availability

## Future Improvements

Potential future enhancements include:

- Expanding verified insurance information
- Increasing verified booking-link coverage
- Improving external API error handling
- Expanding automated testing
- Improving accessibility
- Completing production-ready persistent account and session storage
- Verifying provider information against authoritative licensing and clinic sources

## Team Members

**Team Name:** Code Club

**Members:**
- Amen W
- Brian O
- Ismail O

**Course:** ICS 499 — Software Engineering Capstone

## GitHub Repository

https://github.com/ogeguhh/FindMySpecialist1

## Disclaimer

FindMySpecialist is an educational capstone prototype.

Provider information may be incomplete or outdated. Users should independently verify provider credentials, insurance acceptance, clinic contact information, and appointment availability directly with the healthcare organization.

FindMySpecialist does not provide medical diagnoses or guarantee appointments.

