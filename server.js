// Optional .env values can be supplied by your shell or hosting provider.
const Application=require('./src/Application');const port=Number(process.env.PORT||3000);new Application().app.listen(port,()=>console.log(`FindMySpecialist running at http://localhost:${port}`));
