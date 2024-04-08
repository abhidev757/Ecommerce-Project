const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    name:{
        type:String,
        required: true
    },
    email:{
        type:String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    OTP: {
        type: String,
        required:true
    },
    isBlocked: {
        type: Boolean,
        default:false,
    },
    created: {
        type: Date,
        required: true,
        default: Date.now
    }

})

module.exports = mongoose.model("users",userSchema);