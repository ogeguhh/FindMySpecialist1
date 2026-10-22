const searchForm = document.getElementById("office-search-form");
const specialtySelect = document.getElementById("specialty-select");
const cityInput = document.getElementById("city-input");
const searchMessage = document.getElementById("search-message");
const officeResults = document.getElementById("office-results");

let matchedSpecialties = [];
let matchingResult = null;
let intakeForMatching = null;

try {
    matchedSpecialties = JSON.parse(
        sessionStorage.getItem("matchedSpecialties") || "[]"
    );
    matchingResult = JSON.parse(
        sessionStorage.getItem("matchingResult") || "null"
    );
    intakeForMatching = JSON.parse(
        sessionStorage.getItem("intakeForMatching") || "null"
    );
} catch {
    matchedSpecialties = [];
}

if (!Array.isArray(matchedSpecialties)) {
    matchedSpecialties = [];
}

if (matchedSpecialties.length > 0) {
    const availableOptions = Array.from(specialtySelect.options);
    const firstSpecialty = matchedSpecialties[0];
    if (availableOptions.some((option) => option.value === firstSpecialty)) {
        specialtySelect.value = firstSpecialty;
    }
}

if (intakeForMatching && typeof intakeForMatching.location === "string") {
    cityInput.value = intakeForMatching.location;
}

function addText(parent, tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) {
        element.className = className;
    }
    parent.append(element);
    return element;
}

function renderProvider(office, match) {
    const card = document.createElement("article");
    card.className = "office-card";
    addText(card, "h3", office.name);
    addText(card, "p", `Specialty: ${office.specialty}`);
    addText(
        card,
        "p",
        `Location: ${office.city}, ${office.state} · approximately ` +
            `${office.distanceMiles < 1
                ? "less than 1"
                : Math.round(office.distanceMiles)} miles`
    );
    addText(card, "p", `Insurance compatibility: ${office.insuranceCompatibility}`);
    addText(card, "p", `Languages listed in mock data: ${office.languages.join(", ")}`);
    addText(
        card,
        "p",
        `Telehealth: ${office.telehealth
            ? "listed in mock data; confirm with the clinic"
            : "not listed in mock data"}`
    );
    addText(
        card,
        "p",
        `Accessibility: ${office.accessibilityCompatibility}`
    );
    addText(
        card,
        "p",
        match
            ? `Why this match: ${match.reason} Selected concern(s): ` +
                `${match.matchedSymptoms.join(", ")}.`
            : "Why this match: This clinic is listed for the selected specialty."
    );
    addText(
        card,
        "p",
        "Mock listing. Provider details, insurance, and availability have not been verified.",
        "provider-mock-notice"
    );

    const detailsLink = document.createElement("a");
    detailsLink.href =
        "/pages/provider-details.html?id=" + encodeURIComponent(office.id);
    detailsLink.textContent = "View Provider Details";
    detailsLink.className = "btn btn-secondary";
    card.append(detailsLink);

    const safeWebsite = verifiedWebsite(office);
    if (safeWebsite) {
        const websiteLink = document.createElement("a");
        websiteLink.href = safeWebsite;
        websiteLink.textContent = "Visit Provider Website";
        websiteLink.className = "btn";
        websiteLink.target = "_blank";
        websiteLink.rel = "noopener noreferrer";
        card.append(websiteLink);
    } else {
        const websiteButton = document.createElement("button");
        websiteButton.type = "button";
        websiteButton.className = "btn";
        websiteButton.textContent = "Visit Provider Website";
        websiteButton.disabled = true;
        const websiteNote = document.createElement("small");
        websiteNote.textContent =
            "No verified external website is available for this mock clinic.";
        card.append(websiteButton, websiteNote);
    }

    officeResults.append(card);
}

function verifiedWebsite(office) {
    if (!office.websiteVerified || typeof office.website !== "string") {
        return null;
    }

    try {
        const url = new URL(office.website);
        return url.protocol === "https:" && !url.username && !url.password
            ? url.href
            : null;
    } catch {
        return null;
    }
}

async function searchOffices() {
    const specialty = specialtySelect.value.trim();
    const location = cityInput.value.trim();
    officeResults.replaceChildren();
    searchMessage.textContent = "";

    if (!specialty) {
        searchMessage.textContent = "Please select a specialty.";
        return;
    }
    if (!intakeForMatching) {
        searchMessage.textContent =
            "Please complete the healthcare intake before searching for providers.";
        return;
    }

    searchMessage.textContent = "Searching for medical offices...";
    const match = matchingResult?.matches?.find(
        (item) => item.specialty === specialty
    );

    try {
        const response = await fetch("/api/specialists/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...intakeForMatching,
                specialties: [specialty],
                location
            })
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Office search failed.");
        }
        if (data.status === "location_unavailable") {
            searchMessage.textContent = data.message;
            return;
        }
        if (data.status !== "success" || !Array.isArray(data.offices)) {
            throw new Error("Unexpected office search response.");
        }
        if (data.offices.length === 0) {
            searchMessage.textContent = data.message;
            return;
        }

        searchMessage.textContent =
            `${data.offices.length} mock provider listing(s). ${data.message}`;
        data.offices.forEach((office) => renderProvider(office, match));
    } catch (error) {
        searchMessage.textContent =
            "We couldn't load medical offices. Please try again.";
        console.error("Office search error:", error.message);
    }
}

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    searchOffices();
});

if (specialtySelect.value) {
    searchOffices();
}
