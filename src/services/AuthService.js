const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const insuranceCatalog = require('../data/insuranceCatalog.json');
const User = require('../models/User');

function validationError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

class AuthService {
  constructor(repo) {
    this.repo = repo;
  }

  async register(email, password) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw validationError('Enter a valid email address.');
    }
    if (typeof password !== 'string' || password.length < 8) {
      throw validationError('Password must contain at least 8 characters.');
    }
    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw validationError('Password must be 72 bytes or fewer.');
    }
    if (this.repo.findByEmail(normalizedEmail)) {
      throw validationError('This email is already registered.', 409);
    }
    const user = new User({
      id: crypto.randomUUID(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 10)
    });
    try {
      this.repo.save(user);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw validationError('This email is already registered.', 409);
      }
      throw error;
    }
    return user;
  }

  async login(email, password) {
    const user = this.repo.findByEmail(String(email || '').trim().toLowerCase());
    if (!user || !(await bcrypt.compare(String(password || ''), user.passwordHash))) {
      throw validationError('Invalid email or password.', 401);
    }
    return user;
  }

  getUserById(id) {
    return this.repo.findById(id);
  }

  savePreferences(id, preferences = {}) {
    const user = this.repo.findById(id);
    if (!user) throw validationError('User not found.', 404);
    const {
      zip = '',
      insuranceProvider = '',
      insurancePlan = ''
    } = preferences;
    if (!/^\d{5}$/.test(String(zip))) throw validationError('Please enter a valid 5-digit ZIP code.');
    if (insuranceProvider && !insuranceCatalog[insuranceProvider]) {
      throw validationError('Select an approved demonstration insurance provider.');
    }
    if (insurancePlan && (!insuranceProvider || !insuranceCatalog[insuranceProvider].includes(insurancePlan))) {
      throw validationError('Select an approved plan for the chosen insurance provider.');
    }
    user.preferences = { zip: String(zip), insuranceProvider, insurancePlan };
    this.repo.save(user);
    return user.preferences;
  }
}

module.exports = AuthService;
