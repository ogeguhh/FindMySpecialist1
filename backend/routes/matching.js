
// MATCHING ROUTES
// Defines the API endpoint for specialty matching.

const express = require("express");
const SpecialtyMatcher = require("../services/specialtyMatcher");

// Router groups related API endpoints.
const router = express.Router();

// Create an instance of our matching class.
const matcher = new SpecialtyMatcher();

// POST receives data sent from the frontend.
router.post("/", (req, res) => {

    // req.body contains JSON sent by the browser.
    const selectedSymptoms = req.body.selectedSymptoms;

    // Array.isArray() checks whether the value is an array.
    if (!Array.isArray(selectedSymptoms) ||
        selectedSymptoms.length === 0) {

        // 400 means the request contains invalid input.
        return res.status(400).json({
            status: "error",
            message: "Please select at least one symptom."
        });
    }

    // Only accept the currently approved symptom IDs.
    const allowedSymptoms = ["Back Pain"];

    // some() checks whether at least one item meets a condition.
    if (selectedSymptoms.some(
        (symptom) => !allowedSymptoms.includes(symptom)
    )) {
        return res.status(400).json({
            status: "error",
            message: "An invalid symptom was submitted."
        });
    }

    // Ask the matching service to process the symptoms.
    const result = matcher.matchSymptoms(selectedSymptoms);

    // Send the result back to the frontend as JSON.
    res.json(result);
});

module.exports = router;
