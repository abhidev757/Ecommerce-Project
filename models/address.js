const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({

userId : {
    type: mongoose.Schema.Types.ObjectId,
    ref:"users",
},

    addressDetails : [{
        address:{
            type:String,
        },
        street:{
            type:String,
        },
        city: {
            type: String,
        },
        state: {
            type: String,
        },
        zip: {
            type: String,
        },
        country: {
            type: String
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
        created: {
            type: Date,
            required: true,
            default: Date.now
        }
    
    }]
})

module.exports = mongoose.model("address",addressSchema);