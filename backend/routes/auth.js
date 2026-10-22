const express = require("express");
const supabase = require("../services/supabaseClient");

const router = express.Router();
const ACCESS_COOKIE = "fms_access";
const REFRESH_COOKIE = "fms_refresh";
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;

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

function rejectCrossOrigin(req, res, next) {
    if (!requestIsSameOrigin(req)) {
        return res.status(403).json({
            status: "error",
            message: "This account request must come from this website."
        });
    }
    return next();
}

function cookieHeader(name, value, maxAge) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; ` +
        `SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function setSessionCookies(res, session) {
    const accessMaxAge = Math.max(
        60,
        Number(session.expires_in) || 3600
    );
    res.append("Set-Cookie", cookieHeader(
        ACCESS_COOKIE,
        session.access_token,
        accessMaxAge
    ));
    res.append("Set-Cookie", cookieHeader(
        REFRESH_COOKIE,
        session.refresh_token,
        REFRESH_MAX_AGE
    ));
}

function readCookie(req, name) {
    const cookieHeaderValue = req.get("cookie") || "";
    const value = cookieHeaderValue
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${name}=`))
        ?.slice(name.length + 1);
    if (!value) {
        return null;
    }
    try {
        return decodeURIComponent(value);
    } catch {
        return null;
    }
}

function clearSessionCookies(res) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
        res.append(
            "Set-Cookie",
            `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
        );
    }
}

function sendUpstreamError(res, error, operation) {
    if (error instanceof supabase.SupabaseConfigurationError) {
        return res.status(503).json({
            status: "error",
            message: "Account services are not configured on this server."
        });
    }
    if (error instanceof supabase.SupabaseRequestError) {
        if (operation === "authenticate" &&
            [400, 401].includes(error.status)) {
            clearSessionCookies(res);
            return res.status(401).json({
                status: "error",
                message: "Your session expired. Please sign in again."
            });
        }
        if (operation === "logout") {
            return res.status(502).json({
                status: "error",
                message:
                    "Local sign-out completed, but the authentication service " +
                    "could not confirm remote sign-out."
            });
        }
        if ((operation === "login" && [400, 401].includes(error.status)) ||
            (operation === "register" && [400, 422].includes(error.status))) {
            return res.status(operation === "register" ? 400 : 401).json({
                status: "error",
                message: operation === "register"
                    ? "The account could not be created. Check the email and password requirements."
                    : "Email or password was not accepted."
            });
        }
        return res.status(502).json({
            status: "error",
            message: "The account provider could not complete the request."
        });
    }
    if (error.name === "TimeoutError" || error.name === "AbortError") {
        return res.status(504).json({
            status: "error",
            message: "The account provider timed out. Please try again."
        });
    }
    return res.status(502).json({
        status: "error",
        message: "The account provider is unavailable. Please try again."
    });
}

function validCredentials(body) {
    return body &&
        typeof body.email === "string" &&
        body.email.trim().length <= 254 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) &&
        typeof body.password === "string" &&
        body.password.length >= 8 &&
        body.password.length <= 128;
}

router.post("/register", rejectCrossOrigin, async (req, res) => {
    const body = req.body || {};
    if (!validCredentials(body)) {
        return res.status(400).json({
            status: "error",
            message:
                "Enter a valid email and a password between 8 and 128 characters."
        });
    }

    try {
        const session = await supabase.signUp(
            body.email.trim(),
            body.password
        );
        if (session?.access_token && session?.refresh_token) {
            setSessionCookies(res, session);
            return res.status(201).json({
                status: "success",
                message: "Account created."
            });
        }
        return res.status(202).json({
            status: "confirmation_required",
            message: "Check your email to confirm the account, then sign in."
        });
    } catch (error) {
        return sendUpstreamError(res, error, "register");
    }
});

router.post("/login", rejectCrossOrigin, async (req, res) => {
    const body = req.body || {};
    if (!validCredentials(body)) {
        return res.status(400).json({
            status: "error",
            message: "Enter a valid email and password."
        });
    }

    try {
        const session = await supabase.signIn(
            body.email.trim(),
            body.password
        );
        if (!session?.access_token || !session?.refresh_token) {
            return res.status(502).json({
                status: "error",
                message: "The account provider returned an incomplete session."
            });
        }
        setSessionCookies(res, session);
        return res.json({ status: "success", message: "Signed in." });
    } catch (error) {
        return sendUpstreamError(res, error, "login");
    }
});

router.post("/logout", rejectCrossOrigin, async (req, res) => {
    const accessToken = readCookie(req, ACCESS_COOKIE);
    try {
        if (accessToken) {
            await supabase.signOut(accessToken);
        }
        clearSessionCookies(res);
        return res.json({ status: "success", message: "Signed out." });
    } catch (error) {
        clearSessionCookies(res);
        return sendUpstreamError(res, error, "logout");
    }
});

async function requireAuthentication(req, res, next) {
    const accessToken = readCookie(req, ACCESS_COOKIE);
    const refreshToken = readCookie(req, REFRESH_COOKIE);
    if (!accessToken && !refreshToken) {
        return res.status(401).json({
            status: "error",
            message: "Please sign in to access saved preferences."
        });
    }

    try {
        let session;
        let user;
        if (accessToken) {
            try {
                user = await supabase.getUser(accessToken);
            } catch (error) {
                if (!(error instanceof supabase.SupabaseRequestError) ||
                    error.status >= 500) {
                    throw error;
                }
            }
        }

        if (!user && refreshToken) {
            session = await supabase.refreshSession(refreshToken);
            if (session?.access_token && session?.refresh_token) {
                user = session.user || await supabase.getUser(session.access_token);
                setSessionCookies(res, session);
            }
        }

        if (!user?.id) {
            clearSessionCookies(res);
            return res.status(401).json({
                status: "error",
                message: "Your session expired. Please sign in again."
            });
        }

        req.authenticatedUser = user;
        req.accessToken = session?.access_token || accessToken;
        return next();
    } catch (error) {
        return sendUpstreamError(res, error, "authenticate");
    }
}

module.exports = {
    requireAuthentication,
    router
};
