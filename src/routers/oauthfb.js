require('dotenv').config()
const FacebookStrategy = require('passport-facebook')
var passport = require("passport");
const User = require('../models/user')

passport.use(new FacebookStrategy({
    clientID: process.env.FBCLIENTID,
    clientSecret:process.env.FBCLIENTSECRET,
    callbackURL: process.env.FBCALLBACKURL
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOne({username: profile.id}).then((currentUser)=>{
        if(currentUser){
          //if we already have a record with the given profile ID
          done(null, currentUser);
        } else{
             //if not, create a new user 
            new User({
              username:profile.displayName,
              firstName:profile.displayName.split(' ')[0],
              lastName:profile.displayName.split(' ')[1],
              
            }).save().then((newUser) =>{
              done(null, newUser);
            });
         } 
      })
   
  }
));