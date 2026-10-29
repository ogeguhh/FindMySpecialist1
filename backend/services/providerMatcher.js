const verifiedBookingLink = require("./bookingLinkValidator");

const allAgeGroups = [
    "under-18",
    "18-24",
    "25-34",
    "35-44",
    "45-54",
    "55-64",
    "65-plus"
];
const adultAgeGroups = allAgeGroups.filter((ageGroup) =>
    ageGroup !== "under-18"
);

const providers = [
    {
        id: 1,
        name: "Northstar Orthopedic Center (Mock)",
        specialty: "Orthopedics",
        city: "Minneapolis",
        state: "MN",
        latitude: 44.978,
        longitude: -93.265,
        description: "Synthetic listing for an orthopedic clinic.",
        ageGroups: adultAgeGroups,
        languages: ["English", "Spanish"],
        inPerson: true,
        telehealth: false,
        accessibilityFeatures: ["step-free entry", "wheelchair access"],
        mockInsuranceProviders: ["Blue Cross Blue Shield", "Medica"]
    },
    {
        id: 2,
        name: "Capital Joint Care (Mock)",
        specialty: "Orthopedics",
        city: "Saint Paul",
        state: "MN",
        latitude: 44.953,
        longitude: -93.09,
        description: "Synthetic listing for bones and joint care.",
        ageGroups: allAgeGroups,
        languages: ["English", "Spanish", "Hmong"],
        inPerson: true,
        telehealth: true,
        accessibilityFeatures: ["step-free entry"],
        mockInsuranceProviders: ["HealthPartners"]
    },
    {
        id: 3,
        name: "Lakeside Skin Center (Mock)",
        specialty: "Dermatology",
        city: "Minneapolis",
        state: "MN",
        latitude: 44.96,
        longitude: -93.29,
        description: "Synthetic listing for skin care.",
        ageGroups: allAgeGroups,
        languages: ["English", "Spanish", "Somali"],
        inPerson: true,
        telehealth: true,
        accessibilityFeatures: ["step-free entry", "hearing support"],
        mockInsuranceProviders: ["Medica"]
    },
    {
        id: 4,
        name: "Bloomington Dermatology Clinic (Mock)",
        specialty: "Dermatology",
        city: "Bloomington",
        state: "MN",
        latitude: 44.84,
        longitude: -93.3,
        description: "Synthetic listing for skin concerns.",
        ageGroups: adultAgeGroups,
        languages: ["English", "Arabic"],
        inPerson: true,
        telehealth: false,
        accessibilityFeatures: ["wheelchair access"],
        mockInsuranceProviders: []
    },
    {
        id: 5,
        name: "Capital Vision Center (Mock)",
        specialty: "Ophthalmology",
        city: "Saint Paul",
        state: "MN",
        latitude: 44.95,
        longitude: -93.105,
        description: "Synthetic listing for eye care.",
        ageGroups: allAgeGroups,
        languages: ["English", "Spanish"],
        inPerson: true,
        telehealth: false,
        accessibilityFeatures: ["step-free entry", "visual support"],
        mockInsuranceProviders: ["HealthPartners"]
    },
    {
        id: 6,
        name: "Northstar Ear Nose and Throat (Mock)",
        specialty: "ENT",
        city: "Minneapolis",
        state: "MN",
        latitude: 44.99,
        longitude: -93.28,
        description: "Synthetic listing for ear, nose, and throat care.",
        ageGroups: allAgeGroups,
        languages: ["English", "Somali"],
        inPerson: true,
        telehealth: true,
        accessibilityFeatures: ["step-free entry", "hearing support"],
        mockInsuranceProviders: ["Blue Cross Blue Shield"]
    },
    {
        id: 7,
        name: "Maple Grove Neurology (Mock)",
        specialty: "Neurology",
        city: "Maple Grove",
        state: "MN",
        latitude: 45.072,
        longitude: -93.455,
        description: "Synthetic listing for neurological care.",
        ageGroups: adultAgeGroups,
        languages: ["English"],
        inPerson: true,
        telehealth: true,
        accessibilityFeatures: ["step-free entry"],
        mockInsuranceProviders: ["Medica"]
    },
    {
        id: 8,
        name: "South Metro Rheumatology (Mock)",
        specialty: "Rheumatology",
        city: "Bloomington",
        state: "MN",
        latitude: 44.83,
        longitude: -93.32,
        description: "Synthetic listing for rheumatology care.",
        ageGroups: adultAgeGroups,
        languages: ["English", "Spanish"],
        inPerson: true,
        telehealth: true,
        accessibilityFeatures: ["step-free entry", "wheelchair access"],
        mockInsuranceProviders: ["HealthPartners", "Medica"]
    }
];

const locations = new Map([
    ["minneapolis", { latitude: 44.978, longitude: -93.265 }],
    ["55401", { latitude: 44.982, longitude: -93.27 }],
    ["55402", { latitude: 44.977, longitude: -93.27 }],
    ["55404", { latitude: 44.962, longitude: -93.265 }],
    ["55408", { latitude: 44.94, longitude: -93.3 }],
    ["saint paul", { latitude: 44.953, longitude: -93.09 }],
    ["st paul", { latitude: 44.953, longitude: -93.09 }],
    ["55101", { latitude: 44.95, longitude: -93.09 }],
    ["55102", { latitude: 44.94, longitude: -93.12 }],
    ["55104", { latitude: 44.955, longitude: -93.16 }],
    ["bloomington", { latitude: 44.84, longitude: -93.3 }],
    ["55420", { latitude: 44.83, longitude: -93.3 }],
    ["maple grove", { latitude: 45.072, longitude: -93.455 }],
    ["55311", { latitude: 45.11, longitude: -93.47 }]
]);

function distanceInMiles(from, to) {
    const radians = (degrees) => (degrees * Math.PI) / 180;
    const latitudeDelta = radians(to.latitude - from.latitude);
    const longitudeDelta = radians(to.longitude - from.longitude);
    const startLatitude = radians(from.latitude);
    const endLatitude = radians(to.latitude);
    const haversine =
        Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(startLatitude) *
        Math.cos(endLatitude) *
        Math.sin(longitudeDelta / 2) ** 2;

    return 3958.8 * 2 * Math.atan2(
        Math.sqrt(haversine),
        Math.sqrt(1 - haversine)
    );
}

function requestedAccessibilityFeature(requirement) {
    const value = requirement.toLowerCase();
    if (/wheelchair|mobility|step.?free|ramp/.test(value)) {
        return ["step-free entry", "wheelchair access"];
    }
    if (/hearing|deaf|hard of hearing/.test(value)) {
        return ["hearing support"];
    }
    if (/visual|vision|blind/.test(value)) {
        return ["visual support"];
    }
    return [];
}

function insuranceStatus(provider, insuranceProvider) {
    if (!insuranceProvider) {
        return "Not provided; insurance not checked.";
    }

    const providerNameMatches = provider.mockInsuranceProviders.some(
        (name) => name.toLowerCase() === insuranceProvider.trim().toLowerCase()
    );
    return providerNameMatches
        ? "Mock carrier-name match only; plan and network not verified."
        : "No mock carrier-name match; confirm with your insurer.";
}

function searchProviders(criteria) {
    const origin = locations.get(
        String(criteria.location || "").trim().toLowerCase()
    );

    if (!origin) {
        return {
            status: "location_unavailable",
            message:
                "Distance estimates in this demo are available only for " +
                "Minneapolis, Saint Paul, Bloomington, Maple Grove, and " +
                "the listed nearby ZIP codes.",
            offices: []
        };
    }

    const requestedSpecialties = new Set(criteria.specialties || []);
    const maxDistance = Number(criteria.travelDistance || 50);
    const accessibilityRequirement = String(
        criteria.accessibility || ""
    ).trim();
    const requestedFeatures = requestedAccessibilityFeature(
        accessibilityRequirement
    );

    const offices = providers
        .filter((provider) =>
            requestedSpecialties.has(provider.specialty) &&
            provider.ageGroups.includes(criteria.ageGroup) &&
            provider.languages.includes(criteria.preferredLanguage) &&
            (criteria.appointmentType !== "telehealth" || provider.telehealth) &&
            (criteria.appointmentType !== "in-person" || provider.inPerson)
        )
        .map((provider) => {
            const distanceMiles = distanceInMiles(origin, provider);
            const accessibilityMatches =
                requestedFeatures.some((feature) =>
                    provider.accessibilityFeatures.includes(feature)
                );
            const languages = [...provider.languages];
            const { latitude, longitude, ageGroups, mockInsuranceProviders,
                accessibilityFeatures, ...publicProvider } = provider;

            return {
                ...publicProvider,
                distanceMiles: Math.round(distanceMiles * 10) / 10,
                insuranceCompatibility: insuranceStatus(
                    provider,
                    criteria.insuranceProvider
                ),
                insurancePlanVerified: false,
                accessibilityCompatibility:
                    !accessibilityRequirement
                        ? "No accessibility requirement provided."
                        : requestedFeatures.length === 0
                            ? "This requirement is not categorized in mock data; ask the clinic."
                        : accessibilityMatches
                            ? "A matching feature appears in mock data; confirm with the clinic."
                            : "No matching feature is listed in mock data; ask the clinic.",
                languages,
                website: null,
                websiteVerified: false
            };
        })
        .filter((provider) => provider.distanceMiles <= maxDistance)
        .sort((first, second) => {
            const firstAccessibility =
                first.accessibilityCompatibility.startsWith("A matching") ? 0 : 1;
            const secondAccessibility =
                second.accessibilityCompatibility.startsWith("A matching") ? 0 : 1;
            return firstAccessibility - secondAccessibility ||
                first.distanceMiles - second.distanceMiles;
        });

    return {
        status: "success",
        message: offices.length
            ? "Mock provider listings only; confirm distance, insurance, access, and availability directly."
            : "No mock providers met the selected specialty, age, language, appointment, and distance criteria.",
        offices
    };
}

function getProviderById(id) {
    return providers.find((provider) => provider.id === id) || null;
}

function toPublicProvider(provider) {
    if (!provider) {
        return null;
    }

    const { latitude, longitude, ageGroups, mockInsuranceProviders,
        accessibilityFeatures, website, websiteVerified, ...publicProvider } = provider;
    const safeWebsite = verifiedBookingLink(website, websiteVerified);
    return {
        ...publicProvider,
        website: safeWebsite,
        websiteVerified: Boolean(safeWebsite)
    };
}

function listProviders() {
    return providers.map(toPublicProvider);
}

module.exports = {
    getProviderById,
    listProviders,
    searchProviders
};
