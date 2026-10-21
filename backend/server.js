
// SERVER.JS
// Starts our Express server and connects our application's API routes.

// require() imports packages that our backend needs.
const express = require("express");
const path = require("path");

// Import our Feature 3 specialty matching routes.
const matchingRoutes = require("./routes/matching");

// Import our Feature 4 specialist search routes.
// This gives server.js access to the search functionality.
const specialistRoutes = require("./routes/specialists");

// Create our Express application.
const app = express();

// The port number tells our server where to listen.
const PORT = 3000;

// app.use() adds functionality to our Express application.
// express.json() allows the server to read incoming JSON data.
app.use(express.json());

// express.static() makes our frontend files available in the browser.
// path.join() builds the correct folder path.
// __dirname refers to the folder containing this server.js file.
app.use(express.static(path.join(__dirname, "../frontend")));

// app.get() handles an HTTP GET request.
// req contains request information.
// res is used to send a response back to the browser.
app.get("/api/health", (req, res) => {

    // res.json() sends a JavaScript object as JSON.
    res.json({
        status: "success",
        message: "FindMySpecialist server is running!"
    });
});

// FEATURE 3: MATCH SPECIALTY
// Requests beginning with /api/match go to routes/matching.js.
app.use("/api/match", matchingRoutes);

// FEATURE 4: FIND SPECIALISTS
// Requests beginning with /api/specialists go to routes/specialists.js.
app.use("/api/specialists", specialistRoutes);

// app.listen() starts our server.
// The arrow function () => runs when the server starts.
// Template literals use backticks and ${} to insert variable values.
app.listen(PORT, () => {
    console.log(`FindMySpecialist running at http://localhost:${PORT}`);
});
