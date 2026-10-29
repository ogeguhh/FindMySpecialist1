const symptomsText = document.getElementById("selected-symptoms");
const resultBox = document.getElementById("match-result");
const findButton = document.getElementById("find-specialists-btn");
const retryButton = document.getElementById("retry-btn");

let savedSymptoms = [];
let savedIntake = null;

try {
    savedSymptoms = JSON.parse(
        sessionStorage.getItem("selectedSymptoms") || "[]"
    );
    savedIntake = JSON.parse(
        sessionStorage.getItem("intakeForMatching") || "null"
    );
} catch {
    savedSymptoms = [];
    savedIntake = null;
}

if (!Array.isArray(savedSymptoms)) {
    savedSymptoms = [];
}

async function displayMatch() {
    findButton.hidden = true;
    retryButton.hidden = true;
    resultBox.classList.remove("urgent-warning");
    sessionStorage.removeItem("matchedSpecialties");
    sessionStorage.removeItem("matchingResult");

    if (savedSymptoms.length === 0) {
        symptomsText.textContent = "No healthcare concerns selected.";
        resultBox.textContent = "Please complete the intake first.";
        return;
    }

    symptomsText.textContent = savedSymptoms.join(", ");
    resultBox.textContent = "Checking for a specialty suggestion...";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const intake = savedIntake || { selectedSymptoms: savedSymptoms };
        const response = await fetch("/api/match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(intake),
            signal: controller.signal
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Matching request failed.");
        }

        if (data.status === "urgent") {
            resultBox.textContent = data.message;
            resultBox.classList.add("urgent-warning");
            sessionStorage.removeItem("intakeForMatching");
            return;
        }

        if (data.status === "no_match") {
            resultBox.textContent = data.message;
            sessionStorage.removeItem("intakeForMatching");
            return;
        }

        if (data.status !== "matched" ||
            !Array.isArray(data.specialties) ||
            !Array.isArray(data.matches) ||
            data.matches.length === 0) {
            throw new Error("Invalid matching response.");
        }

        resultBox.textContent = data.matches.map((match) =>
            `${match.specialty}: ${match.reason} ` +
            `Selected concern${match.matchedSymptoms.length > 1 ? "s" : ""}: ` +
            `${match.matchedSymptoms.join(", ")}.`
        ).join(" ");

        sessionStorage.setItem(
            "matchedSpecialties",
            JSON.stringify(data.specialties)
        );
        sessionStorage.setItem("matchingResult", JSON.stringify(data));
        findButton.hidden = false;
    } catch (error) {
        resultBox.textContent = error.name === "AbortError"
            ? "The matching request took too long. Please try again."
            : "We couldn't complete the matching request. Please try again.";
        retryButton.hidden = false;
        console.error("Specialty matching error:", error.message);
    } finally {
        clearTimeout(timeoutId);
    }
}

retryButton.addEventListener("click", displayMatch);
displayMatch();
