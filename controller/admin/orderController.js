const Order = require("../../models/orders");
const Products = require("../../models/product");
const Users = require("../../models/users");
const Wallet = require("../../models/wallet");

const orderController = {
  orders: async (req, res) => {
    const perPage = 5;
    const page = req.query.page || 1;

    try {
      const totalOrders = await Order.countDocuments();

      const orders = await Order.aggregate([
        { $sort: { orderDate: -1 } },
        { $skip: perPage * page - perPage },
        { $limit: perPage },
      ]);

      const totalPages = Math.ceil(totalOrders / perPage);

      res.render("admin/orders", {
        title: "Orders",
        orders: orders,
        totalPages: totalPages,
        currentPage: page,
        perPage: perPage,
      });
    } catch (err) {
      next(err);
    }
  },

  adminOrderCancel: async (req, res) => {
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

      return res.status(200).redirect("/orders");
    } catch (err) {
      next(err);
    }
  },

  getOrdersPagination: async (req, res, next) => {
    const perPage = 5;
    const page = req.query.page || 1;

    try {
      const totalOrders = await Order.countDocuments();

      const orders = await Order.aggregate([
        { $sort: { orderDate: -1 } },
        { $skip: perPage * page - perPage },
        { $limit: perPage },
      ]);

      const totalPages = Math.ceil(totalOrders / perPage);

      res.render("admin/orders", {
        orders: orders,
        totalPages: totalPages,
        currentPage: page,
        perPage: perPage,
      });
    } catch (err) {
      next(err);
    }
  },

  adminOrdersDetails: async (req, res) => {
    const orderId = req.params.orderId;
    const users = await Users.find();
    const orders = await Order.findById(orderId).populate("items.product");
    console.log(orders);
    res.render("admin/adminOrderDetails", {
      users: users,
      orders: orders,
    });
  },

  updateStatus: async (req, res, next) => {
    try {
      const { orderId, selectedStatus } = req.body;
      console.log(req.body);

      const order = await Order.findById(orderId).populate("items.product");
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      if (selectedStatus === "Cancelled") {
        // Stock increment logic can be re-enabled here if needed
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { $set: { status: selectedStatus } },
        { new: true }
      );

      if (updatedOrder) {
        res.redirect("/adminOrderDetails");
      } else {
        res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }
    } catch (err) {
      next(err);
    }
  },
};

module.exports = orderController;
