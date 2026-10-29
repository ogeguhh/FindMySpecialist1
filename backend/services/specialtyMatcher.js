// Rule-based educational matching only; this is not a diagnostic tool.
const proposedRules = [
    {
        symptoms: ["Back Pain", "Knee Pain"],
        specialty: "Orthopedics",
        reason: "Orthopedics focuses on bones, joints, and movement."
    },
    {
        symptoms: ["Skin Rash", "Acne"],
        specialty: "Dermatology",
        reason: "Dermatology focuses on skin concerns."
    },
    {
        symptoms: ["Blurry Vision"],
        specialty: "Ophthalmology",
        reason: "Ophthalmology focuses on eye and vision concerns."
    },
    {
        symptoms: ["Ear Pain"],
        specialty: "ENT",
        reason: "ENT care focuses on ear, nose, and throat concerns."
    },
    {
        symptoms: ["Frequent Headaches"],
        specialty: "Neurology",
        reason: "Neurology focuses on the brain and nervous system."
    },
    {
        symptoms: ["Joint Pain"],
        specialty: "Rheumatology",
        reason: "Rheumatology focuses on joint and autoimmune concerns."
    }
];

const urgentSymptoms = new Set([
    "Sudden Vision Loss",
    "Sudden Severe Headache",
    "Chest Pain"
]);

class SpecialtyMatcher {
    matchSymptoms(selectedSymptoms) {
        const urgentMatches = selectedSymptoms.filter((symptom) =>
            urgentSymptoms.has(symptom)
        );

        if (urgentMatches.length > 0) {
            return {
                status: "urgent",
                specialties: [],
                matches: [],
                message:
                    "Some selected symptoms may require immediate " +
                    "medical attention. This tool cannot assess emergencies. " +
                    "If you may be experiencing a medical emergency, call " +
                    "911 or your local emergency number."
            };
        }

        const matches = proposedRules
            .map((rule) => ({
                specialty: rule.specialty,
                reason: rule.reason,
                matchedSymptoms: rule.symptoms.filter((symptom) =>
                    selectedSymptoms.includes(symptom)
                )
            }))
            .filter((match) => match.matchedSymptoms.length > 0);

        if (matches.length === 0) {
            return {
                status: "no_match",
                specialties: [],
                matches: [],
                message: "No rule-based specialty suggestion was found."
            };
        }

        return {
            status: "matched",
            specialties: matches.map((match) => match.specialty),
            matches,
            message:
                "These are educational suggestions based on the concerns " +
                "selected, not medical diagnoses."
        };
    }
}

module.exports = SpecialtyMatcher;
