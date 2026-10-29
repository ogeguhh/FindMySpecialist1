const { test } = require("node:test");
const assert = require("node:assert/strict");
const validation = import("../frontend/js/intakeValidation.mjs");

const validIntake = {
    ageGroup: "25-34",
    location: "Minneapolis",
    preferredLanguage: "English",
    appointmentType: "telehealth",
    travelDistance: "15",
    selectedSymptoms: ["Back Pain"]
};

test("accepts a complete intake", async () => {
    const { validateIntake } = await validation;
    assert.equal(validateIntake(validIntake), "");
});

test("requires an age group and a ZIP code or city", async () => {
    const { validateIntake } = await validation;
    assert.equal(
        validateIntake({ ...validIntake, ageGroup: "" }),
        "Please choose an age group."
    );
    assert.equal(
        validateIntake({ ...validIntake, location: "   " }),
        "Please enter a ZIP code or city."
    );
});

test("requires at least one healthcare concern", async () => {
    const { validateIntake } = await validation;
    assert.equal(
        validateIntake({ ...validIntake, selectedSymptoms: [] }),
        "Please select at least one healthcare concern."
    );
});

test("rejects unsupported language, appointment, and travel choices", async () => {
    const { validateIntake } = await validation;
    assert.equal(
        validateIntake({ ...validIntake, preferredLanguage: "" }),
        "Please choose a preferred language."
    );
    assert.equal(
        validateIntake({ ...validIntake, appointmentType: "either" }),
        "Please choose an appointment type."
    );
    assert.equal(
        validateIntake({ ...validIntake, travelDistance: "20" }),
        "Please choose a maximum travel distance."
    );
});

test("limits free-text intake values without requiring optional insurance", async () => {
    const { validateIntake } = await validation;
    assert.equal(validateIntake(validIntake), "");
    assert.equal(
        validateIntake({ ...validIntake, location: "x".repeat(101) }),
        "Please enter a ZIP code or city."
    );
    assert.equal(
        validateIntake({
            ...validIntake,
            accessibility: "x".repeat(201)
        }),
        "Accessibility requirements must be 200 characters or fewer."
    );
});
