class User { constructor({id,email,passwordHash,preferences={}}) {Object.assign(this,{id,email,passwordHash,preferences});} } module.exports=User;
