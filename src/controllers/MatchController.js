class MatchController {constructor(service){this.service=service;}
 match=(req,res)=>{const symptoms=Array.isArray(req.body?.symptoms)?req.body.symptoms:(Array.isArray(req.session?.intake?.symptoms)?req.session.intake.symptoms:[]);const result=this.service.match(symptoms);if(req.session)req.session.intake={...(req.session.intake||{}),symptoms,matchResult:result,specialties:Array.isArray(result.specialties)?result.specialties:[]};res.status(result.valid||result.status==='Urgent'?200:400).json(result);};
}module.exports=MatchController;
