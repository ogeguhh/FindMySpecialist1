const insuranceCatalog = require('../data/insuranceCatalog.json');
const specialtyRules = require('../data/specialtyRules.json');

class ProviderController {
  constructor(service) {
    this.service = service;
  }

  catalog = (req, res) => res.json({
    insuranceCatalog,
    specialties: [...new Set(Object.values(specialtyRules).flat())].sort(),
    distances: [5, 10, 15, 25, 50]
  });

  search = (req, res) => {
    try {
      const results = this.service.search(req.query);
      req.session.intake = { ...(req.session.intake || {}), searchFilters: req.query };
      return res.json({
        results,
        disclaimer: 'Demo providers only. Insurance information is not verified live.'
      });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
      throw error;
    }
  };

  details = (req, res) => {
    const provider = this.service.details(req.params.id);
    if (!provider) return res.status(404).json({ message: 'Provider not found.' });
    return res.json({
      provider,
      message: provider.bookingUrl
        ? 'Verified HTTPS link available.'
        : 'Online booking is unavailable for this provider.'
    });
  };

  clear = (req, res) => {
    if (req.session?.intake) delete req.session.intake.searchFilters;
    return res.json({ message: 'Search filters cleared. Session remains active.' });
  };
}

module.exports = ProviderController;
