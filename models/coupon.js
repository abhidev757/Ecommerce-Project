const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  couponCode:{
    type:String,
    unique:true
  },
  description:{
    type:String
  },
discountPercentage:{
  type: Number,
  min: 0,
  max: 100
},
maxDiscountAmount:{
  type: Number,
  min: 0
},
minAmount:{
  type: Number,
  min:0
},
expiryDate:{
  type: Date
},
isListed:{
  type: Boolean,
  default: true
},
usedBy: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'users'
}]
});

module.exports = mongoose.model("coupon", couponSchema);