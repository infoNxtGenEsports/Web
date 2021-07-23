const Admin = require("../models/admin");
const auth = function (req, res, next) {
  if (req.isAuthenticated()) {
    Admin.findOne({username:req.user.username},
      function (err, user) {
        if (user) {
          return next();
        } else {
          res.status(400).send("You are not an Admin");
        }
      });
  } else {
    res.status(400).send("Please login ");
  }
};

module.exports = auth;
