
// FEATURE 2: SELECT SYMPTOMS
// Handles selecting, removing, remembering, and validating symptoms.

// import allows us to use data from another JavaScript file.
import { approvedSymptoms } from "../data/symptoms.js";
import { validateIntake } from "./intakeValidation.mjs";

// A class is a blueprint for creating an object with data and methods.
class SymptomSelection {

    // constructor() runs when a new object is created from this class.
    constructor() {

        // sessionStorage.getItem() reads previously saved browser-tab data.
        // JSON.parse() converts saved JSON text back into a JavaScript array.
        // || "[]" provides an empty array when nothing has been saved.
        let savedSymptoms;

        try {
            savedSymptoms = JSON.parse(
                sessionStorage.getItem("selectedSymptoms") || "[]"
            );
        } catch (error) {
            // If stored data is invalid, start with an empty selection.
            savedSymptoms = [];
        }

        // Array.isArray() verifies that the saved data is an array.
        // filter() keeps only symptoms from our approved list.
        const validSymptoms = Array.isArray(savedSymptoms)
            ? savedSymptoms.filter((symptom) =>
                approvedSymptoms.includes(symptom)
            )
            : [];

        // Set stores unique values, preventing duplicate selections.
        // this refers to the current SymptomSelection object.
        this.selectedSymptoms = new Set(validSymptoms);
    }

    // Adds a symptom to the selected collection.
    addSymptom(symptom) {
        this.selectedSymptoms.add(symptom);
        this.saveSelection();
    }

    // Removes a symptom from the selected collection.
    removeSymptom(symptom) {
        this.selectedSymptoms.delete(symptom);
        this.saveSelection();
    }

    // Returns true when at least one symptom is selected.
    validateSelection() {
        return this.selectedSymptoms.size > 0;
    }

    // Clears every selected symptom.
    clearSelection() {
        this.selectedSymptoms.clear();
        this.saveSelection();
    }

    // Saves the current selection so other pages can access it.
    saveSelection() {

        // Array.from() converts a Set into an array.
        // JSON.stringify() converts the array into storable JSON text.
        sessionStorage.setItem(
            "selectedSymptoms",
            JSON.stringify(Array.from(this.selectedSymptoms))
        );

        // Remove previous matches when symptoms change.
        sessionStorage.removeItem("matchedSpecialties");
    }
}

// new creates an object using our class.
const selection = new SymptomSelection();

// document.getElementById() finds an HTML element using its id.
const symptomList = document.getElementById("symptom-list");
const symptomForm = document.getElementById("symptom-form");
const errorMessage = document.getElementById("error-message");
const cancelButton = document.getElementById("cancel-btn");

// forEach() runs a function for every item in an array.
approvedSymptoms.forEach((symptom) => {

    // createElement() creates a new HTML element.
    const label = document.createElement("label");
    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.value = symptom;

    // has() checks whether a Set contains a specific value.
    // This restores the checkbox's previous selected state.
    checkbox.checked = selection.selectedSymptoms.has(symptom);

    // className assigns a CSS class to an HTML element.
    label.className = "symptom-option";

    // append() places elements inside another element.
    // createTextNode() creates text without treating it as HTML code.
    label.append(checkbox, document.createTextNode(symptom));
    symptomList.append(label);

    // addEventListener() runs code when an event happens.
    // "change" happens when a checkbox is checked or unchecked.
    checkbox.addEventListener("change", () => {

        // checked is true when the checkbox is selected.
        if (checkbox.checked) {
            selection.addSymptom(symptom);
        } else {
            selection.removeSymptom(symptom);
        }

        // textContent changes the text displayed by an HTML element.
        errorMessage.textContent = "";
    });
});

// "submit" runs when the visitor clicks Continue.
symptomForm.addEventListener("submit", (event) => {

    // preventDefault() stops the browser's normal form submission.
    event.preventDefault();

    const formData = new FormData(symptomForm);
    const validationMessage = validateIntake({
        ageGroup: formData.get("ageGroup"),
        location: formData.get("location"),
        insuranceProvider: formData.get("insuranceProvider"),
        insurancePlan: formData.get("insurancePlan"),
        preferredLanguage: formData.get("preferredLanguage"),
        appointmentType: formData.get("appointmentType"),
        travelDistance: formData.get("travelDistance"),
        accessibility: formData.get("accessibility"),
        selectedSymptoms: Array.from(selection.selectedSymptoms)
    });

    if (validationMessage) {
        errorMessage.textContent = validationMessage;
        if (!selection.validateSelection()) {
            symptomList.querySelector("input").focus();
        }
        return; // Ends the function early.
    }

    // Save the current symptoms before navigating.
    selection.saveSelection();

    const intake = Object.fromEntries(formData.entries());
    intake.selectedSymptoms = Array.from(selection.selectedSymptoms);

    // Keep the guest intake only in this tab for the matching flow.
    sessionStorage.setItem("intakeForMatching", JSON.stringify(intake));

    // location.href changes the current webpage.
    window.location.href = "/pages/match-results.html";
});

symptomForm.addEventListener("input", () => {
    errorMessage.textContent = "";
});

symptomForm.addEventListener("change", () => {
    errorMessage.textContent = "";
});

// "click" runs when the visitor presses Cancel.
cancelButton.addEventListener("click", () => {

    // Clear selections and previously saved results.
    selection.clearSelection();
    sessionStorage.removeItem("intakeForMatching");
    sessionStorage.removeItem("matchingResult");
    sessionStorage.removeItem("matchedSpecialties");

    // Return to the homepage.
    window.location.href = "/";
});
