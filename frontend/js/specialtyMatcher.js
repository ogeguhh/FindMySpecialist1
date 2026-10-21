
// FEATURE 3: MATCH RESULTS
// Sends selected symptoms to the backend and displays the result.
// Handles normal matches, urgent warnings, errors, and timeouts.

// getElementById() finds HTML elements using their IDs.
const symptomsText = document.getElementById("selected-symptoms");
const resultBox = document.getElementById("match-result");
const findButton = document.getElementById("find-specialists-btn");
const retryButton = document.getElementById("retry-btn");

// let creates a variable whose value can change.
let savedSymptoms;

// try/catch handles errors without crashing the page.
try {

    // sessionStorage stores information within the browser tab.
    // getItem() retrieves saved information.
    // JSON.parse() converts stored JSON text back into an array.
    savedSymptoms = JSON.parse(
        sessionStorage.getItem("selectedSymptoms") || "[]"
    );

} catch (error) {
    savedSymptoms = [];
}

// Array.isArray() checks whether a value is an array.
if (!Array.isArray(savedSymptoms)) {
    savedSymptoms = [];
}

// async allows a function to wait for asynchronous operations.
async function displayMatch() {

    // hidden controls whether an HTML element is visible.
    findButton.hidden = true;
    retryButton.hidden = true;

    // classList.remove() removes a CSS class from an element.
    // This clears warning styling from any previous result.
    resultBox.classList.remove("urgent-warning");

    // Remove matches saved by an earlier request.
    sessionStorage.removeItem("matchedSpecialties");

    // Stop if no symptoms were selected.
    if (savedSymptoms.length === 0) {
        symptomsText.textContent = "No symptoms selected.";
        resultBox.textContent = "Please select your symptoms first.";
        return;
    }

    // join() combines array items into readable text.
    // textContent changes an element's displayed text.
    symptomsText.textContent = savedSymptoms.join(", ");

    resultBox.textContent = "Checking for a specialty match...";

    // AbortController allows us to cancel a network request.
    const controller = new AbortController();

    // setTimeout() runs a function after a delay.
    // 10000 milliseconds equals 10 seconds.
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, 10000);

    try {

        // fetch() sends an HTTP request to the backend.
        // await waits for the operation to finish.
        const response = await fetch("/api/match", {

            // POST sends data to the server.
            method: "POST",

            // Headers describe the format of our request.
            headers: {
                "Content-Type": "application/json"
            },

            // JSON.stringify() converts an object into JSON text.
            body: JSON.stringify({
                selectedSymptoms: savedSymptoms
            }),

            // Connects this request to our timeout controller.
            signal: controller.signal
        });

        // Read the JSON response from Express.
        const data = await response.json();

        // response.ok is false for HTTP errors such as 400 or 500.
        if (!response.ok) {
            throw new Error(
                data.message || "Matching request failed."
            );
        }

        // URGENT WARNING
        // === checks whether two values are exactly equal.
        if (data.status === "urgent") {

            resultBox.textContent = data.message;

            // classList.add() applies a CSS class to an element.
            resultBox.classList.add("urgent-warning");

            // Stop here so routine specialist results aren't shown.
            return;
        }

        // NO MATCH
        if (data.status === "no_match") {
            resultBox.textContent = data.message;
            return;
        }

        // SUCCESSFUL MATCH
        if (data.status === "matched") {

            // Verify that the backend returned specialty names.
            if (!Array.isArray(data.specialties) ||
                data.specialties.length === 0) {

                throw new Error("Invalid matching response.");
            }

            resultBox.textContent =
                "Matching specialties: " +
                data.specialties.join(", ");

            // Save specialties for Feature 4.
            sessionStorage.setItem(
                "matchedSpecialties",
                JSON.stringify(data.specialties)
            );

            // Show the Find Specialists button.
            findButton.hidden = false;
            return;
        }

        // throw creates an error for unexpected responses.
        throw new Error("Unexpected matching response.");

    } catch (error) {

        // AbortError occurs when the timeout cancels the request.
        if (error.name === "AbortError") {
            resultBox.textContent =
                "The matching request took too long. Please try again.";
        } else {
            resultBox.textContent =
                "We couldn't complete the matching request. Please try again.";
        }

        // Allow the visitor to retry after an error.
        retryButton.hidden = false;

        // console.error() prints technical details for debugging.
        console.error("Specialty matching error:", error);

    } finally {

        // finally runs whether the request succeeds or fails.
        // clearTimeout() cancels the scheduled timer.
        clearTimeout(timeoutId);
    }
}

// addEventListener() runs code when an event happens.
// "click" runs when the visitor presses Try Again.
retryButton.addEventListener("click", () => {
    displayMatch();
});

// Run the matching process when the page loads.
displayMatch();
