var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
const validator = require('validator')

// var UserSchema = new mongoose.Schema({
//     username: String,
//     password: String,
// 	firstName:String,
// 	lastName:String,
// 	email:String,
//     ph:String
// });

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName:{
        type: String,
        required: true,
        trim: true
    },
    username:{
        type:String,
        required:true,
        unique:true
    },
    ph:{
        type:String,
        match: /^[0-9]{10}$/,
        trim:true,
        unique:true
    },
    email: {
        type: String,
        // required: true,
        match: /.+\@.+\..+/,
        trim: true,
        lowercase: true,
        unique: true
    },
    profileImg:{
        type:Buffer
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
});

userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", userSchema);