const mongoose = require("mongoose");

const WishlistSchema = new mongoose.Schema({

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
        
        created: {
            type: Date,
            required: true,
            default: Date.now
        }
    }
]

})

module.exports = mongoose.model("Wishlist",WishlistSchema);