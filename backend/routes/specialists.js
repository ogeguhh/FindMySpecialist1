const express = require("express");
const {
    getProviderById,
    listProviders,
    searchProviders
} = require("../services/providerMatcher");
const verifiedBookingLink = require("../services/bookingLinkValidator");

const router = express.Router();
const allowedSpecialties = new Set([
    "Orthopedics",
    "Dermatology",
    "Ophthalmology",
    "ENT",
    "Neurology",
    "Rheumatology"
]);
const allowedAgeGroups = new Set([
    "under-18",
    "18-24",
    "25-34",
    "35-44",
    "45-54",
    "55-64",
    "65-plus"
]);
const allowedLanguages = new Set([
    "English",
    "Spanish",
    "Somali",
    "Hmong",
    "Vietnamese",
    "Arabic",
    "American Sign Language",
    "Another language"
]);
const allowedDistances = new Set([5, 10, 15, 25, 50]);
const allowedAppointmentTypes = new Set(["in-person", "telehealth"]);

router.get("/", (req, res) => {
    const specialty = req.query.specialty;
    const city = req.query.city ?? "";
    if (typeof specialty !== "string" || typeof city !== "string" ||
        !allowedSpecialties.has(specialty)) {
        return res.status(400).json({
            status: "error",
            message: "Please provide a valid specialty and city."
        });
    }

    const offices = listProviders().filter((provider) =>
        provider.specialty === specialty &&
        (!city.trim() ||
            provider.city.toLowerCase().includes(city.trim().toLowerCase()))
    );
    return res.json({
        status: "success",
        count: offices.length,
        offices
    });
});

router.post("/search", (req, res) => {
    const body = req.body || {};
    const {
        specialties,
        ageGroup,
        location,
        preferredLanguage,
        appointmentType,
        travelDistance,
        insuranceProvider,
        insurancePlan,
        accessibility
    } = body;

    if (!Array.isArray(specialties) ||
        specialties.length === 0 ||
        specialties.some((specialty) => !allowedSpecialties.has(specialty)) ||
        !allowedAgeGroups.has(ageGroup) ||
        typeof location !== "string" ||
        !location.trim() ||
        location.length > 100 ||
        !allowedLanguages.has(preferredLanguage) ||
        !allowedAppointmentTypes.has(appointmentType) ||
        !allowedDistances.has(Number(travelDistance)) ||
        (insuranceProvider !== undefined &&
            (typeof insuranceProvider !== "string" ||
                insuranceProvider.length > 100)) ||
        (insurancePlan !== undefined &&
            (typeof insurancePlan !== "string" ||
                insurancePlan.length > 100)) ||
        (accessibility !== undefined &&
            (typeof accessibility !== "string" ||
                accessibility.length > 200))) {
        return res.status(400).json({
            status: "error",
            message: "Please check the matching preferences and try again."
        });
    }

    // Keep personal intake values out of URLs and server logs.
    const result = searchProviders({
        specialties,
        ageGroup,
        location,
        preferredLanguage,
        appointmentType,
        travelDistance: Number(travelDistance),
        insuranceProvider: insuranceProvider || "",
        insurancePlan: insurancePlan || "",
        accessibility: accessibility || ""
    });
    return res.json(result);
});

router.get("/:id", (req, res) => {
    const officeId = Number(req.params.id);
    if (!Number.isInteger(officeId) || officeId <= 0) {
        return res.status(400).json({
            status: "error",
            message: "Invalid office ID."
        });
    }

    const provider = getProviderById(officeId);
    if (!provider) {
        return res.status(404).json({
            status: "error",
            message: "Medical office not found."
        });
    }

    const {
        latitude,
        longitude,
        ageGroups,
        mockInsuranceProviders,
        accessibilityFeatures,
        ...publicProvider
    } = provider;
    const website = verifiedBookingLink(
        provider.website,
        provider.websiteVerified
    );
    return res.json({
        status: "success",
        office: {
            ...publicProvider,
            website,
            websiteVerified: Boolean(website)
        }
    });
});

module.exports = router;
