var mongoose = require("mongoose");
const validator = require('validator')

const gameSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description:{
        type: String,
        required: true
    },
    createdby:{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin"
         },
        username: String
    },
    modifiedby:{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin"
         },
        username: String
    },
    logo:{
        type:Buffer
    }
},{
    timestamps:true
});


module.exports = mongoose.model("Game", gameSchema)