const rules=require('../data/specialtyRules.json');
class MatchingService {constructor(symptomService){this.symptomService=symptomService;}
 match(symptoms){const evaluation=this.symptomService.validateSymptoms(symptoms);if(!evaluation.valid)return {...evaluation,matchStatus:evaluation.status==='Urgent'?'Warning':'Error'};const specialties=[...new Set(symptoms.flatMap(s=>rules[s]||[]))].sort();return {valid:true,status:'Ready',matchStatus:specialties.length?'Matched':'No Match',specialties};}
}
module.exports=MatchingService;
