
// FEATURE 3: SPECIALTY MATCHER
// Matches symptoms using predefined demonstration rules.
// Not a medical diagnosis or validated emergency screening tool.

// An array [] stores our proposed matching rules.
// Each object {} contains a symptom and a specialty.
const proposedRules = [
    { symptom: "Back Pain", specialty: "Orthopedics" },
    { symptom: "Knee Pain", specialty: "Orthopedics" },
    { symptom: "Skin Rash", specialty: "Dermatology" },
    { symptom: "Acne", specialty: "Dermatology" },
    { symptom: "Blurry Vision", specialty: "Ophthalmology" },
    { symptom: "Ear Pain", specialty: "ENT" },
    { symptom: "Frequent Headaches", specialty: "Neurology" },
    { symptom: "Joint Pain", specialty: "Rheumatology" }
];

// Set stores unique values.
// These urgent-warning examples require team review.
const urgentSymptoms = new Set([
    "Sudden Vision Loss",
    "Sudden Severe Headache",
    "Chest Pain"
]);

// A class groups related data and methods together.
class SpecialtyMatcher {

    // This method receives an array of selected symptoms.
    matchSymptoms(selectedSymptoms) {

        // filter() creates an array containing matching items.
        // has() checks whether a Set contains a value.
        const urgentMatches = selectedSymptoms.filter((symptom) =>
            urgentSymptoms.has(symptom)
        );

        // length tells us how many items are in an array.
        // Urgent warnings take priority over routine matches.
        if (urgentMatches.length > 0) {

            // return ends the method and sends back this object.
            return {
                status: "urgent",
                specialties: [],
                message:
                    "Some selected symptoms may require immediate " +
                    "medical attention. Do not rely on this tool " +
                    "for emergency decisions. If you may be " +
                    "experiencing a medical emergency, call 911 " +
                    "or your local emergency number."
            };
        }

        // includes() checks whether an array contains a value.
        const matchingRules = proposedRules.filter((rule) =>
            selectedSymptoms.includes(rule.symptom)
        );

        // map() creates a new array containing specialty names.
        const specialtyNames = matchingRules.map((rule) =>
            rule.specialty
        );

        // ... spreads the Set's unique values into an array.
        // This prevents duplicate specialty recommendations.
        const specialties = [...new Set(specialtyNames)];

        // Handle symptoms that have no matching rule.
        if (specialties.length === 0) {
            return {
                status: "no_match",
                specialties: [],
                message: "No confident specialty match was found."
            };
        }

        // Return one or more matching specialties.
        return {
            status: "matched",
            specialties: specialties,
            message: "Proposed specialty matches found."
        };
    }
}

// Makes this class available to other backend files.
module.exports = SpecialtyMatcher;
