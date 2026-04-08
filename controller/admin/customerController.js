const Users = require("../../models/users");

const customerController = {
  adminCustomer: async (req, res) => {
    const users = await Users.find();
    res.render("admin/customer", { users: users });
  },

  blockUser: async (req, res) => {
    const id = req.params.id;
    const user = await Users.findByIdAndUpdate(id, { isBlocked: true });
    req.session.user = null;
    res.redirect("/customer");
  },

  unblockUser: async (req, res) => {
    const id = req.params.id;
    const user = await Users.findByIdAndUpdate(id, { isBlocked: false });
    res.redirect("/customer");
  },
};

module.exports = customerController;
