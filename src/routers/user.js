require('dotenv').config()
const express = require("express");
const User = require("../models/user");
var passport = require("passport");
const auth = require("../middleware/auth");
const router = new express.Router();
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
const twofactor = require("node-2fa");
const multer = require('multer')
const sharp = require('sharp')
require("./oauth");
require("./oauthfb");

const upload = multer({
  limits: {
      fileSize: 1000000
  },
  fileFilter(req, file, cb) {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          return cb(new Error('Please upload an image'))
      }

      cb(undefined, true)
  }
})

router.get("/", function (req, res) {
  res.send("Home User");
});
// User Add
router.post("/register",upload.single('profileImg'),async (req, res)=> {
  console.log(req.body);
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
  var newUser = new User({
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    ph: req.body.ph,
    profileImg:buffer
  });
  
  await User.register(newUser, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.status(400).send(err.message);
    }
    passport.authenticate("local")(req, res, function () {
      res.status(200).send(newUser);
    });
  });
});

//handling login logic
router.post(
  "/login",
  passport.authenticate("userLocal", {
    successRedirect: "/user/home",
    failureRedirect: "/failure",
  }),
  function (err, req, res) {
    res.status(400).send(res);
    console.log(err);
  }
);

// logout route
router.get("/user/home", function (req, res) {
  res.status(200).send("logged in");
});

// logout route
router.get("/user/logout", function (req, res) {
  req.logout();
  res.status(200).send("logged out");
});

router.get("/user/about", auth, async function (req, res) {
  try {
    if (req.isAuthenticated()) {
      res.send(req.user);
    }
  } catch {
    res.send("please login");
  }
});
// user edit
router.patch("/user/edit", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["firstName", "lastName", "ph", "email", "password"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    // updates.forEach((update) => (req.user[update] = req.body[update]));
    // await req.user.save();
    // res.send(req.user);
    Admin.findOne({username:req.user.username}, async (err,user)=>{
      updates.forEach((update) => (req.user[update] = req.body[update]));
      updates.forEach((update) => (user[update] = req.body[update]));
      await user.save();
      res.send(user);
    })
  } catch (e) {
    res.status(400).send(e);
    console.log(e);
  }
});
// Change Password
router.patch("/user/changePassword", auth, async (req, res) => {
  User.findOne(
    {
      username: req.user.username,
    },
    function (err, user) {
      if (!user) {
        //   return res.redirect("back");
        return res.send("invalid");
      }
      if (req.body.password === req.body.confirm) {
        user.setPassword(req.body.password, function (err) {
          user.save(function (err) {
            res.send("Password Changed");
          });
        });
      } else {
        return res.send("password do not match");
      }
    }
  );
});
// user delete
router.delete("/user/remove", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/failure", function (req, res) {
  res.send("Failed");
});
// router.get('/google/callback',function(req,res){
//     res.send("Oauth Done")
//     console.log()
// })
// router.get('/google',
//   passport.authenticate('google', { scope:
//       ['profile' ] }
// ));

// router.get( '/auth/google/callback',
//     passport.authenticate( 'google', {
//         successRedirect: '/user/about',
//         failureRedirect: '/failure'
// }));

// Google Auth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    successRedirect: "/user/about",
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

// Facebook Auth
router.get("/facebook", passport.authenticate("facebook"));

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    successRedirect: "/user/about",
    failureRedirect: "/login",
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

//forgot password
router.get("/forgot", function (req, res) {
  //   res.render("forgot");
  res.send("Forget");
});

router.post("/forgot", function (req, res, next) {
  async.waterfall(
    [
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          var token = buf.toString("hex");
          done(err, token);
        });
      },
      function (token, done) {
        User.findOne({ email: req.body.email }, function (err, user) {
          if (!user) {
            // req.flash("error", "No account with that email address exists.");
            // return res.redirect("/forgot");
            res.status(400).send("No account with that email address exists.");
          }

          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000;

          user.save(function (err) {
            done(err, token, user);
          });
        });
      },
      function (token, user, done) {
        console.log(user.email);
        var smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: process.env.EMAIL,
            pass: process.env.GMAILPW,
          },
        });
        var mailOptions = {
          to: user.email,
          from: process.env.EMAIL,
          subject: "Esports Password Reset",
          text:
            "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
            "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
            "http://" +
            req.headers.host +
            "/reset/" +
            token +
            "\n\n" +
            "If you did not request this, please ignore this email and your password will remain unchanged.\n",
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          console.log("mail sent");
          // req.flash(
          //   "success",
          //   "An e-mail has been sent to " +
          //     user.email +
          //     " with further instructions."
          // );
          done(err, "done");
        });
      },
    ],
    function (err) {
      if (err) return next(err);
      //   res.redirect("/forgot");
      res.send("redirected");
    }
  );
});

router.get("/reset/:token", function (req, res) {
  User.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    },
    function (err, user) {
      if (!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.status(400).send("no user");
      }
      //   res.render("reset", { token: req.params.token });
    }
  );
});

router.post("/reset/:token", function (req, res) {
  async.waterfall(
    [
      function (done) {
        User.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
          },
          function (err, user) {
            if (!user) {
              // req.flash(
              //   "error",
              //   "Password reset token is invalid or has expired."
              // );
              //   return res.redirect("back");
              return res.send("invalid");
            }
            if (req.body.password === req.body.confirm) {
              user.setPassword(req.body.password, function (err) {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save(function (err) {
                  req.logIn(user, function (err) {
                    done(err, user);
                    res.status(200).send("Password Changed");
                  });
                });
              });
            } else {
              // req.flash("error", "Passwords do not match.");
              //   return res.redirect("back");
              return res.send("password do not match");
            }
          }
        );
      },
      function (user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: process.env.EMAIL,
            pass: process.env.GMAILPW,
          },
        });
        var mailOptions = {
          to: user.email,
          from: process.env.EMAIL,
          subject: "Your password has been changed",
          text:
            "Hello,\n\n" +
            "This is a confirmation that the password for your account " +
            user.email +
            " has just been changed.\n",
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          //   req.flash("success", "Success! Your password has been changed.");
          done(err);
        });
      },
    ],
    function (err) {
      res.send();
    }
  );
});

router.post("/verify", function (req, res, next) {
  console.log(req.body.email);
  const newSecret = twofactor.generateSecret({
    name: "Esports",
    account: req.body.email,
  });
  console.log(newSecret.secret);
  const newToken = twofactor.generateToken(newSecret.secret);
  console.log(newToken.token);
  var smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.GMAILPW,
    },
  });
  var mailOptions = {
    to: req.body.email,
    from: process.env.EMAIL,
    subject: "Esports Email Verification",
    html:
      "<h3>OTP for account verification is </h3>" +
      "<h1 style='font-weight:bold;'>" +
      newToken.token +
      "</h1>", // html body
  };
  smtpTransport.sendMail(mailOptions, function (err) {
    if(err){
      return console.log(err)
    }
    else{
      console.log("mail sent");
      res.status(200).send("OTP sent to email");
    }
  });
  sec=newSecret.secret
  res.send({sec})
});

router.post("/verify/check", function(req,res){

    
    const token = req.header('Authorization').replace('Bearer ', '')
    twofactor.verifyToken(token, req.body.token)
    var x=twofactor.verifyToken(token, req.body.token).delta
    if(x= 0 || 1 || -1){
      res.status(200).send("Successfully Verified")
    }
    else{
      res.status.send("Didnt match")
    }

})

module.exports = router;
