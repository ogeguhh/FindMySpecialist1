
// SPECIALTY MATCH RESULTS
// Sends selected symptoms to our backend and displays the result.

// Find the HTML elements we need to update.
const symptomsText = document.getElementById("selected-symptoms");
const resultBox = document.getElementById("match-result");
const findButton = document.getElementById("find-specialists-btn");

// sessionStorage.getItem() reads information saved earlier.
// JSON.parse() converts stored JSON text back into an array.
const savedSymptoms = JSON.parse(
    sessionStorage.getItem("selectedSymptoms") || "[]"
);

// async allows a function to wait for an asynchronous operation.
// This is useful when requesting data from our backend.
async function displayMatch() {

    // Check whether the visitor arrived without selecting symptoms.
    if (!Array.isArray(savedSymptoms) || savedSymptoms.length === 0) {
        symptomsText.textContent = "No symptoms selected.";
        resultBox.textContent = "Please select your symptoms first.";
        return;
    }

    // join() combines array values into readable text.
    symptomsText.textContent = savedSymptoms.join(", ");

    try {
        // fetch() sends a request to our Express backend.
        // await waits until the request finishes.
        const response = await fetch("/api/match", {

            // POST sends data to the server.
            method: "POST",

            // Tells the server we are sending JSON.
            headers: {
                "Content-Type": "application/json"
            },

            // Converts the selected symptoms into JSON text.
            body: JSON.stringify({
                selectedSymptoms: savedSymptoms
            })
        });

        // Read the JSON returned by our backend.
        const data = await response.json();

        // response.ok is false for HTTP errors such as 400 or 500.
        if (!response.ok) {
            throw new Error(data.message || "Matching request failed.");
        }

        // Display the message if no matching rule exists.
        if (data.status === "no_match") {
            resultBox.textContent = data.message;
            return;
        }

        // Show approved matching specialties when available.
        if (data.status === "matched") {
            resultBox.textContent =
                "Matching specialties: " + data.specialties.join(", ");

            // Save matches for the Find Specialists feature.
            sessionStorage.setItem(
                "matchedSpecialties",
                JSON.stringify(data.specialties)
            );

            // Remove the hidden attribute from the button.
            findButton.hidden = false;
        }

    } catch (error) {

        // Displays a friendly message when the request fails.
        resultBox.textContent =
            "We couldn't complete the matching request. Please try again.";

        // Log technical details for debugging.
        console.error("Specialty matching error:", error);
    }
}

// Run the matching process when this page loads.
displayMatch();
