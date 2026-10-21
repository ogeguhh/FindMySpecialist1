
// SERVER.JS
// Starts our Express server and connects API routes.

const express = require("express");
const path = require("path");

// Import our specialty matching routes.
const matchingRoutes = require("./routes/matching");

const app = express();
const PORT = 3000;

// Allows Express to read incoming JSON request bodies.
app.use(express.json());

// Serves our HTML, CSS, and frontend JavaScript files.
app.use(express.static(path.join(__dirname, "../frontend")));

// Health endpoint used to check that our server works.
app.get("/api/health", (req, res) => {
    res.json({
        status: "success",
        message: "FindMySpecialist server is running!"
    });
});

// app.use() connects a router to a URL path.
// Requests to /api/match are handled by matching.js.
app.use("/api/match", matchingRoutes);

// Starts listening for incoming requests.
app.listen(PORT, () => {
    console.log(`FindMySpecialist running at http://localhost:${PORT}`);
});
