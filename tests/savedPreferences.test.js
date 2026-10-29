const { test } = require("node:test");
const assert = require("node:assert/strict");
const validateSavedPreferences =
    require("../backend/services/savedPreferences");

const validPreferences = {
    savePreferences: true,
    ageGroup: "25-34",
    location: "Minneapolis",
    insuranceProvider: "Medica",
    insurancePlan: "Choice",
    preferredLanguage: "English",
    appointmentType: "telehealth",
    travelDistance: "15",
    accessibility: "",
    transportation: ""
};

test("normalizes preferences only when consent is explicit", () => {
    const result = validateSavedPreferences(validPreferences);
    assert.equal(result.message, undefined);
    assert.equal(result.preferences.age_group, "25-34");
    assert.equal(result.preferences.travel_distance, 15);
    assert.equal(result.preferences.transportation, null);
    assert.equal(
        validateSavedPreferences({
            ...validPreferences,
            savePreferences: false
        }).message,
        "Consent is required before saving preferences."
    );
});

test("rejects symptoms and medical-history fields from saved profiles", () => {
    const result = validateSavedPreferences({
        ...validPreferences,
        symptoms: ["Back Pain"]
    });
    assert.match(result.message, /symptoms and medical history are not stored/i);
});
