const Brand = require("../../models/brand");

const brandController = {
  adminBrand: async (req, res) => {
    const brands = await Brand.find();
    res.render("admin/brand", { Data: brands });
  },

  adminAddBrand: (req, res) => {
    res.render("admin/addBrand");
  },

  adminAddBrandPost: async (req, res) => {
    const existingBrand = await Brand.findOne({
      brand: req.body.brand,
    });

    if (existingBrand) {
      res.render("admin/addBrand", {
        title: "Signup",
        alert: "Email already exists, Please try with another one",
      });
      console.log("Username already exists, Please try with another one");
    } else {
      const brand = new Brand({
        brand: req.body.brand,
        description: req.body.description,
      });

      try {
        await brand.save();
        res.redirect("/addBrand");
      } catch (err) {
        console.log(err);
      }
    }
  },

  adminEditBrand: async (req, res) => {
    try {
      const id = req.params.id;
      const brands = await Brand.findById(id);
      if (!brands) {
        res.redirect("/brand");
        return;
      }
      res.render("admin/editBrand", { data: brands });
    } catch (err) {
      console.log(err);
      res.redirect("/brand");
    }
  },

  adminEditBrandPost: async (req, res) => {
    let id = req.params.id;

    try {
      const result = await Brand.findByIdAndUpdate(id, {
        description: req.body.description,
        brand: req.body.brand,
      });
      res.redirect("/brand");
    } catch (err) {
      console.log("error:", err);
    }
  },

  brandUnlist: async (req, res) => {
    const id = req.params.id;
    const brand = await Brand.findByIdAndUpdate(id, { isListed: false });
    res.redirect("/brand");
  },

  brandList: async (req, res) => {
    const id = req.params.id;
    const brand = await Brand.findByIdAndUpdate(id, { isListed: true });
    res.redirect("/brand");
  },
};

module.exports = brandController;
