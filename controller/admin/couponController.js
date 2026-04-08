const Coupon = require("../../models/coupon");
const Category = require("../../models/category");

const couponController = {
  coupons: async (req, res) => {
    const Data = await Coupon.find();
    res.render("admin/coupon", { data: Data });
  },

  addCoupon: async (req, res) => {
    const category = await Category.find();
    res.render("admin/addCoupon", { cate: category });
  },

  addCouponPost: async (req, res) => {
    try {
      const existingCoupon = await Coupon.findOne({
        couponCode: req.body.couponCode,
      });

      if (existingCoupon) {
        console.log("Coupon already exists, Please try with another one");
        return res.render("admin/addCoupon", {});
      } else {
        const coupon = new Coupon({
          couponCode: req.body.couponCode,
          description: req.body.description,
          discountPercentage: req.body.discount,
          maxDiscountAmount: req.body.maxAmount,
          minAmount: req.body.minAmount,
          expiryDate: req.body.expiryDate,
        });

        await coupon.save();
        console.log("Coupon added successfully");
        return res.redirect("/addCoupon");
      }
    } catch (err) {
      console.error(err);
      return res.status(500).send("Internal Server Error");
    }
  },

  editCoupon: async (req, res) => {
    try {
      const id = req.params.id;
      const coupon = await Coupon.findById(id);
      if (!coupon) {
        res.redirect("/coupons");
        return;
      }
      res.render("admin/editCoupon", { coupon: coupon });
    } catch (err) {
      console.log(err);
      res.redirect("/coupons");
    }
  },

  editCouponPost: async (req, res) => {
    let id = req.params.id;

    try {
      const result = await Coupon.findByIdAndUpdate(id, {
        couponCode: req.body.couponCode,
        description: req.body.description,
        discountPercentage: req.body.discount,
        maxDiscountAmount: req.body.maxAmount,
        minAmount: req.body.minAmount,
        expiryDate: req.body.expiryDate,
      });
      res.redirect("/coupons");
    } catch (err) {
      console.log("error:", err);
    }
  },

  couponList: async (req, res) => {
    const id = req.params.id;
    const coupon = await Coupon.findByIdAndUpdate(id, { isListed: true });
    res.redirect("/coupons");
  },

  couponUnlist: async (req, res) => {
    const id = req.params.id;
    const coupon = await Coupon.findByIdAndUpdate(id, { isListed: false });
    res.redirect("/coupons");
  },
};

module.exports = couponController;
