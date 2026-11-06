const rules=require('../data/specialtyRules.json');
class MatchingService {constructor(symptomService){this.symptomService=symptomService;}
 match(symptoms){const selected=Array.isArray(symptoms)?symptoms:[];const evaluation=this.symptomService.validateSymptoms(selected);if(!evaluation.valid)return {...evaluation,matchStatus:evaluation.status==='Urgent'?'Warning':'Error',specialties:[]};const specialties=[...new Set(selected.flatMap(s=>rules[s]||[]))].sort((a,b)=>a.localeCompare(b));return {valid:true,status:'Ready',matchStatus:specialties.length?'Matched':'No Match',specialties};}
}
module.exports=MatchingService;
