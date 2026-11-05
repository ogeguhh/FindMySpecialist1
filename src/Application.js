const express = require('express');
const session = require('express-session');
const path = require('path');
const UserRepository = require('./repositories/UserRepository');
const ProviderRepository = require('./repositories/ProviderRepository');
const AuthService = require('./services/AuthService');
const SymptomService = require('./services/SymptomService');
const MatchingService = require('./services/MatchingService');
const SpecialistService = require('./services/SpecialistService');
const BookingLinkService = require('./services/BookingLinkService');
const AuthController = require('./controllers/AuthController');
const IntakeController = require('./controllers/IntakeController');
const MatchController = require('./controllers/MatchController');
const ProviderController = require('./controllers/ProviderController');

class Application {
  constructor({ userRepository = new UserRepository() } = {}) {
    this.app = express();
    this.userRepository = userRepository;
    this.configure();
  }

  configure() {
    const app = this.app;
    if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
      throw new Error('SESSION_SECRET must be set in production.');
    }
    app.disable('x-powered-by');
    app.use(express.json({ limit: '20kb' }));
    app.use(session({
      secret: process.env.SESSION_SECRET || 'development-only-change-this-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 4
      }
    }));

    const auth = new AuthController(new AuthService(this.userRepository));
    const symptoms = new SymptomService();
    const intake = new IntakeController(symptoms);
    const match = new MatchController(new MatchingService(symptoms));
    const providers = new ProviderController(new SpecialistService(new ProviderRepository(), new BookingLinkService()));

    app.post('/api/auth/register', auth.register);
    app.post('/api/auth/login', auth.login);
    app.post('/api/auth/guest', auth.guest);
    app.get('/api/auth/me', auth.me);
    app.post('/api/auth/preferences', auth.save);
    app.post('/api/auth/logout', auth.logout);
    app.get('/api/symptoms', intake.search);
    app.post('/api/intake/symptoms', intake.submit);
    app.post('/api/match', match.match);
    app.get('/api/catalog', providers.catalog);
    app.get('/api/providers', providers.search);
    app.get('/api/providers/:id', providers.details);
    app.post('/api/providers/clear', providers.clear);
    app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

    app.use(express.static(path.join(__dirname, '../public')));
    app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));
    app.use((err, req, res, next) => {
      if (res.headersSent) return next(err);
      if (err.status === 400 || err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'The request body must contain valid JSON.' });
      }
      console.error('Unhandled request error:', err);
      return res.status(500).json({ message: 'An unexpected server error occurred.' });
    });
  }
}

module.exports = Application;
