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

export function validateIntake(intake) {
    if (!ageGroups.has(intake.ageGroup)) {
        return "Please choose an age group.";
    }

    if (typeof intake.location !== "string" ||
        !intake.location.trim() ||
        intake.location.length > 100) {
        return "Please enter a ZIP code or city.";
    }

    if (typeof intake.insuranceProvider === "string" &&
        intake.insuranceProvider.length > 100) {
        return "Insurance provider must be 100 characters or fewer.";
    }

    if (typeof intake.insurancePlan === "string" &&
        intake.insurancePlan.length > 100) {
        return "Insurance plan must be 100 characters or fewer.";
    }

    if (typeof intake.accessibility === "string" &&
        intake.accessibility.length > 200) {
        return "Accessibility requirements must be 200 characters or fewer.";
    }

    if (!Array.isArray(intake.selectedSymptoms) ||
        intake.selectedSymptoms.length === 0) {
        return "Please select at least one healthcare concern.";
    }
    if (intake.selectedSymptoms.some((symptom) =>
        typeof symptom !== "string" || symptom.length > 80
    )) {
        return "Please select a valid healthcare concern.";
    }

    if (!languages.has(intake.preferredLanguage)) {
        return "Please choose a preferred language.";
    }

    if (!appointmentTypes.has(intake.appointmentType)) {
        return "Please choose an appointment type.";
    }

    if (!travelDistances.has(intake.travelDistance)) {
        return "Please choose a maximum travel distance.";
    }

    return "";
}
