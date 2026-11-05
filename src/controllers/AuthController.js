class AuthController {
  constructor(service) {
    this.service = service;
  }

  register = async (req, res, next) => {
    try {
      await this.service.register(req.body?.email, req.body?.password);
      return res.status(201).json({ message: 'Account created successfully.' });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
      return next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const user = await this.service.login(req.body?.email, req.body?.password);
      return req.session.regenerate((error) => {
        if (error) return next(error);
        req.session.userId = user.id;
        return res.json({
          message: 'Logged in successfully.',
          accessType: 'Login',
          email: user.email,
          preferences: user.preferences
        });
      });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
      return next(error);
    }
  };

  guest = (req, res, next) => req.session.regenerate((error) => {
    if (error) return next(error);
    req.session.accessType = 'Guest';
    req.session.intake = {};
    return res.json({ message: 'Guest session started.', accessType: 'Guest' });
  });

  me = (req, res, next) => {
    try {
      const user = req.session.userId ? this.service.getUserById(req.session.userId) : null;
      return res.json({
        accessType: user ? 'Login' : req.session.accessType || 'None',
        email: user?.email || null,
        preferences: user?.preferences || {},
        intake: req.session.intake || {}
      });
    } catch (error) {
      return next(error);
    }
  };

  save = (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ message: 'Log in to save preferences.' });
    try {
      const preferences = this.service.savePreferences(req.session.userId, req.body || {});
      return res.json({ preferences });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
      return next(error);
    }
  };

  logout = (req, res, next) => req.session.destroy((error) => {
    if (error) return next(error);
    return res.clearCookie('connect.sid').json({ message: 'Session ended.' });
  });
}

module.exports = AuthController;
