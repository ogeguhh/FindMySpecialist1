
// FEATURE 4: FIND MEDICAL OFFICES
// Connects our search form to the backend API.
// Displays fictional medical offices matching a specialty and city.

// getElementById() finds an HTML element using its unique ID.
const searchForm = document.getElementById("office-search-form");
const specialtySelect = document.getElementById("specialty-select");
const cityInput = document.getElementById("city-input");
const searchMessage = document.getElementById("search-message");
const officeResults = document.getElementById("office-results");

// sessionStorage stores information for the current browser tab.
// getItem() retrieves data saved by Feature 3.
// JSON.parse() converts stored JSON text back into a JavaScript array.
let matchedSpecialties = [];

try {
    matchedSpecialties = JSON.parse(
        sessionStorage.getItem("matchedSpecialties") || "[]"
    );
} catch (error) {
    // If stored data is invalid, use an empty array instead.
    matchedSpecialties = [];
}

// Array.isArray() checks whether the stored value is an array.
if (!Array.isArray(matchedSpecialties)) {
    matchedSpecialties = [];
}

// If Feature 3 recommended a specialty, select it automatically.
// includes() checks whether the dropdown contains that value.
if (matchedSpecialties.length > 0) {
    const firstSpecialty = matchedSpecialties[0];

    const availableOptions = Array.from(specialtySelect.options);

    if (availableOptions.some((option) =>
        option.value === firstSpecialty
    )) {
        specialtySelect.value = firstSpecialty;
    }
}

// async allows a function to wait for a server response.
async function searchOffices() {

    // trim() removes extra spaces from user input.
    const specialty = specialtySelect.value.trim();
    const city = cityInput.value.trim();

    // Clear previous results before starting another search.
    officeResults.replaceChildren();
    searchMessage.textContent = "";

    // Check that the visitor selected a specialty.
    if (!specialty) {
        searchMessage.textContent = "Please select a specialty.";
        return;
    }

    searchMessage.textContent = "Searching for medical offices...";

    // URLSearchParams safely creates URL query parameters.
    // This handles spaces and special characters automatically.
    const params = new URLSearchParams({
        specialty: specialty,
        city: city
    });

    try {
        // fetch() sends a request to our Express backend.
        // await waits until the server responds.
        const response = await fetch(
            "/api/specialists?" + params.toString()
        );

        // json() converts the server's JSON response into an object.
        const data = await response.json();

        // response.ok is true for successful HTTP responses.
        // throw creates an error that our catch block handles.
        if (!response.ok) {
            throw new Error(data.message || "Office search failed.");
        }

        // Validate the response before using its data.
        if (data.status !== "success" ||
            !Array.isArray(data.offices)) {
            throw new Error("Unexpected office search response.");
        }

        // length gives the number of offices returned.
        if (data.offices.length === 0) {
            searchMessage.textContent =
                "No medical offices found. Try another city or specialty.";
            return;
        }

        searchMessage.textContent =
            data.offices.length + " medical office(s) found.";

        // forEach() runs a function once for every office.
        data.offices.forEach((office) => {

            // createElement() creates new HTML elements using JavaScript.
            const card = document.createElement("article");
            const name = document.createElement("h3");
            const specialtyText = document.createElement("p");
            const locationText = document.createElement("p");
            const descriptionText = document.createElement("p");
            const detailsLink = document.createElement("a");

            // className assigns a CSS class to an element.
            card.className = "office-card";

            // textContent safely inserts text without treating it as HTML.
            name.textContent = office.name;
            specialtyText.textContent =
                "Specialty: " + office.specialty;
            locationText.textContent =
                "Location: " + office.city + ", " + office.state;
            descriptionText.textContent = office.description;

            // Encode the office ID for the Feature 5 details page.
            // encodeURIComponent() makes values safe for a URL.
            detailsLink.href =
                "/pages/provider-details.html?id=" +
                encodeURIComponent(office.id);

            detailsLink.textContent = "View Office Details";
            detailsLink.className = "btn";

            // append() adds elements inside their parent element.
            card.append(
                name,
                specialtyText,
                locationText,
                descriptionText,
                detailsLink
            );

            // Add the completed office card to the results area.
            officeResults.append(card);
        });

    } catch (error) {
        // Handle network errors or unexpected server responses.
        searchMessage.textContent =
            "We couldn't load medical offices. Please try again.";

        // console.error() prints technical details for developers.
        console.error("Office search error:", error);
    }
}

// addEventListener() runs code when a specific event happens.
// "submit" happens when the visitor submits the search form.
searchForm.addEventListener("submit", (event) => {

    // preventDefault() stops the browser from reloading the page.
    event.preventDefault();

    // Run our search function.
    searchOffices();
});

// Automatically search when arriving from a successful Feature 3 match.
if (specialtySelect.value) {
    searchOffices();
}
