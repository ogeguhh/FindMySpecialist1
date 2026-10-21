
/*
    SYMPTOM SELECTION
    Feature 2: Select Symptoms

    Handles selecting symptoms, validating selections,
    and navigating between pages.
*/

// import brings data from another JavaScript file.
// We import the approved symptom list created earlier.
import { approvedSymptoms } from "../data/symptoms.js";

// CLASS: A blueprint that groups related data and methods.
class SymptomSelection {

    // constructor() runs when we create a new object from this class.
    constructor() {
        // this refers to the current object.
        // Set stores unique values and prevents duplicates.
        this.selectedSymptoms = new Set();
    }

    // Adds a symptom to our selection.
    addSymptom(symptom) {
        this.selectedSymptoms.add(symptom);
    }

    // Removes a symptom from our selection.
    removeSymptom(symptom) {
        this.selectedSymptoms.delete(symptom);
    }

    // Checks whether the visitor selected at least one symptom.
    // Returns true if valid, false if invalid.
    validateSelection() {
        return this.selectedSymptoms.size > 0;
    }

    // Removes every selected symptom.
    clearSelection() {
        this.selectedSymptoms.clear();
    }
}

// new creates an object using our class.
const selection = new SymptomSelection();

// document.getElementById() finds an HTML element using its id.
const symptomList = document.getElementById("symptom-list");
const symptomForm = document.getElementById("symptom-form");
const errorMessage = document.getElementById("error-message");
const cancelButton = document.getElementById("cancel-btn");

// forEach() repeats an action for every item in an array.
// symptom represents the current symptom in the loop.
approvedSymptoms.forEach((symptom) => {

    // createElement() creates a new HTML element using JavaScript.
    const label = document.createElement("label");
    const checkbox = document.createElement("input");

    // Sets the input type to checkbox.
    checkbox.type = "checkbox";
    checkbox.value = symptom;

    // Adds our CSS class to the label.
    label.className = "symptom-option";

    // append() places elements inside another element.
    label.append(checkbox, document.createTextNode(symptom));
    symptomList.append(label);

    // change happens when the visitor checks or unchecks a box.
    checkbox.addEventListener("change", () => {

        // checked is true when the checkbox is selected.
        if (checkbox.checked) {
            selection.addSymptom(symptom);
        } else {
            selection.removeSymptom(symptom);
        }

        // Clears any previous validation error.
        errorMessage.textContent = "";
    });
});

// submit happens when the visitor clicks Continue.
symptomForm.addEventListener("submit", (event) => {

    // preventDefault() stops the browser's normal form submission.
    event.preventDefault();

    // ! means NOT, so this checks whether selection is invalid.
    if (!selection.validateSelection()) {
        errorMessage.textContent =
            "Please select at least one symptom";
        return; // Stops the function here.
    }

    // Array.from() converts our Set into an array.
    const symptoms = Array.from(selection.selectedSymptoms);

    // sessionStorage stores data for this browser tab.
    // JSON.stringify() converts the array into text for storage.
    sessionStorage.setItem(
        "selectedSymptoms",
        JSON.stringify(symptoms)
    );

    // location.href navigates the browser to another page.
    window.location.href = "/pages/match-results.html";
});

// click happens when the visitor presses Cancel.
cancelButton.addEventListener("click", () => {

    selection.clearSelection();

    // removeItem() deletes the saved symptom selection.
    sessionStorage.removeItem("selectedSymptoms");

    // Return to the homepage.
    window.location.href = "/";
});
