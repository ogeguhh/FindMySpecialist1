
// FEATURE 2: SYMPTOM DATA
// Stores the symptom options shown to visitors.
// These options are demonstration data pending team approval.

// const creates a variable that cannot be reassigned.
// An array [] stores multiple values.
// Each string is one selectable symptom.
const approvedSymptoms = [
    "Back Pain",
    "Knee Pain",
    "Skin Rash",
    "Acne",
    "Blurry Vision",
    "Ear Pain",
    "Frequent Headaches",
    "Joint Pain",

    // Proposed urgent-warning examples.
    "Sudden Vision Loss",
    "Sudden Severe Headache",
    "Chest Pain",

    // Synthetic test option with no specialty-matching rule.
    // Used to verify the documented no-match scenario.
    "Other / Unlisted Symptom"
];

// export makes this array available to other JavaScript files.
export { approvedSymptoms };
