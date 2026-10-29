
// APP.JS: Handles functionality for our homepage

// addEventListener waits for a specific event to happen.
// DOMContentLoaded happens when the browser finishes reading the HTML.
document.addEventListener("DOMContentLoaded", () => {

    // Prints a message in the browser's developer console.
    console.log("FindMySpecialist homepage loaded successfully!");

    // fetch() sends a request to our backend server.
    fetch("/api/health")

        // then() handles the result when the request completes.
        // response.json() converts the JSON response into a JavaScript object.
        .then(response => {
            if (!response.ok) {
                throw new Error("Server returned an error");
            }

            return response.json();
        })

        // data contains the information returned by our backend.
        .then(data => {
            console.log("Backend status:", data.message);
        })

        // catch() handles errors if the request fails.
        .catch(error => {
            console.error("Backend connection failed:", error);
        });

});
