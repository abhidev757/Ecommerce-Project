const Order = require("../../models/orders");
const PDFDocument = require("pdfkit");
const fs = require("fs");

const reportController = {
  generateReport: async (req, res) => {
    try {
      console.log("WORKING");
      const { startDate, endDate } = req.body;

      console.log("Start Date: ", startDate);
      console.log("End Date: ", endDate);

      const orders = await Order.find({
        orderDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
      }).populate("items.product");

      console.log("orders: ", orders);

      const reportData = orders.map((order, index) => {
        let totalPrice = 0;
        order.items.forEach((product) => {
          totalPrice += product.product.price * product.quantity;
        });

        return {
          orderId: order._id,
          date: order.orderDate,
          totalPrice,
          products: order.items.map((product) => {
            return {
              productName: product.product.title,
              quantity: product.quantity,
              price: product.price,
            };
          }),
          firstName: order.billingDetails.name,
          address: order.billingDetails.address,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
        };
      });

      console.log("Report Data: ", reportData);
      res.status(200).json({ reportData });
    } catch (err) {
      console.error("Error generating report:", err);
      res.status(500).json({ error: "Failed to generate report" });
    }
  },

  bestCategory: async (req, res) => {
    try {
      const bestSellingCategories = await Order.aggregate([
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $group: {
            _id: "$product.category",
            totalQuantity: { $sum: "$items.quantity" },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
        {
          $project: {
            _id: "$category._id",
            category: "$category.category",
            totalQuantity: 1,
          },
        },
      ]);
      res.render("admin/bestcategory", {
        title: "Best Categories",
        bestSellingCategories,
      });
    } catch (err) {
      next(err);
    }
  },

  bestProduct: async (req, res) => {
    try {
      const bestSellingProducts = await Order.aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            totalQuantity: { $sum: "$items.quantity" },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $project: {
            _id: "$product._id",
            productTitle: "$product.title",
            totalQuantity: 1,
          },
        },
      ]);

      res.render("admin/bestProduct", {
        title: "Best Products",
        bestSellingProducts,
      });
    } catch (err) {
      next(err);
    }
  },

  bestBrand: async (req, res) => {
    try {
      const bestSellingBrands = await Order.aggregate([
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $group: {
            _id: "$product.brand",
            totalQuantity: { $sum: "$items.quantity" },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "brands",
            localField: "_id",
            foreignField: "_id",
            as: "brand",
          },
        },
        { $unwind: "$brand" },
        {
          $project: {
            _id: "$brand._id",
            brandName: "$brand.brand",
            totalQuantity: 1,
          },
        },
      ]);
      res.render("admin/bestBrand", {
        title: "Best Brands",
        bestSellingBrands,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = reportController;
