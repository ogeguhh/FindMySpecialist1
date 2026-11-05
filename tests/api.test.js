const test = require('node:test');
const assert = require('node:assert/strict');
const Application = require('../src/Application');
const UserRepository = require('../src/repositories/UserRepository');

test('Express pages and API support the complete guest and account journeys', async (t) => {
  const userRepository = new UserRepository(':memory:');
  const server = new Application({ userRepository }).app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    userRepository.close();
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  async function request(url, method = 'GET', body) {
    const response = await fetch(`${baseUrl}${url}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(cookie ? { Cookie: cookie } : {})
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const contentType = response.headers.get('content-type') || '';
    return {
      response,
      data: contentType.includes('application/json') ? await response.json() : await response.text()
    };
  }

  for (const page of ['/', '/index.html', '/login.html', '/signup.html', '/intake.html', '/match.html', '/specialists.html', '/details.html']) {
    const { response, data } = await request(page);
    assert.equal(response.status, 200, `${page} should load`);
    assert.match(data, /<main[\s>]/, `${page} should have meaningful page content`);
  }

  let result = await request('/api/auth/guest', 'POST', {});
  assert.equal(result.data.accessType, 'Guest');
  result = await request('/api/auth/me');
  assert.equal(result.data.accessType, 'Guest');

  result = await request('/api/intake/symptoms', 'POST', { symptoms: ['Chest Pain'] });
  assert.equal(result.data.status, 'Urgent');
  result = await request('/api/match', 'POST', { symptoms: ['Chest Pain'] });
  assert.equal(result.data.status, 'Urgent');
  result = await request('/api/intake/symptoms', 'POST', { symptoms: ['Skin Rash', 'Acne'] });
  assert.equal(result.data.status, 'Ready');
  result = await request('/api/match', 'POST', { symptoms: ['Skin Rash', 'Acne'] });
  assert.deepEqual(result.data.specialties, ['Dermatology']);

  result = await request('/api/catalog');
  assert.deepEqual(result.data.specialties, ['Dermatology', 'Neurology', 'Orthopedics']);
  result = await request('/api/providers?specialty=Dermatology&zip=55106&insuranceProvider=HealthPartners&insurancePlan=Medical%20Assistance&maxDistance=10');
  assert.deepEqual(result.data.results.map((provider) => provider.name), ['Dr. Amanda Brown', 'Dr. Emily Johnson']);
  result = await request('/api/providers?specialty=Dermatology&zip=12');
  assert.equal(result.response.status, 400);
  result = await request('/api/providers/p1');
  assert.equal(result.data.provider.bookingUrl, null);
  assert.equal(result.data.message, 'Online booking is unavailable for this provider.');

  result = await request('/api/auth/register', 'POST', { email: 'capstone@example.com', password: 'secure passphrase' });
  assert.equal(result.response.status, 201);
  result = await request('/api/auth/login', 'POST', { email: 'capstone@example.com', password: 'secure passphrase' });
  assert.equal(result.data.accessType, 'Login');
  result = await request('/api/auth/me');
  assert.equal(result.data.accessType, 'Login');
  assert.deepEqual(result.data.intake, {});
  result = await request('/api/auth/preferences', 'POST', {
    zip: '55106', insuranceProvider: 'HealthPartners', insurancePlan: 'Medical Assistance'
  });
  assert.deepEqual(result.data.preferences, {
    zip: '55106', insuranceProvider: 'HealthPartners', insurancePlan: 'Medical Assistance'
  });
  result = await request('/api/auth/logout', 'POST', {});
  assert.equal(result.response.status, 200);
  result = await request('/api/auth/me');
  assert.equal(result.data.accessType, 'None');
});
