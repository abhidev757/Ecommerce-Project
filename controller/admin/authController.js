const credential = {
  email: "admin@gmail.com",
  password: "admin123",
};

const adminAuthController = {
  adminLogin: (req, res) => {
    if (!req.session.admin) {
      res.render("admin/adminLogin");
    } else {
      res.render("admin/dashboard");
    }
  },

  adminLoginPost: (req, res) => {
    if (
      req.body.email == credential.email &&
      req.body.password == credential.password
    ) {
      req.session.admin = req.body.email;
      res.redirect("/dashboard");
    } else {
      res.render("admin/adminLogin", { error: "Invalid Username or Password" });
    }
  },

  adminLogout: (req, res) => {
    if (req.session.admin) {
      req.session.admin = null;
      res.render("admin/adminLogin");
    } else {
      res.render("admin/adminLogin");
    }
  },
};

module.exports = adminAuthController;
