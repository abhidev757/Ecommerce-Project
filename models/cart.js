const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({

userId : {
    type: mongoose.Schema.Types.ObjectId,
    ref:"users",
    required: true
},

    items : [{
        product:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"product",
            required:true,
        },
        price:{
            type:Number,
            default:0,
        },
        quantity: {
            type: Number,
            required: true,
        },
        created: {
            type: Date,
            required: true,
            default: Date.now
        }
    }
],
totalPrice: {
    type:Number,
    default: 0,
}
})

module.exports = mongoose.model("cart",cartSchema);