require('dotenv').config()
const express = require("express");
const User = require("../models/user");
const Admin = require("../models/admin");
var passport = require("passport");
const adminauth = require("../middleware/adminauth");
const superadmin = require("../middleware/superadmin");
const router = new express.Router();
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
const twofactor = require("node-2fa");
require("./oauth");
require("./oauthfb");

router.get("/admin", function (req, res) {
  res.send("Home Admin");
});

router.post("/admin/register", superadmin, function (req, res) {
  console.log(req.body);
  var newAdmin = new User({
    username: req.body.username,
    email: req.body.email,
  });
  Admin.register(newAdmin, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.status(400).send(err.message);
    }
    passport.authenticate("local")(req, res, function () {
      res.status(200).send(newAdmin);
    });
  });
});

//handling login logic
router.post(
  "/admin/login",
  passport.authenticate("adminLocal", {
    successRedirect: "/admin/home",
    failureRedirect: "/failure",
  }),
  function (err, req, res) {
    res.status(400).send(res);
    console.log(err);
  }
);

// logout route
router.get("/admin/home",adminauth, function (req, res) {
  res.status(200).send("Admin logged in");
});

// logout route
router.get("/admin/logout", function (req, res) {
  req.logout();
  res.status(200).send("logged out");
});

router.get("/admin/about", adminauth, async function (req, res) {
  try {
    res.send(req.user);
  } catch {
    res.send("please login");
  }
});

router.get("/admin/viewall", superadmin, async function (req, res) {
  Admin.find({},(err,user)=>{
    if(user){
      res.send(user)
    }
    else{
      res.send("Empty")
    }
  })
});

// admin edit
router.patch("/admin/edit", adminauth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["email"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    Admin.findOne({username:req.user.username}, async (err,user)=>{
      updates.forEach((update) => (req.user[update] = req.body[update]));
      updates.forEach((update) => (user[update] = req.body[update]));
      await user.save();
      res.send(user);
    })
    
    // await req.user.save();
    // res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
    console.log(e);
  }
});

router.patch("/admin/changePassword", adminauth, async (req, res) => {
  Admin.findOne(
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

// admin delete
router.delete("/admin/remove", superadmin , async (req, res) => {
  try {
    Admin.findOneAndDelete({username:req.body.username}, async(err, user) => {
      res.send(`Deleted ${user.username}`);
    })
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/admin/viewuser", adminauth, async function (req, res) {
  User.findOne({username:req.body.username},(err,user)=>{
    if(user){
      res.send(user)
    }
    else{
      res.send("Empty")
    }
  })
});

router.get("/admin/viewusers", adminauth, async function (req, res) {
  User.find({},(err,user)=>{
    if(user){
      res.send(user)
    }
    else{
      res.send("Empty")
    }
  })
});

router.get("/failure", function (req, res) {
  res.send("Failed");
});

module.exports = router;
