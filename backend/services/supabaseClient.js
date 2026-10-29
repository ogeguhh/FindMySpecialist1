class SupabaseConfigurationError extends Error {}

class SupabaseRequestError extends Error {
    constructor(status) {
        super("Supabase request failed.");
        this.status = status;
    }
}

function configuration() {
    const baseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (!baseUrl || !anonKey) {
        throw new SupabaseConfigurationError(
            "SUPABASE_URL and SUPABASE_ANON_KEY are required."
        );
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(baseUrl);
    } catch {
        throw new SupabaseConfigurationError("SUPABASE_URL is invalid.");
    }
    if (parsedUrl.protocol !== "https:" &&
        !["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
        throw new SupabaseConfigurationError(
            "SUPABASE_URL must use HTTPS outside local development."
        );
    }

    return {
        baseUrl: parsedUrl.origin,
        anonKey
    };
}

async function request(path, { method = "GET", body, accessToken, prefer } = {}) {
    const { baseUrl, anonKey } = configuration();
    const headers = {
        apikey: anonKey,
        Accept: "application/json"
    };
    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }
    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    }
    if (prefer) {
        headers.Prefer = prefer;
    }

    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(10000)
    });
    const responseText = await response.text();
    let responseData = null;
    if (responseText) {
        try {
            responseData = JSON.parse(responseText);
        } catch {
            throw new SupabaseRequestError(response.status);
        }
    }
    if (!response.ok) {
        throw new SupabaseRequestError(response.status);
    }
    return responseData;
}

function authRequest(path, options) {
    return request(`/auth/v1/${path}`, options);
}

function signUp(email, password) {
    return authRequest("signup", {
        method: "POST",
        body: { email, password }
    });
}

function signIn(email, password) {
    return authRequest("token?grant_type=password", {
        method: "POST",
        body: { email, password }
    });
}

function refreshSession(refreshToken) {
    return authRequest("token?grant_type=refresh_token", {
        method: "POST",
        body: { refresh_token: refreshToken }
    });
}

function getUser(accessToken) {
    return authRequest("user", { accessToken });
}

function signOut(accessToken) {
    return authRequest("logout", {
        method: "POST",
        accessToken
    });
}

function getPreferences(userId, accessToken) {
    const query = new URLSearchParams({
        select:
            "age_group,location,insurance_provider,insurance_plan," +
            "preferred_language,appointment_type,travel_distance," +
            "accessibility,transportation,consent_at",
        user_id: `eq.${userId}`,
        limit: "1"
    });
    return request(`/rest/v1/user_preferences?${query}`, { accessToken });
}

function savePreferences(userId, accessToken, preferences) {
    return request("/rest/v1/user_preferences?on_conflict=user_id", {
        method: "POST",
        accessToken,
        prefer: "resolution=merge-duplicates,return=representation",
        body: {
            user_id: userId,
            ...preferences,
            consent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    });
}

function deletePreferences(userId, accessToken) {
    const query = new URLSearchParams({ user_id: `eq.${userId}` });
    return request(`/rest/v1/user_preferences?${query}`, {
        method: "DELETE",
        accessToken,
        prefer: "return=minimal"
    });
}

module.exports = {
    SupabaseConfigurationError,
    SupabaseRequestError,
    deletePreferences,
    getPreferences,
    getUser,
    refreshSession,
    savePreferences,
    signIn,
    signOut,
    signUp
};
