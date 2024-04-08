const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({

   title: {
    type: String,
    required: true
   },
   description:{
    type: String,
    required: true
   },
   fabric:{
    type: String,
   },
   color:{
    type: String,
   },
   style:{
    type: String,
   },
   oldPrice:{
    type: String,
   },
   offer:{
    type: String,
   },
   brand:{
      type: mongoose.Schema.Types.ObjectId,
      ref:"brand",
      required: true
   },
   price:{
    type: Number,
    required: true
   },
   stock:{
    type: Number,
    required: true
   },
   variants: [
      {
        size: {
         type: String,
         enum: ["S","M","L","XL"]
        },
        stock:{
         type: Number,
        }
      }
   ],
   isPublished: {
      type: Boolean,
      default:true,
  },
   category:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"category",
    required: true
   },
   images:{
    type: Array
   },
   inWishlist:{
      type:Boolean,
      default:false
  },

})

module.exports = mongoose.model("product",productSchema);