
// FEATURE 3: MATCHING API ROUTE
// Validates selected symptoms and returns specialty matching results.
// This is the normal production-flow version without an artificial delay.

const express = require("express");
const SpecialtyMatcher = require("../services/specialtyMatcher");

// Router groups related API endpoints.
const router = express.Router();

// new creates an object from our matching class.
const matcher = new SpecialtyMatcher();

// Set stores unique values and allows fast membership checks.
// These symptoms are provisional educational demonstration data.
const allowedSymptoms = new Set([
    "Back Pain",
    "Knee Pain",
    "Skin Rash",
    "Acne",
    "Blurry Vision",
    "Ear Pain",
    "Frequent Headaches",
    "Joint Pain",
    "Sudden Vision Loss",
    "Sudden Severe Headache",
    "Chest Pain",
    "Other / Unlisted Symptom"
]);

// post() handles HTTP POST requests.
// req contains incoming information; res sends the response.
router.post("/", (req, res) => {

    // ?. safely accesses a property even when req.body is missing.
    const selectedSymptoms = req.body?.selectedSymptoms;

    // Array.isArray() checks whether a value is an array.
    // || means OR: either invalid condition rejects the request.
    if (!Array.isArray(selectedSymptoms) ||
        selectedSymptoms.length === 0) {

        // HTTP 400 indicates invalid request data.
        return res.status(400).json({
            status: "error",
            message: "Please select at least one symptom."
        });
    }

    // some() checks whether at least one item meets a condition.
    // typeof checks a value's data type.
    // ! means NOT; has() checks membership in a Set.
    const hasInvalidSymptom = selectedSymptoms.some(
        (symptom) =>
            typeof symptom !== "string" ||
            !allowedSymptoms.has(symptom)
    );

    if (hasInvalidSymptom) {
        return res.status(400).json({
            status: "error",
            message: "An invalid symptom was submitted."
        });
    }

    // Process the symptoms immediately using our matching service.
    const result = matcher.matchSymptoms(selectedSymptoms);

    // json() sends the result back to the frontend as JSON.
    return res.json(result);
});

// module.exports makes this router available to server.js.
module.exports = router;
