const insuranceCatalog = require('../data/insuranceCatalog.json');
const specialtyRules = require('../data/specialtyRules.json');

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

class SpecialistService {
  constructor(repo, bookingLinks) {
    this.repo = repo;
    this.bookingLinks = bookingLinks;
    this.specialties = new Set(Object.values(specialtyRules).flat());
  }

  search({ specialty, zip = '', insuranceProvider = '', insurancePlan = '', maxDistance = '' }) {
    if (typeof specialty !== 'string' || !this.specialties.has(specialty)) {
      throw validationError('Choose a supported specialty.');
    }
    if (!/^\d{5}$/.test(String(zip))) {
      throw validationError('Please enter a valid 5-digit ZIP code.');
    }
    if (insuranceProvider && !insuranceCatalog[insuranceProvider]) {
      throw validationError('Select an approved demonstration insurance provider.');
    }
    if (insurancePlan && (!insuranceProvider || !insuranceCatalog[insuranceProvider].includes(insurancePlan))) {
      throw validationError('Select an approved plan for the chosen insurance provider.');
    }
    if (maxDistance !== '' && ![5, 10, 15, 25, 50].includes(Number(maxDistance))) {
      throw validationError('Select a supported maximum distance.');
    }

    return this.repo.all()
      .filter((provider) => provider.specialty === specialty
        && provider.zip === zip
        && (!maxDistance || provider.distanceMiles <= Number(maxDistance))
        && (!insuranceProvider
          || (provider.insurance[insuranceProvider]
            && (!insurancePlan || provider.insurance[insuranceProvider].includes(insurancePlan)))))
      .sort((a, b) => a.name.split(' ').at(-1).localeCompare(b.name.split(' ').at(-1)));
  }

  details(id) {
    const provider = this.repo.findById(id);
    if (!provider) return null;
    return {
      ...provider,
      bookingUrl: this.bookingLinks.getBookingUrl(provider.bookingUrl)
    };
  }
}

module.exports = SpecialistService;
