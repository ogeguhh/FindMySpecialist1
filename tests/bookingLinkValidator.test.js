const { test } = require("node:test");
const assert = require("node:assert/strict");
const verifiedBookingLink = require("../backend/services/bookingLinkValidator");

test("only exposes explicitly verified HTTPS links without credentials", () => {
    assert.equal(
        verifiedBookingLink("https://clinic.example/schedule", true),
        "https://clinic.example/schedule"
    );
    assert.equal(
        verifiedBookingLink("https://clinic.example/schedule", false),
        null
    );
    assert.equal(
        verifiedBookingLink("http://clinic.example/schedule", true),
        null
    );
    assert.equal(
        verifiedBookingLink("https://user:pass@clinic.example/", true),
        null
    );
});
