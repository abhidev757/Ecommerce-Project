const Coupon = require("../../models/coupon");
const Cart = require("../../models/cart");

const couponController = {
  getCoupons: async (req, res) => {
    try {
      const userId = req.session.userID;
      const cartTotalPrice = req.query.totalPrice;
      console.log(cartTotalPrice);
      const currentDate = new Date();
      const coupons = await Coupon.find({
        minAmount: { $lte: cartTotalPrice },
        isListed: true,
        expiryDate: { $gte: currentDate },
        usedBy: { $ne: userId },
      });

      res.json({ coupons });
    } catch (error) {
      console.error("Error fetching coupons:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  applyCoupon: async (req, res) => {
    try {
      const { couponCode } = req.body;
      console.log("function working");

      const coupon = await Coupon.findOne({ couponCode: couponCode });
      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }

      const userId = req.session.userID;
      const userCart = await Cart.findOne({ userId });
      if (!userCart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      let discount = 0;
      if (coupon.discountPercentage) {
        discount = (userCart.totalPrice * coupon.discountPercentage) / 100;
        if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
          discount = Math.min(discount, parseInt(coupon.maxDiscountAmount));
        }
        discount = Math.floor(discount);
      }
      console.log(discount);

      const newTotalPrice = userCart.totalPrice - discount;
      console.log("54354", newTotalPrice);

      return res.status(200).json({
        message: "Coupon applied successfully",
        newTotalPrice,
        discount,
      });
    } catch (error) {
      console.error("Error applying coupon:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  cancelCoupon: async (req, res) => {
    try {
      const userId = req.session.userID;
      const userCart = await Cart.findOne({ userId });

      if (!userCart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      const originalTotalPrice = userCart.totalPrice;

      return res.status(200).json({ originalTotalPrice });
    } catch (error) {
      console.error("Error canceling coupon:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};

module.exports = couponController;
