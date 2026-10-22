const authForm = document.getElementById("auth-form");
const accountMessage = document.getElementById("account-message");
const accountEmail = document.getElementById("account-email");
const accountPassword = document.getElementById("account-password");
const preferencesPanel = document.getElementById("preferences-panel");
const preferencesForm = document.getElementById("preferences-form");
const preferencesMessage = document.getElementById("preferences-message");
const accountEmailLabel = document.getElementById("account-email-label");
const deletePreferencesButton = document.getElementById("delete-preferences");
const signOutButton = document.getElementById("sign-out");

async function requestJson(url, options = {}) {
    const response = await fetch(url, {
        credentials: "same-origin",
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        }
    });
    let data;
    try {
        data = await response.json();
    } catch {
        throw new Error("The server returned an unexpected response.");
    }
    if (!response.ok) {
        throw new Error(data.message || "The request could not be completed.");
    }
    return data;
}

function showProfile(email, profile) {
    preferencesPanel.hidden = false;
    authForm.hidden = true;
    accountEmailLabel.textContent = email ? `Signed in as ${email}` : "";
    if (!profile) {
        preferencesMessage.textContent =
            "No preferences are currently saved to this account.";
        return;
    }

    const values = {
        ageGroup: profile.age_group,
        location: profile.location,
        insuranceProvider: profile.insurance_provider || "",
        insurancePlan: profile.insurance_plan || "",
        preferredLanguage: profile.preferred_language,
        travelDistance: String(profile.travel_distance),
        accessibility: profile.accessibility || "",
        transportation: profile.transportation || ""
    };
    for (const [name, value] of Object.entries(values)) {
        if (name === "appointmentType") {
            for (const option of preferencesForm.querySelectorAll(
                'input[name="appointmentType"]'
            )) {
                option.checked = option.value === value;
            }
            continue;
        }
        const field = preferencesForm.elements.namedItem(name);
        if (field) {
            field.value = value;
        }
    }
    preferencesMessage.textContent =
        "Saved non-symptom preferences are loaded. Review and edit them as needed.";
}

async function loadProfile() {
    try {
        const data = await requestJson("/api/profile");
        showProfile(data.email, data.profile);
    } catch (error) {
        if (!error.message.includes("sign in")) {
            accountMessage.textContent = error.message;
        }
    }
}

authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const action = event.submitter?.value;
    const endpoint = action === "register"
        ? "/api/auth/register"
        : "/api/auth/login";
    accountMessage.textContent = "Connecting to account service...";

    try {
        const data = await requestJson(endpoint, {
            method: "POST",
            body: JSON.stringify({
                email: accountEmail.value.trim(),
                password: accountPassword.value
            })
        });
        accountMessage.textContent = data.message;
        accountPassword.value = "";
        if (data.status === "success") {
            await loadProfile();
        }
    } catch (error) {
        accountMessage.textContent = error.message;
    }
});

preferencesForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(preferencesForm).entries());
    values.savePreferences = document.getElementById("save-consent").checked;
    preferencesMessage.textContent = "Saving preferences...";

    try {
        const data = await requestJson("/api/profile", {
            method: "PUT",
            body: JSON.stringify(values)
        });
        preferencesMessage.textContent = data.message;
    } catch (error) {
        preferencesMessage.textContent = error.message;
    }
});

deletePreferencesButton.addEventListener("click", async () => {
    if (!window.confirm("Delete all saved matching preferences from this account?")) {
        return;
    }
    preferencesMessage.textContent = "Deleting saved preferences...";
    try {
        const data = await requestJson("/api/profile", { method: "DELETE" });
        preferencesForm.reset();
        preferencesMessage.textContent = data.message;
    } catch (error) {
        preferencesMessage.textContent = error.message;
    }
});

signOutButton.addEventListener("click", async () => {
    accountMessage.textContent = "Signing out...";
    try {
        const data = await requestJson("/api/auth/logout", {
            method: "POST",
            body: "{}"
        });
        preferencesForm.reset();
        preferencesPanel.hidden = true;
        authForm.hidden = false;
        accountMessage.textContent = data.message;
    } catch (error) {
        accountMessage.textContent = error.message;
    }
});

loadProfile();
