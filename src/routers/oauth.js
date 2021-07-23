require('dotenv').config()
const passport = require('passport')
const GoogleStrategy=require('passport-google-oauth20').Strategy
const User = require('../models/user')
 
passport.initialize()
 
passport.use(new GoogleStrategy({
    clientID:    process.env.GOOGLECLIENTID,
    clientSecret: process.env.GOOGLECLIENTSECRET,
    callbackURL: process.env.GOOGLECALLBACKURL
  },
  (accessToken, refreshToken, profile, done)=>{
    User.findOne({email:profile.emails[0].value}).then((currentUser)=>{
        if(currentUser){
          //if we already have a record with the given profile ID
          done(null, currentUser);
        } else{
             //if not, create a new user 
            new User({
              username:profile.emails[0].value.split('@')[0],
              firstName:profile.name.givenName,
              lastName:profile.name.familyName,
              email:profile.emails[0].value
            }).save().then((newUser) =>{
              done(null, newUser);
            });
         } 
      })
      console.log(profile.emails[0].value.split('@')[0]);
  }
));



