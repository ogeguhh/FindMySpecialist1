const { test } = require("node:test");
const assert = require("node:assert/strict");
const { searchProviders } = require("../backend/services/providerMatcher");

function criteria(overrides = {}) {
    return {
        specialties: ["Orthopedics"],
        ageGroup: "25-34",
        location: "Minneapolis",
        preferredLanguage: "English",
        appointmentType: "in-person",
        travelDistance: 50,
        insuranceProvider: "",
        insurancePlan: "",
        accessibility: "",
        ...overrides
    };
}

test("filters provider suggestions by specialty, age, language, and distance", () => {
    const result = searchProviders(criteria({
        ageGroup: "under-18",
        travelDistance: 5
    }));
    assert.equal(result.status, "success");
    assert.deepEqual(result.offices.map((office) => office.id), []);
});

test("matches telehealth and preferred language when filtering providers", () => {
    const result = searchProviders(criteria({
        specialties: ["Orthopedics"],
        ageGroup: "under-18",
        preferredLanguage: "Hmong",
        appointmentType: "telehealth",
        location: "Saint Paul",
        travelDistance: 10
    }));
    assert.deepEqual(result.offices.map((office) => office.id), [2]);
    assert.equal(result.offices[0].telehealth, true);
});

test("reports approximate distance and does not claim plan verification", () => {
    const result = searchProviders(criteria({
        insuranceProvider: "Blue Cross Blue Shield",
        insurancePlan: "My Exact Plan",
        travelDistance: 5
    }));
    const office = result.offices.find((item) => item.id === 1);
    assert.ok(office);
    assert.equal(typeof office.distanceMiles, "number");
    assert.match(office.insuranceCompatibility, /plan and network not verified/i);
    assert.equal(office.insurancePlanVerified, false);
    assert.equal(office.websiteVerified, false);
});

test("ranks mock accessibility matches without treating unknown needs as verified", () => {
    const recognized = searchProviders(criteria({
        accessibility: "wheelchair access"
    }));
    assert.match(
        recognized.offices[0].accessibilityCompatibility,
        /matching feature appears in mock data/i
    );

    const unknown = searchProviders(criteria({
        accessibility: "a quiet waiting room"
    }));
    assert.ok(unknown.offices.every((office) =>
        /not categorized in mock data/i.test(office.accessibilityCompatibility)
    ));
});

test("declines distance estimates for unsupported locations", () => {
    const result = searchProviders(criteria({ location: "Chicago" }));
    assert.equal(result.status, "location_unavailable");
    assert.deepEqual(result.offices, []);
});
