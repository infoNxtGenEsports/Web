var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

const adminSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
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
    resetPasswordToken: String,
    resetPasswordExpires: Date,
});

adminSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("Admin", adminSchema);