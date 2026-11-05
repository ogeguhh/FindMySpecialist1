class IntakeController {
  constructor(service) {
    this.service = service;
  }

  search = (req, res) => res.json({ symptoms: this.service.search(req.query.q || '') });

  submit = (req, res) => {
    const symptoms = req.body?.symptoms;
    const result = this.service.validateSymptoms(symptoms);
    if (req.session) {
      req.session.intake = {
        ...(req.session.intake || {}),
        symptoms: Array.isArray(symptoms) ? symptoms : [],
        evaluationStatus: result.status
      };
    }
    const status = result.valid || result.status === 'Urgent' ? 200 : 400;
    return res.status(status).json(result);
  };
}

module.exports = IntakeController;
