const { test } = require("node:test");
const assert = require("node:assert/strict");
const SpecialtyMatcher = require("../backend/services/specialtyMatcher");

const matcher = new SpecialtyMatcher();

test("returns an explainable rule-based match without diagnosing", () => {
    const result = matcher.matchSymptoms(["Back Pain", "Knee Pain"]);
    assert.equal(result.status, "matched");
    assert.deepEqual(result.specialties, ["Orthopedics"]);
    assert.deepEqual(result.matches[0].matchedSymptoms, [
        "Back Pain",
        "Knee Pain"
    ]);
    assert.match(result.matches[0].reason, /bones, joints, and movement/i);
    assert.match(result.message, /not medical diagnoses/i);
});

test("urgent warning signs suppress routine recommendations", () => {
    const result = matcher.matchSymptoms(["Back Pain", "Chest Pain"]);
    assert.equal(result.status, "urgent");
    assert.deepEqual(result.specialties, []);
    assert.deepEqual(result.matches, []);
    assert.match(result.message, /call 911/i);
});

test("returns no match for concerns without a rule", () => {
    const result = matcher.matchSymptoms(["Other / Unlisted Symptom"]);
    assert.equal(result.status, "no_match");
    assert.deepEqual(result.specialties, []);
});