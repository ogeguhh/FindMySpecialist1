
// SPECIALTY MATCHER
// Checks selected symptoms against approved matching rules.

// An empty array means no matching rules have been approved yet.
const approvedRules = [];

// CLASS: Groups matching data and behavior together.
class SpecialtyMatcher {

    // This method receives an array of selected symptoms.
    matchSymptoms(selectedSymptoms) {

        // filter() creates a new array containing matching rules.
        const matches = approvedRules.filter((rule) => {

            // every() checks whether all required symptoms are selected.
            // includes() checks whether an array contains a value.
            return rule.symptoms.every((symptom) =>
                selectedSymptoms.includes(symptom)
            );
        });

        // If no approved rules match, return a no-match result.
        if (matches.length === 0) {
            return {
                status: "no_match",
                specialties: [],
                message: "No confident specialty match was found."
            };
        }

        // Set removes duplicate specialty names.
        const specialties = [...new Set(
            matches.map((rule) => rule.specialty)
        )];

        return {
            status: "matched",
            specialties: specialties,
            message: "Approved specialty matches found."
        };
    }
}

// module.exports allows another backend file to use this class.
module.exports = SpecialtyMatcher;
