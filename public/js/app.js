// The frontend deliberately uses vanilla JavaScript; all business rules live in the API.
const $ = (id) => document.getElementById(id);
const STORAGE_KEYS = { symptoms: 'fms.symptoms', specialties: 'fms.specialties', filters: 'fms.filters' };

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('The server returned an unreadable response. Please try again.');
  }
  if (!response.ok) throw new Error(data.message || 'The request could not be completed.');
  return data;
}

const post = (url, body) => api(url, { method: 'POST', body: JSON.stringify(body) });
const getStored = (key, fallback) => {
  try { return JSON.parse(sessionStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const setStored = (key, value) => sessionStorage.setItem(key, JSON.stringify(value));
const clearIntake = () => Object.values(STORAGE_KEYS).forEach((key) => sessionStorage.removeItem(key));

function showMessage(text, type = '') {
  const target = $('message');
  if (!target) return;
  target.textContent = text;
  target.className = text ? `form-message notice ${type}` : 'form-message';
}

function setBusy(button, busy, label) {
  if (!button) return;
  if (busy) {
    button.dataset.originalLabel = button.textContent;
    button.textContent = label;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalLabel || button.textContent;
    button.disabled = false;
  }
}

function fieldValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function hydrateAccountNav() {
  const summary = $('accountSummary');
  if (!summary) return null;
  try {
    const account = await api('/api/auth/me');
    if (account.accessType === 'None') {
      clearIntake();
      return account;
    }
    document.querySelectorAll('.nav-login, .account-nav > .button:not(.logout-button)').forEach((link) => { link.hidden = true; });
    summary.textContent = account.accessType === 'Login' ? account.email : 'Guest session';
    summary.hidden = false;
    $('logoutButton').hidden = false;
    return account;
  } catch {
    summary.textContent = 'Account status unavailable';
    summary.hidden = false;
    return null;
  }
}

async function endSession() {
  const button = $('logoutButton');
  setBusy(button, true, 'Ending session…');
  try {
    await post('/api/auth/logout', {});
    sessionStorage.clear();
    window.location.assign('/index.html');
  } catch (error) {
    setBusy(button, false);
    showMessage(error.message, 'error');
  }
}

const accountReady = hydrateAccountNav();
if ($('logoutButton')) $('logoutButton').addEventListener('click', endSession);

if ($('guest')) {
  $('guest').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    setBusy(button, true, 'Starting guest session…');
    try {
      await post('/api/auth/guest', {});
      sessionStorage.clear();
      window.location.assign('/intake.html');
    } catch (error) {
      setBusy(button, false);
      showMessage(error.message, 'error');
    }
  });
}

if ($('loginForm')) {
  $('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('');
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]');
    setBusy(button, true, 'Logging in…');
    try {
      await post('/api/auth/login', fieldValues(form));
      sessionStorage.clear();
      window.location.assign('/intake.html');
    } catch (error) {
      setBusy(button, false);
      showMessage(error.message, 'error');
    }
  });
}

if ($('signupForm')) {
  $('signupForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('');
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]');
    setBusy(button, true, 'Creating account…');
    try {
      const result = await post('/api/auth/register', fieldValues(form));
      setBusy(button, false);
      form.reset();
      showMessage(`${result.message} You can log in now.`, 'success');
    } catch (error) {
      setBusy(button, false);
      showMessage(error.message, 'error');
    }
  });
}

if ($('symptomChoices')) {
  const choices = $('symptomChoices');
  const selectedRoot = $('selectedSymptoms');
  let selected = [];

  function renderSelected() {
    $('selectedCount').textContent = `${selected.length} of 3`;
    selectedRoot.replaceChildren();
    if (!selected.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-hint';
      empty.textContent = 'Your selected symptoms will appear here.';
      selectedRoot.append(empty);
      return;
    }
    selected.forEach((symptom) => {
      const chip = document.createElement('span');
      chip.className = 'selected-chip';
      const name = document.createElement('span');
      name.textContent = symptom;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove-symptom';
      remove.setAttribute('aria-label', `Remove ${symptom}`);
      remove.textContent = '×';
      remove.addEventListener('click', () => updateSelection(symptom, false));
      chip.append(name, remove);
      selectedRoot.append(chip);
    });
  }

  function updateSelection(symptom, isSelected) {
    if (isSelected && selected.length >= 3) {
      showMessage('You can select a maximum of three symptoms. Remove one to choose another.', 'error');
      const input = [...choices.querySelectorAll('input[type="checkbox"]')].find((item) => item.value === symptom);
      if (input) input.checked = false;
      return;
    }
    selected = isSelected ? [...selected, symptom] : selected.filter((item) => item !== symptom);
    setStored(STORAGE_KEYS.symptoms, selected);
    showMessage('');
    accountReady.then(() => {
      selected = getStored(STORAGE_KEYS.symptoms, []);
      if (!Array.isArray(selected)) selected = [];
      renderSelected();
      return renderChoices();
    });
  }

  async function renderChoices() {
    choices.replaceChildren();
    const loading = document.createElement('p');
    loading.className = 'loading-state';
    loading.textContent = 'Loading supported symptoms…';
    choices.append(loading);
    try {
      const query = $('symptomSearch').value.trim();
      const { symptoms } = await api(`/api/symptoms?q=${encodeURIComponent(query)}`);
      choices.replaceChildren();
      if (!symptoms.length) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'No supported symptoms match that search. Try another name.';
        choices.append(empty);
        return;
      }
      symptoms.forEach((symptom, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'symptom-option';
        const input = document.createElement('input');
        const id = `symptom-${index}`;
        input.type = 'checkbox';
        input.id = id;
        input.value = symptom;
        input.checked = selected.includes(symptom);
        input.disabled = !input.checked && selected.length >= 3;
        input.addEventListener('change', () => updateSelection(symptom, input.checked));
        const label = document.createElement('label');
        label.htmlFor = id;
        label.textContent = symptom;
        wrapper.append(input, label);
        choices.append(wrapper);
      });
    } catch (error) {
      choices.replaceChildren();
      const failure = document.createElement('p');
      failure.className = 'notice error';
      failure.textContent = error.message;
      choices.append(failure);
    }
  }

  let searchTimer;
  $('symptomSearch').addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(renderChoices, 120);
  });
  renderSelected();
  renderChoices();
  $('submitSymptoms').addEventListener('click', async (event) => {
    showMessage('');
    const button = event.currentTarget;
    setBusy(button, true, 'Checking symptoms…');
    try {
      const result = await post('/api/intake/symptoms', { symptoms: selected });
      if (result.status === 'Urgent') {
        showMessage(result.message, 'urgent');
        setBusy(button, false);
        return;
      }
      if (result.status !== 'Ready') {
        showMessage(result.message || 'Please review your symptom selections.', 'error');
        setBusy(button, false);
        return;
      }
      setStored(STORAGE_KEYS.symptoms, selected);
      window.location.assign('/match.html');
    } catch (error) {
      setBusy(button, false);
      showMessage(error.message, 'error');
    }
  });
}

if ($('runMatch')) {
  $('runMatch').addEventListener('click', async (event) => {
    showMessage('');
    const button = event.currentTarget;
    setBusy(button, true, 'Evaluating…');
    $('matches').replaceChildren();
    $('matchSummary').hidden = true;
    try {
      await accountReady;
      const result = await post('/api/match', { symptoms: getStored(STORAGE_KEYS.symptoms, []) });
      if (result.status === 'Urgent') {
        showMessage(result.message, 'urgent');
        setBusy(button, false);
        return;
      }
      if (result.status !== 'Ready') {
        showMessage(result.message || 'Select supported symptoms before matching.', 'error');
        setBusy(button, false);
        return;
      }
      const summary = $('matchSummary');
      summary.textContent = `Evaluated symptoms: ${result.symptoms ? result.symptoms.join(', ') : getStored(STORAGE_KEYS.symptoms, []).join(', ')}`;
      summary.hidden = false;
      const root = $('matches');
      if (result.matchStatus === 'No Match' || !result.specialties?.length) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'No specialty matches were found for these symptoms. You can update your selection and try again.';
        root.append(empty);
        setBusy(button, false);
        return;
      }
      const sorted = [...result.specialties].sort((a, b) => a.localeCompare(b));
      setStored(STORAGE_KEYS.specialties, sorted);
      sorted.forEach((specialty) => {
        const card = document.createElement('article');
        card.className = 'specialty-card';
        const heading = document.createElement('h2');
        heading.textContent = specialty;
        const detail = document.createElement('p');
        detail.textContent = 'Suggested specialty category based on predefined demo rules.';
        card.append(heading, detail);
        root.append(card);
      });
      const action = document.createElement('a');
      action.className = 'button';
      action.href = '/specialists.html';
      action.textContent = 'Find demo providers';
      root.append(action);
      setBusy(button, false);
    } catch (error) {
      setBusy(button, false);
      showMessage(error.message, error.message.toLowerCase().includes('emergency') ? 'urgent' : 'error');
    }
  });
}

if ($('searchForm')) {
  const form = $('searchForm');
  const resultRoot = $('results');
  let catalog = {};
  let pendingFilters = null;

  function fillSelect(select, items, placeholder) {
    select.replaceChildren();
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = placeholder;
    select.append(empty);
    items.forEach((item) => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      select.append(option);
    });
  }

  function updatePlans(selectedPlan = '') {
    const provider = $('insuranceProvider').value;
    fillSelect($('insurancePlan'), catalog[provider] || [], 'Any plan');
    $('insurancePlan').value = selectedPlan;
  }

  function showResultsEmpty(text, count = '') {
    resultRoot.replaceChildren();
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = text;
    resultRoot.append(empty);
    $('resultsCount').textContent = count;
  }

  async function searchProviders() {
    showMessage('');
    if (!form.reportValidity()) return;
    const button = $('searchButton');
    setBusy(button, true, 'Searching…');
    resultRoot.replaceChildren();
    const loading = document.createElement('p');
    loading.className = 'loading-state';
    loading.textContent = 'Searching demo providers…';
    resultRoot.append(loading);
    try {
      const filters = fieldValues(form);
      const response = await api(`/api/providers?${new URLSearchParams(filters)}`);
      setStored(STORAGE_KEYS.filters, filters);
      resultRoot.replaceChildren();
      const disclaimer = document.createElement('p');
      disclaimer.className = 'disclaimer';
      disclaimer.textContent = response.disclaimer;
      resultRoot.append(disclaimer);
      $('resultsCount').textContent = `${response.results.length} ${response.results.length === 1 ? 'provider' : 'providers'}`;
      if (!response.results.length) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'No demo providers match these filters. Try another specialty, ZIP code, insurance option, or distance.';
        resultRoot.append(empty);
        setBusy(button, false);
        return;
      }
      response.results.forEach((provider) => {
        const article = document.createElement('article');
        article.className = 'provider-card';
        const information = document.createElement('div');
        const heading = document.createElement('h3');
        heading.textContent = provider.name;
        const specialty = document.createElement('p');
        specialty.textContent = provider.specialty;
        const clinic = document.createElement('p');
        clinic.textContent = provider.clinic;
        const location = document.createElement('p');
        location.textContent = provider.location;
        const link = document.createElement('a');
        link.className = 'text-link';
        link.href = `/details.html?id=${encodeURIComponent(provider.id)}`;
        link.textContent = 'View provider details →';
        information.append(heading, specialty, clinic, location, link);
        const meta = document.createElement('div');
        meta.className = 'provider-meta';
        const badge = document.createElement('span');
        badge.className = 'demo-badge';
        badge.textContent = 'Demo provider';
        const distance = document.createElement('p');
        distance.className = 'distance-label';
        distance.textContent = `${provider.distanceMiles} miles`;
        meta.append(badge, distance);
        article.append(information, meta);
        resultRoot.append(article);
      });
    } catch (error) {
      showResultsEmpty(error.message);
      showMessage(error.message, 'error');
    } finally {
      setBusy(button, false);
    }
  }

  $('insuranceProvider').addEventListener('change', () => updatePlans());
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    searchProviders();
  });
  $('cancelSearch').addEventListener('click', async () => {
    showMessage('');
    const button = $('cancelSearch');
    setBusy(button, true, 'Clearing…');
    try {
      await post('/api/providers/clear', {});
      sessionStorage.removeItem(STORAGE_KEYS.filters);
      form.reset();
      updatePlans();
      showResultsEmpty('Enter your search filters to explore demo providers.');
      showMessage('Search filters cleared. Your account or guest session is still active.', 'success');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setBusy(button, false);
    }
  });
  $('savePrefs').addEventListener('click', async (event) => {
    showMessage('');
    const button = event.currentTarget;
    if (!/^\d{5}$/.test($('zip').value)) {
      showMessage('Enter a valid 5-digit ZIP code before saving preferences.', 'error');
      $('zip').focus();
      return;
    }
    setBusy(button, true, 'Saving…');
    try {
      const { zip, insuranceProvider, insurancePlan } = fieldValues(form);
      await post('/api/auth/preferences', { zip, insuranceProvider, insurancePlan });
      showMessage('Your search preferences have been saved to your account.', 'success');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setBusy(button, false);
    }
  });

  (async () => {
    try {
      const account = await accountReady;
      pendingFilters = getStored(STORAGE_KEYS.filters, null);
      const catalogResponse = await api('/api/catalog');
      catalog = catalogResponse.insuranceCatalog;
      fillSelect($('specialty'), catalogResponse.specialties, 'Choose a specialty');
      fillSelect($('insuranceProvider'), Object.keys(catalog).sort(), 'Any provider');
      const preferences = account.preferences || {};
      if (preferences.zip) $('zip').value = preferences.zip;
      if (preferences.insuranceProvider && catalog[preferences.insuranceProvider]) $('insuranceProvider').value = preferences.insuranceProvider;
      updatePlans(preferences.insurancePlan || '');
      if (pendingFilters && typeof pendingFilters === 'object') {
        for (const [key, value] of Object.entries(pendingFilters)) {
          const field = form.elements.namedItem(key);
          if (field && key !== 'insurancePlan') field.value = value;
        }
        updatePlans(pendingFilters.insurancePlan || '');
      }
      if (pendingFilters) await searchProviders();
    } catch (error) {
      showMessage(error.message, 'error');
      showResultsEmpty('Search filters could not be loaded. Please refresh the page and try again.');
    }
  })();
}

if ($('providerDetails')) {
  const params = new URLSearchParams(window.location.search);
  const providerId = params.get('id');
  const filters = getStored(STORAGE_KEYS.filters, null);
  if (filters) {
    const query = new URLSearchParams(filters);
    $('backToResults').href = `/specialists.html?${query}`;
    $('resultsBreadcrumb').href = `/specialists.html?${query}`;
  }
  (async () => {
    if (!providerId) {
      $('providerDetails').replaceChildren();
      showMessage('Choose a provider from the search results to view details.', 'error');
      return;
    }
    try {
      const { provider } = await api(`/api/providers/${encodeURIComponent(providerId)}`);
      $('detailTitle').textContent = provider.name || 'Provider details';
      const root = $('providerDetails');
      root.replaceChildren();
      const fields = [
        ['Provider', provider.name],
        ['Specialty', provider.specialty],
        ['Clinic', provider.clinic],
        ['Location', provider.location]
      ].filter(([, value]) => typeof value === 'string' && value.trim());
      const grid = document.createElement('dl');
      grid.className = 'detail-grid';
      fields.forEach(([label, value]) => {
        const item = document.createElement('div');
        item.className = 'detail-item';
        const term = document.createElement('dt');
        term.textContent = label;
        const description = document.createElement('dd');
        description.textContent = value;
        item.append(term, description);
        grid.append(item);
      });
      root.append(grid);
      const demoNotice = document.createElement('p');
      demoNotice.className = 'disclaimer';
      demoNotice.textContent = 'Demo provider. This synthetic listing is not a real healthcare provider.';
      root.append(demoNotice);
      if (provider.bookingUrl) {
        const link = document.createElement('a');
        link.className = 'button booking-link';
        link.href = provider.bookingUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Book appointment on provider website';
        root.append(link);
      } else {
        const unavailable = document.createElement('p');
        unavailable.className = 'booking-unavailable';
        unavailable.textContent = 'Online booking is unavailable for this provider.';
        root.append(unavailable);
      }
    } catch (error) {
      $('providerDetails').replaceChildren();
      showMessage(error.message, 'error');
    }
  })();
}
