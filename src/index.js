require('dotenv').config()
const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
var passport    = require("passport")
var User        = require("./models/user")
const adminRouter = require('./routers/admin')
const gameRouter = require('./routers/game')
var passport    = require("passport")
var Admin        = require("./models/admin")
var LocalStrategy = require("passport-local")


const app = express()
const port = process.env.PORT || 3000


app.use(express.json())

// app.use(require('body-parser').urlencoded({ extended: true }));

// Passport config
app.use(require("express-session")({
    secret: "abcd",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use('userLocal', new LocalStrategy(User.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());


passport.use('adminLocal', new LocalStrategy(Admin.authenticate()));
// passport.serializeUser(Admin.serializeUser());
// passport.deserializeUser(Admin.deserializeUser());

passport.serializeUser(function(user, done) { 
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    if(user!=null)
      done(null,user);
  });

  app.use(userRouter)
  app.use(adminRouter)
  app.use(gameRouter)

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})

