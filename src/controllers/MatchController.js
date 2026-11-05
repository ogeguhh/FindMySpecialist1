class MatchController {
  constructor(service) {
    this.service = service;
  }

  match = (req, res) => {
    const symptoms = req.body?.symptoms || req.session?.intake?.symptoms;
    const result = this.service.match(symptoms);
    if (result.valid && req.session) {
      req.session.intake = {
        ...(req.session.intake || {}),
        evaluationStatus: result.status,
        specialties: result.specialties
      };
    }
    return res.status(result.valid || result.status === 'Urgent' ? 200 : 400).json(result);
  };
}

module.exports = MatchController;
