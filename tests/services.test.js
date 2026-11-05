const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const SymptomService = require('../src/services/SymptomService');
const MatchingService = require('../src/services/MatchingService');
const SpecialistService = require('../src/services/SpecialistService');
const BookingLinkService = require('../src/services/BookingLinkService');
const ProviderRepository = require('../src/repositories/ProviderRepository');
const UserRepository = require('../src/repositories/UserRepository');
const AuthService = require('../src/services/AuthService');

const symptoms = new SymptomService();

test('symptom search finds supported options case-insensitively', () => {
  assert.deepEqual(symptoms.search('headache'), ['Frequent Headaches', 'Sudden Severe Headache']);
  assert.deepEqual(symptoms.search('KNEE'), ['Knee Pain']);
});

test('symptom validation requires 1 to 3 unique supported symptoms', () => {
  assert.equal(symptoms.validateSymptoms([]).status, 'Missing');
  assert.equal(symptoms.validateSymptoms(['Acne', 'Skin Rash', 'Knee Pain', 'Frequent Headaches']).valid, false);
  assert.equal(symptoms.validateSymptoms(['Acne', 'Acne']).status, 'Unsupported');
  assert.equal(symptoms.validateSymptoms(['Not Supported']).status, 'Unsupported');
  assert.equal(symptoms.validateSymptoms(['Acne']).status, 'Ready');
});

test('urgent symptoms prevent routine specialty matching', () => {
  const result = new MatchingService(symptoms).match(['Chest Pain']);
  assert.equal(result.status, 'Urgent');
  assert.equal(result.valid, false);
  assert.deepEqual(result.specialties, undefined);
});

test('supported symptoms match specialties alphabetically', () => {
  const result = new MatchingService(symptoms).match(['Skin Rash', 'Knee Pain', 'Acne']);
  assert.equal(result.status, 'Ready');
  assert.deepEqual(result.specialties, ['Dermatology', 'Orthopedics']);
});

test('synthetic providers are filtered and sorted by last name', () => {
  const service = new SpecialistService(new ProviderRepository(), new BookingLinkService());
  const results = service.search({
    specialty: 'Dermatology',
    zip: '55106',
    insuranceProvider: 'HealthPartners',
    insurancePlan: 'Medical Assistance',
    maxDistance: '10'
  });
  assert.deepEqual(results.map((provider) => provider.name), ['Dr. Amanda Brown', 'Dr. Emily Johnson']);
  assert.throws(() => service.search({ specialty: 'Dermatology', zip: '5510' }), /5-digit ZIP/);
  assert.throws(() => service.search({ specialty: 'Unknown', zip: '55106' }), /supported specialty/);
  assert.throws(() => service.search({
    specialty: 'Dermatology', zip: '55106', insuranceProvider: 'HealthPartners', insurancePlan: 'Invalid'
  }), /approved plan/);
  assert.equal(service.search({ specialty: 'Dermatology', zip: '90210' }).length, 0);
});

test('provider details expose no booking URL when one is unavailable', () => {
  const service = new SpecialistService(new ProviderRepository(), new BookingLinkService());
  assert.equal(service.details('p1').bookingUrl, null);
  assert.equal(service.details('missing'), null);
});

test('accounts use bcrypt hashes and retain validated preferences in SQLite', async (t) => {
  const repository = new UserRepository(':memory:');
  t.after(() => repository.close());
  const auth = new AuthService(repository);
  const user = await auth.register('Demo.User@example.com', 'correct horse');
  assert.equal(user.email, 'demo.user@example.com');
  assert.notEqual(user.passwordHash, 'correct horse');
  assert.equal((await auth.login('DEMO.USER@example.com', 'correct horse')).id, user.id);
  assert.deepEqual(auth.savePreferences(user.id, {
    zip: '55106',
    insuranceProvider: 'HealthPartners',
    insurancePlan: 'Medical Assistance'
  }), {
    zip: '55106',
    insuranceProvider: 'HealthPartners',
    insurancePlan: 'Medical Assistance'
  });
  assert.deepEqual(repository.findById(user.id).preferences, {
    zip: '55106',
    insuranceProvider: 'HealthPartners',
    insurancePlan: 'Medical Assistance'
  });
  await assert.rejects(auth.register('demo.user@example.com', 'another password'), { statusCode: 409 });
  await assert.rejects(auth.login('demo.user@example.com', 'incorrect password'), { statusCode: 401 });
  assert.throws(() => auth.savePreferences(user.id, { zip: '1234' }), /5-digit ZIP/);
});

test('only secure external HTTPS URLs are allowed for booking', () => {
  const service = new BookingLinkService();
  assert.equal(service.getBookingUrl('https://appointments.example.org/provider'), 'https://appointments.example.org/provider');
  assert.equal(service.getBookingUrl('http://appointments.example.org'), null);
  assert.equal(service.getBookingUrl('https://localhost/book'), null);
  assert.equal(service.getBookingUrl('https://user:pass@appointments.example.org'), null);
  assert.equal(service.getBookingUrl('https://[::1]/book'), null);
});

test('SQLite accounts and preferences persist after reopening the database', async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'findmyspecialist-'));
  const databaseFile = path.join(directory, 'accounts.sqlite');
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const firstRepository = new UserRepository(databaseFile);
  const auth = new AuthService(firstRepository);
  const user = await auth.register('persistent@example.com', 'secure passphrase');
  auth.savePreferences(user.id, { zip: '55106', insuranceProvider: '', insurancePlan: '' });
  firstRepository.close();

  const reopenedRepository = new UserRepository(databaseFile);
  t.after(() => reopenedRepository.close());
  assert.equal(reopenedRepository.findByEmail('persistent@example.com').id, user.id);
  assert.deepEqual(reopenedRepository.findById(user.id).preferences, {
    zip: '55106', insuranceProvider: '', insurancePlan: ''
  });
});
