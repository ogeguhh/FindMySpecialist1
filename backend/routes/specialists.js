
// FEATURE 4 AND 5: MEDICAL OFFICE API
// This is our single source of fictional medical office data.
// Feature 4 searches offices.
// Feature 5 retrieves one office by its ID.

const express = require("express");

// Router groups related API endpoints.
const router = express.Router();

// Our fictional medical office records.
// These are educational test records, not real clinics.
const medicalOffices = [
    {
        id: 1,
        name: "Northstar Orthopedic Center",
        specialty: "Orthopedics",
        city: "Minneapolis",
        state: "MN",
        address: "Demo Address 1",
        description: "An office focused on orthopedic care."
    },
    {
        id: 2,
        name: "Capital Joint Care",
        specialty: "Orthopedics",
        city: "Saint Paul",
        state: "MN",
        address: "Demo Address 2",
        description: "An office focused on bones and joints."
    },
    {
        id: 3,
        name: "Lakeside Skin Center",
        specialty: "Dermatology",
        city: "Minneapolis",
        state: "MN",
        address: "Demo Address 3",
        description: "An office focused on skin care."
    },
    {
        id: 4,
        name: "Bloomington Dermatology Clinic",
        specialty: "Dermatology",
        city: "Bloomington",
        state: "MN",
        address: "Demo Address 4",
        description: "An office focused on skin conditions."
    },
    {
        id: 5,
        name: "Capital Vision Center",
        specialty: "Ophthalmology",
        city: "Saint Paul",
        state: "MN",
        address: "Demo Address 5",
        description: "An office focused on eye care."
    },
    {
        id: 6,
        name: "Northstar Ear Nose and Throat",
        specialty: "ENT",
        city: "Minneapolis",
        state: "MN",
        address: "Demo Address 6",
        description: "An office focused on ear, nose, and throat care."
    },
    {
        id: 7,
        name: "Maple Grove Neurology",
        specialty: "Neurology",
        city: "Maple Grove",
        state: "MN",
        address: "Demo Address 7",
        description: "An office focused on neurological care."
    },
    {
        id: 8,
        name: "South Metro Rheumatology",
        specialty: "Rheumatology",
        city: "Bloomington",
        state: "MN",
        address: "Demo Address 8",
        description: "An office focused on rheumatology care."
    }
];

// FEATURE 4: SEARCH MEDICAL OFFICES
// GET /api/specialists?specialty=Orthopedics&city=Minneapolis
router.get("/", (req, res) => {

    // req.query reads search parameters from the URL.
    // ?? provides a default only when the value is null or undefined.
    const specialty = req.query.specialty ?? "";
    const city = req.query.city ?? "";

    // typeof checks whether the submitted values are strings.
    if (typeof specialty !== "string" ||
        typeof city !== "string") {

        return res.status(400).json({
            status: "error",
            message: "Invalid search parameters."
        });
    }

    // trim() removes surrounding spaces.
    // toLowerCase() makes searches case-insensitive.
    const specialtySearch = specialty.trim().toLowerCase();
    const citySearch = city.trim().toLowerCase();

    // A specialty must be selected.
    if (!specialtySearch) {
        return res.status(400).json({
            status: "error",
            message: "Please provide a specialty."
        });
    }

    // filter() returns all offices meeting both conditions.
    const results = medicalOffices.filter((office) => {

        const matchesSpecialty =
            office.specialty.toLowerCase() === specialtySearch;

        // An empty city means search all cities.
        const matchesCity =
            !citySearch ||
            office.city.toLowerCase().includes(citySearch);

        // && means both conditions must be true.
        return matchesSpecialty && matchesCity;
    });

    // Return matching offices as JSON.
    return res.json({
        status: "success",
        count: results.length,
        offices: results
    });
});

// FEATURE 5: GET ONE MEDICAL OFFICE
// GET /api/specialists/1
// :id is a route parameter containing the selected office ID.
router.get("/:id", (req, res) => {

    // Number() converts the URL text into a number.
    const officeId = Number(req.params.id);

    // Number.isInteger() checks for a whole number.
    // Reject missing, negative, and invalid office IDs.
    if (!Number.isInteger(officeId) || officeId <= 0) {
        return res.status(400).json({
            status: "error",
            message: "Invalid office ID."
        });
    }

    // find() returns the first office with a matching ID.
    const office = medicalOffices.find(
        (item) => item.id === officeId
    );

    // Return HTTP 404 when no office exists with that ID.
    if (!office) {
        return res.status(404).json({
            status: "error",
            message: "Medical office not found."
        });
    }

    // Return the selected office.
    return res.json({
        status: "success",
        office: office
    });
});

// Makes this router available to server.js.
module.exports = router;
