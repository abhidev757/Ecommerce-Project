const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
      },
      price: {
        type: Number,
        default: 0,
      },
      quantity: {
        type: Number,
      },
    },
  ],
  totalPrice: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["Pending", "Shipped", "Delivered", "Cancelled","Returned"],
    default: "Pending",
  },
 
  billingDetails: {
    name: String,
    address: String,
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    phone: String,
    email: String,
  },
  paymentMethod: {
    type: String,
  },
  paymentStatus: {
    type: String,
    default: "COD",
  },
  returnReason: {
    type: String
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", OrderSchema);
