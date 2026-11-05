const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const User = require('../models/User');

class UserRepository {
  constructor(file = process.env.DATABASE_PATH || path.join(__dirname, '../../storage/findmyspecialist.sqlite')) {
    this.file = file;
    if (file !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
    this.database = new Database(file);
    if (file !== ':memory:') this.database.pragma('journal_mode = WAL');
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        preferences_json TEXT NOT NULL DEFAULT '{}'
      )
    `);
    this.findByEmailStatement = this.database.prepare('SELECT * FROM users WHERE email = ?');
    this.findByIdStatement = this.database.prepare('SELECT * FROM users WHERE id = ?');
    this.saveStatement = this.database.prepare(`
      INSERT INTO users (id, email, password_hash, preferences_json)
      VALUES (@id, @email, @passwordHash, @preferencesJson)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        password_hash = excluded.password_hash,
        preferences_json = excluded.preferences_json
    `);
    this.importLegacyUsers();
  }

  importLegacyUsers() {
    if (this.file === ':memory:') return;
    const legacyFile = path.join(__dirname, '../../storage/users.json');
    if (!fs.existsSync(legacyFile)) return;
    const legacyUsers = JSON.parse(fs.readFileSync(legacyFile, 'utf8'));
    if (!Array.isArray(legacyUsers)) throw new Error('Legacy user data must be a JSON array.');
    const insertLegacy = this.database.prepare(`
      INSERT INTO users (id, email, password_hash, preferences_json)
      VALUES (@id, @email, @passwordHash, @preferencesJson)
      ON CONFLICT(email) DO NOTHING
    `);
    const importUsers = this.database.transaction((users) => {
      for (const user of users) {
        if (!user?.id || !user.email || !user.passwordHash) {
          throw new Error('Legacy user data contains an incomplete account record.');
        }
        insertLegacy.run({
          id: user.id,
          email: String(user.email).toLowerCase(),
          passwordHash: user.passwordHash,
          preferencesJson: JSON.stringify(user.preferences || {})
        });
      }
    });
    importUsers(legacyUsers);
  }

  toUser(record) {
    if (!record) return null;
    return new User({
      id: record.id,
      email: record.email,
      passwordHash: record.password_hash,
      preferences: JSON.parse(record.preferences_json)
    });
  }

  findByEmail(email) {
    return this.toUser(this.findByEmailStatement.get(email.toLowerCase()));
  }

  findById(id) {
    return this.toUser(this.findByIdStatement.get(id));
  }

  save(user) {
    this.saveStatement.run({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      preferencesJson: JSON.stringify(user.preferences || {})
    });
    return user;
  }

  close() {
    this.database.close();
  }
}

module.exports = UserRepository;
