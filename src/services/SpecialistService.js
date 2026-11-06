const catalog=require('../data/insuranceCatalog.json');
const MinnesotaZipService=require('./MinnesotaZipService');
class SpecialistService {constructor(repo,bookingLinks,zipService=new MinnesotaZipService()){this.repo=repo;this.bookingLinks=bookingLinks;this.zipService=zipService;}
 normalizeSpecialties(specialty,specialties=[]){const values=[...(Array.isArray(specialties)?specialties:[]),...(typeof specialty==='string'&&specialty? [specialty]:[])].filter(Boolean).map(String).filter(s=>s.trim().length>0);return [...new Set(values)];}
 search({specialty,specialties=[],zip='',insuranceProvider='',insurancePlan='',maxDistance=''}={}){
 const selectedSpecialties=this.normalizeSpecialties(specialty,specialties);
 if(!selectedSpecialties.length)throw Error('Choose a specialty.');
 const region=this.zipService.regionFor(zip);
 if(!region)throw Error('Enter a supported 5-digit Minnesota ZIP code (demo ZIP areas 55001–56763).');
 if(insuranceProvider&&!catalog[insuranceProvider])throw Error('Select an approved demonstration insurance provider.');
 if(insurancePlan&&(!insuranceProvider||!catalog[insuranceProvider].includes(insurancePlan)))throw Error('Select an approved plan for the chosen insurance provider.');
 if(maxDistance!==''&&![5,10,15,25,50].includes(Number(maxDistance)))throw Error('Select a supported maximum distance.');
 const matches=this.repo.all().filter(p=>p.region===region&&selectedSpecialties.includes(p.specialty)&&(!maxDistance||p.distanceMiles<=Number(maxDistance))&&(!insuranceProvider||p.insurance[insuranceProvider]&&(!insurancePlan||p.insurance[insuranceProvider].includes(insurancePlan))));
 return [...new Map(matches.map(p=>[p.id,p])).values()].sort((a,b)=>a.name.split(' ').at(-1).localeCompare(b.name.split(' ').at(-1)));
 }
 details(id){const p=this.repo.findById(id);if(!p)return null;return {...p,bookingUrl:this.bookingLinks.getBookingUrl(p.bookingUrl),detailsStatus:p.name&&p.specialty&&p.clinic&&p.location?'Complete':'Partial'};}
}
module.exports=SpecialistService;
