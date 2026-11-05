const supported=require('../data/symptoms.json');
class SymptomService {
 search(query=''){return supported.filter(s=>s.toLowerCase().includes(String(query).toLowerCase())).sort();}
 validateSymptoms(symptoms){if(!Array.isArray(symptoms)||!symptoms.length)return {valid:false,status:'Missing',message:'Please select at least one symptom to continue.'};if(symptoms.length>3)return {valid:false,status:'Error',message:'You can select a maximum of 3 symptoms.'};if(new Set(symptoms).size!==symptoms.length||symptoms.some(s=>!supported.includes(s)))return {valid:false,status:'Unsupported',message:'Select only supported symptoms without duplicates.'};if(symptoms.includes('Chest Pain'))return {valid:false,status:'Urgent',message:'Chest pain may be a medical emergency. Call 911 or seek immediate emergency medical assistance.'};if(symptoms.includes('Sudden Severe Headache'))return {valid:false,status:'Urgent',message:'Sudden severe headache may require emergency medical attention. Seek immediate medical assistance.'};return {valid:true,status:'Ready',symptoms};}
}
module.exports=SymptomService;
