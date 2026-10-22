const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const app = require("../backend/server");

let server;
let baseUrl;
const originalSupabaseUrl = process.env.SUPABASE_URL;
const originalSupabaseAnonKey = process.env.SUPABASE_ANON_KEY;

before(async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    try {
        await new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    } finally {
        if (originalSupabaseUrl !== undefined) {
            process.env.SUPABASE_URL = originalSupabaseUrl;
        }
        if (originalSupabaseAnonKey !== undefined) {
            process.env.SUPABASE_ANON_KEY = originalSupabaseAnonKey;
        }
    }
});

function apiRequest(path, { method = "GET", body, headers = {} } = {}) {
    const serializedBody = body === undefined
        ? null
        : JSON.stringify(body);
    return new Promise((resolve, reject) => {
        const request = http.request(new URL(path, baseUrl), {
            method,
            agent: false,
            headers: {
                ...(serializedBody
                    ? {
                        "Content-Type": "application/json",
                        "Content-Length": Buffer.byteLength(serializedBody)
                    }
                    : {}),
                ...headers
            }
        }, (response) => {
            let responseText = "";
            response.setEncoding("utf8");
            response.on("data", (chunk) => {
                responseText += chunk;
            });
            response.on("end", () => {
                resolve({
                    status: response.statusCode,
                    data: responseText ? JSON.parse(responseText) : null
                });
            });
        });
        request.on("error", reject);
        if (serializedBody) {
            request.write(serializedBody);
        }
        request.end();
    });
}

test("matching API returns reasons and keeps urgent warnings dominant", async () => {
    const matchedResponse = await apiRequest("/api/match", {
        method: "POST",
        body: { selectedSymptoms: ["Back Pain"] }
    });
    const matched = matchedResponse.data;
    assert.equal(matched.status, "matched");
    assert.equal(matched.matches[0].specialty, "Orthopedics");
    assert.ok(matched.matches[0].reason);

    const urgentResponse = await apiRequest("/api/match", {
        method: "POST",
        body: { selectedSymptoms: ["Chest Pain", "Back Pain"] }
    });
    const urgent = urgentResponse.data;
    assert.equal(urgent.status, "urgent");
    assert.deepEqual(urgent.specialties, []);
});

test("provider search API filters using transient intake criteria", async () => {
    const response = await apiRequest("/api/specialists/search", {
        method: "POST",
        body: {
            specialties: ["Orthopedics"],
            ageGroup: "25-34",
            location: "Minneapolis",
            preferredLanguage: "English",
            appointmentType: "in-person",
            travelDistance: "5",
            insuranceProvider: "Blue Cross Blue Shield",
            insurancePlan: "Example Plan",
            accessibility: ""
        }
    });
    const result = response.data;
    assert.equal(response.status, 200);
    assert.equal(result.status, "success");
    assert.equal(result.offices.length, 1);
    assert.match(result.offices[0].insuranceCompatibility, /not verified/i);
    assert.equal(result.offices[0].websiteVerified, false);
});

test("provider search rejects invalid preference values", async () => {
    const response = await apiRequest("/api/specialists/search", {
        method: "POST",
        body: {
            specialties: ["Orthopedics"],
            ageGroup: "adult",
            location: "Minneapolis",
            preferredLanguage: "English",
            appointmentType: "in-person",
            travelDistance: "20"
        }
    });
    assert.equal(response.status, 400);
});

test("saved profiles are protected when there is no authenticated session", async () => {
    const response = await apiRequest("/api/profile");
    const result = response.data;
    assert.equal(response.status, 401);
    assert.match(result.message, /sign in/i);
});

test("account endpoints fail explicitly without configuration and reject cross-origin writes", async () => {
    const unavailableResponse = await apiRequest("/api/auth/login", {
        method: "POST",
        headers: { Origin: baseUrl },
        body: {
            email: "guest@example.test",
            password: "not-a-real-password"
        }
    });
    assert.equal(unavailableResponse.status, 503);

    const blockedResponse = await apiRequest("/api/auth/register", {
        method: "POST",
        headers: { Origin: "https://untrusted.example" },
        body: {
            email: "guest@example.test",
            password: "not-a-real-password"
        }
    });
    assert.equal(blockedResponse.status, 403);
});
