const Category = require("../../models/category");

const categoryController = {
  adminCategory: async (req, res) => {
    const catNdec = await Category.find();
    res.render("admin/category", { Data: catNdec });
  },

  adminAddCategory: (req, res) => {
    res.render("admin/addCategory");
  },

  adminAddCategoryPost: async (req, res) => {
    const existingCategory = await Category.findOne({
      category: req.body.category,
    });

    if (existingCategory) {
      res.render("admin/addCategory", {
        title: "Signup",
        alert: "Email already exists, Please try with another one",
      });
      console.log("Username already exists, Please try with another one");
    } else {
      const category = new Category({
        category: req.body.category,
        description: req.body.description,
      });

      try {
        await category.save();
        res.redirect("/addCategory");
      } catch (err) {
        console.log(err);
      }
    }
  },

  adminEditCategory: async (req, res) => {
    try {
      const id = req.params.id;
      const catNdec = await Category.findById(id);
      if (!catNdec) {
        res.redirect("/category");
        return;
      }
      res.render("admin/editCategory", { data: catNdec });
    } catch (err) {
      console.log(err);
      res.redirect("/category");
    }
  },

  adminEditCategoryPost: async (req, res) => {
    let id = req.params.id;

    try {
      const result = await Category.findByIdAndUpdate(id, {
        description: req.body.description,
        category: req.body.category,
      });
      res.redirect("/category");
    } catch (err) {
      console.log("error:", err);
    }
  },

  unlist: async (req, res) => {
    const id = req.params.id;
    const category = await Category.findByIdAndUpdate(id, { isListed: false });
    res.redirect("/category");
  },

  list: async (req, res) => {
    const id = req.params.id;
    const category = await Category.findByIdAndUpdate(id, { isListed: true });
    res.redirect("/category");
  },
};

module.exports = categoryController;
