const Admin = require("../models/admin");
const auth = function (req, res, next) {
  console.log("Superadmin")
  if (req.isAuthenticated()) {
    Admin.findOne({username:req.user.username},
      function (err, user) {
        if (user.username==='rahuladmin') {
          return next();
        } else {
          res.status(400).send("You are not Super Admin");
        }
      });
  } else {
    res.status(400).send("Please login ");
  }
};

module.exports = auth;
