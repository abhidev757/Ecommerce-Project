const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({

    category:{
        type:String,
        required: true
    },
    description:{
        type:String,
        required: true
    },
    isListed: {
        type: Boolean,
        default:true,
    },

})

module.exports = mongoose.model("category",categorySchema);