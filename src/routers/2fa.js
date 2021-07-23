const twofactor = require("node-2fa");  
var nodemailer = require("nodemailer");

const newSecret = twofactor.generateSecret({ name: "My Awesome App", account: "johndoe" });

console.log(newSecret.secret)

const newToken = twofactor.generateToken(newSecret.secret);
console.log(newToken.token)
// => { token: '630618' }

console.log(twofactor.verifyToken(newSecret.secret, newToken.token));
// => { delta: 0 }

console.log(twofactor.verifyToken(newSecret.secret, "00"));
// => null