const Order = require("../../models/orders");
const Cart = require("../../models/cart");
const Address = require("../../models/address");
const User = require("../../models/users");
const Products = require("../../models/product");
const Wallet = require("../../models/wallet");
const Coupon = require("../../models/coupon");
const Transaction = require("../../models/transactions");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const pdf = require("html-pdf");
require("dotenv").config();

const orderController = {
  ordersProfile: async (req, res) => {
    const { wishlistCount, cartItemCount } = req;
    const userId = req.session.userID;
    const orders = await Order.find({ userID: userId });
    console.log(orders);
    res.render("users/ordersProfile", {
      user: req.session.user || req.user,
      orders: orders,
      cartCount: cartItemCount,
      wishlistCount: wishlistCount,
      title: "My Orders",
    });
  },

  orderDetails: async (req, res) => {
    const { wishlistCount, cartItemCount } = req;
    const orderId = req.params.orderId;
    const orders = await Order.findById(orderId).populate("items.product");
    res.render("users/orderDetails", {
      user: req.session.user || req.user,
      orders: orders,
      cartCount: cartItemCount,
      wishlistCount: wishlistCount,
      title: "Order Details",
    });
  },

  getOrderInvoice: async (req, res) => {
    try {
      const categoryData = await require("../../models/category").find({
        isPublished: "true",
      });
      const orderId = req.params.orderId;
      const userId = req.session.userID;
      const order = await Order.findOne({
        _id: orderId,
        userID: userId,
      }).populate("items.product");
      console.log("This is the order", order);

      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      const invoiceTemplatePath = path.join(
        __dirname,
        "..",
        "..",
        "views",
        "users",
        "invoice.ejs"
      );

      const invoiceHtml = await ejs.renderFile(invoiceTemplatePath, {
        categoryData,
        order,
      });

      const options = {
        format: "A4",
        orientation: "portrait",
        border: "10mm",
        phantomPath: "/path/to/phantomjs-binary",
      };

      pdf.create(invoiceHtml, options).toStream((err, stream) => {
        if (err) {
          console.log("Error generating PDF:", err);
          return res
            .status(500)
            .json({ success: false, message: "Error generating PDF" });
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="invoice.pdf"'
        );

        stream.pipe(res);
      });
    } catch (error) {
      console.log(error.message);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  checkout: async (req, res) => {
    if (req.session.checkoutBlock) {
      req.session.checkoutBlock = false;
      res.redirect("/");
    } else {
      const { wishlistCount, cartItemCount } = req;
      const orderId = req.query.orderId;
      const userId = req.session.userID;
      const userData = await User.findById(userId);

      let userCart;
      let totalPrice;
      let addresses;

      if (orderId) {
        const order = await Order.findById(orderId)
          .populate("items.product")
          .exec();
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }
        addresses = await Address.find({ userId: userId });
        console.log(addresses);

        userCart = order.items;
        totalPrice = order.totalPrice;
      } else {
        addresses = await Address.find({ userId: userId });
        console.log(addresses);

        const cart = await Cart.findOne({ userId: userId })
          .populate("items.product")
          .exec();
        if (!cart) {
          return res.status(404).json({ message: "Cart not found" });
        }
        userCart = cart.items;
        totalPrice = cart.totalPrice;
      }

      const validCoupons = await Coupon.find({
        expiryDate: { $gt: new Date() },
        minimumAmount: { $lt: totalPrice },
        userID: { $ne: userId },
        isListed: true,
      });
      console.log("coupons", validCoupons);

      res.render("users/checkout", {
        user: userData || req.user,
        cartItems: userCart,
        address: addresses,
        coupons: validCoupons,
        cartCount: cartItemCount,
        wishlistCount: wishlistCount,
        totalPrice: totalPrice,
        orderID: orderId,
        title: "Checkout",
        alert: "Add new address to order",
        rpzKey: process.env.RAZORPAY_ID_KEY,
      });
    }
  },

  placeOrder: async (req, res) => {
    const userId = req.session.userID;
    const discount = req.body.discount;
    const {
      addressID,
      paymentMethod,
      totalPrice,
      paymentStatus,
      orderID,
      couponCode,
    } = req.body;
    console.log("discount:" + discount);
    console.log("orderId:" + orderID);

    if (orderID) {
      const orderToUpdate = await Order.findById(orderID);

      if (!orderToUpdate) {
        return res.status(404).json({ message: "Order not found" });
      }

      orderToUpdate.totalPrice = totalPrice;
      orderToUpdate.paymentMethod = paymentMethod;
      orderToUpdate.paymentStatus = paymentStatus;
      orderToUpdate.couponCode = couponCode;

      if (paymentStatus === "Paid" || paymentStatus === "Pending") {
        await orderToUpdate.save();
        req.session.checkoutBlock = true;
        return res
          .status(200)
          .render("users/thankyou", { title: "Thank You", orderID });
      } else if (paymentStatus === "Failed") {
        await orderToUpdate.save();
        return res.status(200).redirect("/ordersProfile");
      }
    }

    const user = await User.findById(req.session.userID);
    const cartItems = await Cart.find({ userId: userId });
    console.log(cartItems);
    const address = await Address.findOne({
      "addressDetails._id": addressID,
    });

    const selectedAddress = address.addressDetails.find((a) =>
      addressID.includes(a._id.toString())
    );

    const order = new Order({
      userID: user._id,
      items: cartItems.flatMap((cartItem) =>
        cartItem.items.map((item) => ({
          product: item.product,
          price: item.price,
          quantity: item.quantity,
        }))
      ),
      totalPrice: totalPrice,
      billingDetails: {
        name: user.name,
        address: selectedAddress.address,
        street: selectedAddress.street,
        city: selectedAddress.city,
        state: selectedAddress.state,
        country: selectedAddress.country,
        zip: selectedAddress.zip,
        phone: user.phone,
        email: user.email,
      },
      paymentMethod,
      paymentStatus,
    });

    order.discount = discount;

    await order.save();

    if (paymentMethod === "Wallet") {
      const wallet = await Wallet.findOne({ userId: user._id });

      wallet.balance -= totalPrice;
      await wallet.save();

      const transaction = new Transaction({
        userId: order.userID,
        amount: totalPrice,
        status: "Success",
        type: "Debited",
      });
      await transaction.save();
    }

    if (paymentStatus !== "Failed") {
      await Cart.findOneAndUpdate(
        { userId: user._id },
        { $set: { items: [], totalPrice: 0 } }
      );
    }

    if (paymentStatus !== "Failed" && couponCode) {
      await Coupon.findOneAndUpdate(
        { couponCode },
        { $addToSet: { usedBy: user._id } }
      );
    }

    for (const item of order.items) {
      await Products.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    if (paymentStatus === "Paid" || paymentStatus === "Pending") {
      req.session.checkoutBlock = true;
      return res.status(200).render("users/thankyou", {
        title: "Thank You",
        orderId: order._id.toString(),
      });
    } else if (paymentStatus === "Failed") {
      return res.status(200).redirect("/ordersProfile");
    }
  },

  cancleOrder: async (req, res) => {
    const orderId = req.params.orderId;

    try {
      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.paymentStatus === "Paid") {
        const wallet = await Wallet.findOne({ userId: order.userID });

        if (!wallet) {
          return res
            .status(404)
            .json({ error: "Wallet not found for user" });
        }

        wallet.balance += order.totalPrice;
        await wallet.save();
      }

      for (const item of order.items) {
        await Products.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }

      order.status = "Cancelled";
      await order.save();

      const transaction = new Transaction({
        userId: order.userID,
        amount: order.totalPrice,
        status: "Success",
        type: "Credited",
      });
      await transaction.save();

      return res.status(200).redirect("/ordersProfile");
    } catch (err) {
      next(err);
    }
  },

  returnOrder: async (req, res, next) => {
    const orderId = req.params.orderId;
    const { returnReason } = req.body;

    try {
      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      order.status = "Returned";
      order.returnReason = returnReason;
      await order.save();

      return res
        .status(200)
        .json({ message: "Order returned successfully" });
    } catch (err) {
      next(err);
    }
  },

  thankyou: (req, res) => {
    res.render("users/thankyou", {
      user: req.session.user || req.user,
      title: "Thankyou",
    });
  },
};

module.exports = orderController;
