const ageGroups = new Set([
    "under-18",
    "18-24",
    "25-34",
    "35-44",
    "45-54",
    "55-64",
    "65-plus"
]);
const languages = new Set([
    "English",
    "Spanish",
    "Somali",
    "Hmong",
    "Vietnamese",
    "Arabic",
    "American Sign Language",
    "Another language"
]);
const appointmentTypes = new Set(["in-person", "telehealth"]);
const travelDistances = new Set(["5", "10", "15", "25", "50"]);
const transportationOptions = new Set([
    "",
    "public-transit",
    "personal-vehicle",
    "rideshare",
    "other"
]);
const preferenceFields = new Set([
    "savePreferences",
    "ageGroup",
    "location",
    "insuranceProvider",
    "insurancePlan",
    "preferredLanguage",
    "appointmentType",
    "travelDistance",
    "accessibility",
    "transportation"
]);

function validateSavedPreferences(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return { message: "Please provide valid preferences." };
    }
    if (Object.keys(value).some((key) => !preferenceFields.has(key))) {
        return {
            message:
                "Only contact and matching preferences can be saved; " +
                "symptoms and medical history are not stored."
        };
    }
    if (value.savePreferences !== true) {
        return {
            message: "Consent is required before saving preferences."
        };
    }
    if (!ageGroups.has(value.ageGroup)) {
        return { message: "Please choose a valid age group." };
    }
    if (typeof value.location !== "string" ||
        !value.location.trim() ||
        value.location.length > 100) {
        return { message: "Please enter a valid ZIP code or city." };
    }
    if (!languages.has(value.preferredLanguage)) {
        return { message: "Please choose a valid preferred language." };
    }
    if (!appointmentTypes.has(value.appointmentType)) {
        return { message: "Please choose a valid appointment type." };
    }
    if (!travelDistances.has(String(value.travelDistance))) {
        return { message: "Please choose a valid travel distance." };
    }

    for (const field of ["insuranceProvider", "insurancePlan"]) {
        if (value[field] !== undefined &&
            (typeof value[field] !== "string" || value[field].length > 100)) {
            return { message: "Insurance fields must be 100 characters or fewer." };
        }
    }
    if (value.accessibility !== undefined &&
        (typeof value.accessibility !== "string" ||
            value.accessibility.length > 200)) {
        return {
            message: "Accessibility requirements must be 200 characters or fewer."
        };
    }
    if (value.transportation !== undefined &&
        !transportationOptions.has(value.transportation)) {
        return { message: "Please choose a valid transportation preference." };
    }

    return {
        preferences: {
            age_group: value.ageGroup,
            location: value.location.trim(),
            insurance_provider: value.insuranceProvider?.trim() || null,
            insurance_plan: value.insurancePlan?.trim() || null,
            preferred_language: value.preferredLanguage,
            appointment_type: value.appointmentType,
            travel_distance: Number(value.travelDistance),
            accessibility: value.accessibility?.trim() || null,
            transportation: value.transportation || null
        }
    };
}

module.exports = validateSavedPreferences;
