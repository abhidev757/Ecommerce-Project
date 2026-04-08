const Products = require("../../models/product");
const Category = require("../../models/category");
const Brand = require("../../models/brand");
const multer = require("multer");

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});

let upload = multer({
  storage: storage,
}).array("images", 3);

const productController = {
  adminProducts: async (req, res) => {
    try {
      const perPage = 5;
      const page = req.query.page || 1;

      const totalProducts = await Products.aggregate([
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ]);

      const totalProductsCount =
        totalProducts.length > 0 ? totalProducts[0].count : 0;

      const products = await Products.aggregate([
        { $sort: { time: -1 } },
        { $skip: perPage * page - perPage },
        { $limit: perPage },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
        {
          $lookup: {
            from: "brands",
            localField: "brand",
            foreignField: "_id",
            as: "brand",
          },
        },
        { $unwind: "$brand" },
      ]);

      const totalPages = Math.ceil(totalProductsCount / perPage);

      res.render("admin/products", {
        products: products,
        totalPages: totalPages,
        currentPage: page,
        perPage: perPage,
      });
    } catch (err) {
      next(err);
    }
  },

  adminAddProduct: async (req, res) => {
    const category = await Category.find();
    const brands = await Brand.find();
    console.log("brands", brands);
    res.render("admin/addProduct", { cate: category, brands: brands });
  },

  adminAddProductPost: async (req, res) => {
    const existingProduct = await Products.findOne({ title: req.body.title });

    if (existingProduct) {
      res.render("admin/addProduct", {});
      console.log("Username already exists, Please try with another one");
    } else {
      const images = req.files.map((file) => file.filename);
      const product = new Products({
        title: req.body.title,
        description: req.body.description,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        color: req.body.color,
        stock: req.body.stock,
        fabric: req.body.fabric,
        style: req.body.style,
        oldPrice: req.body.oldPrice,
        offer: req.body.offer,
        images: images,
        variants: [
          { size: "S", stock: req.body.Sstock },
          { size: "M", stock: req.body.Mstock },
          { size: "L", stock: req.body.Lstock },
          { size: "XL", stock: req.body.XLstock },
        ],
      });

      try {
        await product.save();
        res.redirect("/addProduct");
      } catch (err) {
        console.log(err);
      }
    }
  },

  adminEditProduct: async (req, res) => {
    try {
      const id = req.params.id;
      const prod = await Products.findById(id);
      const category = await Category.find();
      const brands = await Brand.find();
      if (!prod) {
        res.redirect("/products");
        return;
      }
      res.render("admin/editProduct", {
        prod: prod,
        cate: category,
        brands: brands,
      });
    } catch (err) {
      console.log(err);
      res.redirect("/products");
    }
  },

  adminEditProductPost: async (req, res) => {
    let id = req.params.id;

    try {
      const images = req.files.map((file) => file.filename);
      const result = await Products.findByIdAndUpdate(id, {
        title: req.body.title,
        description: req.body.description,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        color: req.body.color,
        fabric: req.body.fabric,
        style: req.body.style,
        oldPrice: req.body.oldPrice,
        stock: req.body.stock,
        offer: req.body.offer,
        images: images,
        variants: [
          { size: "S", stock: req.body.Sstock },
          { size: "M", stock: req.body.Mstock },
          { size: "L", stock: req.body.Lstock },
          { size: "XL", stock: req.body.XLstock },
        ],
      });
      res.redirect("/products");
    } catch (err) {
      console.log("error:", err);
    }
  },

  publish: async (req, res) => {
    const id = req.params.id;
    const product = await Products.findByIdAndUpdate(id, { isPublished: true });
    return res.status(200).redirect("/products");
  },

  unpublish: async (req, res) => {
    const id = req.params.id;
    const category = await Products.findByIdAndUpdate(id, {
      isPublished: false,
    });
    return res.status(200).redirect("/products");
  },

  getProductsPagination: async (req, res, next) => {
    try {
      const perPage = 5;
      const page = req.query.page || 1;

      const totalProducts = await Products.aggregate([
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ]);

      const totalProductsCount =
        totalProducts.length > 0 ? totalProducts[0].count : 0;

      const products = await Products.aggregate([
        { $skip: perPage * page - perPage },
        { $limit: perPage },
      ]);

      const totalPages = Math.ceil(totalProductsCount / perPage);

      res.render("admin/products", {
        products: products,
        totalPages: totalPages,
        currentPage: page,
        perPage: perPage,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = { upload, productController };
