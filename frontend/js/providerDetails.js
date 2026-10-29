
// FEATURE 5: VIEW MEDICAL OFFICE DETAILS
// Loads the selected office from our backend API.
// We no longer store a separate office list in the frontend.

// getElementById() finds an HTML element by its ID.
const detailsMessage = document.getElementById("details-message");
const officeDetails = document.getElementById("office-details");
const officeName = document.getElementById("office-name");
const officeSpecialty = document.getElementById("office-specialty");
const officeLocation = document.getElementById("office-location");
const officeDescription = document.getElementById("office-description");
const officeLanguages = document.getElementById("office-languages");
const officeTelehealth = document.getElementById("office-telehealth");
const officeDataStatus = document.getElementById("office-data-status");
const externalLinkContainer = document.getElementById(
    "office-external-link"
);

// URLSearchParams reads information after the ? in a URL.
// Example: provider-details.html?id=1
const urlParams = new URLSearchParams(window.location.search);

// get() reads the value associated with the id parameter.
const officeId = urlParams.get("id");

// async allows a function to wait for a server response.
async function displayOfficeDetails() {

    // Hide old details and clear old links.
    officeDetails.hidden = true;
    externalLinkContainer.hidden = true;
    externalLinkContainer.replaceChildren();

    // Number() converts text into a number.
    const numericId = Number(officeId);

    // Number.isInteger() checks whether a number is a whole number.
    // || means OR; any invalid condition stops the request.
    if (
        officeId === null ||
        !Number.isInteger(numericId) ||
        numericId <= 0
    ) {
        detailsMessage.textContent =
            "Invalid office ID. Please return to the office search.";
        return;
    }

    // Show a message while the request is running.
    detailsMessage.textContent = "Loading office details...";

    try {

        // fetch() requests the office from our backend.
        // encodeURIComponent() safely formats the ID for a URL.
        // await waits for the response.
        const response = await fetch(
            "/api/specialists/" + encodeURIComponent(officeId)
        );

        // json() converts the response into a JavaScript object.
        const data = await response.json();

        // response.ok checks whether the HTTP request succeeded.
        if (!response.ok) {

            // HTTP 404 means the requested office does not exist.
            if (response.status === 404) {
                detailsMessage.textContent =
                    "Medical office not found. Please try another office.";
                return;
            }

            // throw sends other errors to the catch block.
            throw new Error(data.message || "Unable to load office.");
        }

        // Check that the backend returned a valid office object.
        if (data.status !== "success" || !data.office) {
            throw new Error("Unexpected office details response.");
        }

        // Store the returned office in a variable.
        const office = data.office;

        // textContent safely displays text without interpreting HTML.
        officeName.textContent = office.name;
        officeSpecialty.textContent =
            "Medical Specialty: " + office.specialty;
        officeLocation.textContent =
            "Location: " + office.city + ", " + office.state;
        officeDescription.textContent =
            "About This Office: " + office.description;
        officeLanguages.textContent =
            "Languages listed in mock data: " +
            (Array.isArray(office.languages)
                ? office.languages.join(", ")
                : "Not listed");
        officeTelehealth.textContent =
            "Telehealth: " + (office.telehealth
                ? "listed in mock data; confirm with the clinic"
                : "not listed in mock data");
        officeDataStatus.textContent =
            "Mock provider listing. Details, insurance, and availability " +
            "have not been verified.";

        if (office.websiteVerified && office.website) {

            try {
                const websiteUrl = new URL(office.website);

                if (websiteUrl.protocol === "https:" &&
                    !websiteUrl.username &&
                    !websiteUrl.password) {

                    // createElement() creates an HTML element.
                    const websiteLink = document.createElement("a");

                    websiteLink.href = websiteUrl.href;
                    websiteLink.textContent = "Visit Provider Website";
                    websiteLink.className = "btn";

                    // Open the website in a separate browser tab.
                    websiteLink.target = "_blank";

                    // Protect the original page when opening a new tab.
                    websiteLink.rel = "noopener noreferrer";

                    // append() adds the link to the webpage.
                    externalLinkContainer.append(websiteLink);
                    externalLinkContainer.hidden = false;
                }

            } catch {
                officeDataStatus.textContent +=
                    " No safe verified website is available.";
            }
        } else {
            officeDataStatus.textContent +=
                " No verified external website is available for this mock clinic.";
        }

        // Clear the loading message and show the office.
        detailsMessage.textContent = "";
        officeDetails.hidden = false;

    } catch (error) {

        // Display a helpful message if the request fails.
        detailsMessage.textContent =
            "We couldn't load this office. Please try again.";

        // Print technical details in the developer console.
        console.error("Office details error:", error);
    }
}

// Run the function when the page loads.
displayOfficeDetails();
