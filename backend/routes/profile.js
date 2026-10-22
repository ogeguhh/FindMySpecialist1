const express = require("express");
const {
    requireAuthentication
} = require("./auth");
const supabase = require("../services/supabaseClient");
const validateSavedPreferences = require("../services/savedPreferences");

const router = express.Router();

function requestIsSameOrigin(req) {
    const origin = req.get("origin");
    if (!origin) {
        return false;
    }
    try {
        const parsedOrigin = new URL(origin);
        const secureOrigin =
            process.env.NODE_ENV !== "production" ||
            parsedOrigin.protocol === "https:";
        return parsedOrigin.host === req.get("host") && secureOrigin;
    } catch {
        return false;
    }
}

function sameOriginMutation(req, res, next) {
    if (!requestIsSameOrigin(req)) {
        return res.status(403).json({
            status: "error",
            message: "This profile request must come from this website."
        });
    }
    return next();
}

function sendProfileError(res, error) {
    if (error instanceof supabase.SupabaseConfigurationError) {
        return res.status(503).json({
            status: "error",
            message: "Account services are not configured on this server."
        });
    }
    if (error instanceof supabase.SupabaseRequestError) {
        return res.status(502).json({
            status: "error",
            message: "Saved preferences could not be loaded or updated."
        });
    }
    if (error.name === "TimeoutError" || error.name === "AbortError") {
        return res.status(504).json({
            status: "error",
            message: "The profile service timed out. Please try again."
        });
    }
    return res.status(502).json({
        status: "error",
        message: "The profile service is unavailable. Please try again."
    });
}

router.use(requireAuthentication);

router.get("/", async (req, res) => {
    try {
        const rows = await supabase.getPreferences(
            req.authenticatedUser.id,
            req.accessToken
        );
        return res.json({
            status: "success",
            email: req.authenticatedUser.email,
            profile: Array.isArray(rows) ? rows[0] || null : null
        });
    } catch (error) {
        return sendProfileError(res, error);
    }
});

router.put("/", sameOriginMutation, async (req, res) => {
    const result = validateSavedPreferences(req.body);
    if (result.message) {
        return res.status(400).json({
            status: "error",
            message: result.message
        });
    }

    try {
        const rows = await supabase.savePreferences(
            req.authenticatedUser.id,
            req.accessToken,
            result.preferences
        );
        return res.json({
            status: "success",
            message: "Preferences saved.",
            profile: Array.isArray(rows) ? rows[0] || null : null
        });
    } catch (error) {
        return sendProfileError(res, error);
    }
});

router.delete("/", sameOriginMutation, async (req, res) => {
    try {
        await supabase.deletePreferences(
            req.authenticatedUser.id,
            req.accessToken
        );
        return res.json({
            status: "success",
            message: "Saved preferences deleted."
        });
    } catch (error) {
        return sendProfileError(res, error);
    }
});

module.exports = router;
