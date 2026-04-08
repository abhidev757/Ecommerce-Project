const Products = require("../../models/product");
const Category = require("../../models/category");

const productController = {
  homePage: async (req, res) => {
    const { wishlistCount, cartItemCount } = req;
    const prod = await Products.aggregate([
      { $match: { isPublished: true } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      { $match: { "category.isListed": true } },
    ]);

    req.session.checkoutBlock = false;
    res.render("users/homePage", {
      prod: prod,
      user: req.session.user || req.user,
      cartCount: cartItemCount,
      wishlistCount: wishlistCount,
      title: "Homepage",
    });
  },

  productDetails: async (req, res) => {
    const userId = req.session.userID;
    console.log("userID :" + userId);
    const { wishlistCount, cartItemCount } = req;
    try {
      const id = req.params.id;
      const prod = await Products.findById(id)
        .populate("category")
        .populate("brand")
        .lean();
      const prods = await Products.find({ isPublished: true }).populate({
        path: "category",
        match: { isListed: true },
      });

      if (!prod) {
        res.redirect("/");
        return;
      }
      res.render("users/productDetails", {
        prod: prod,
        prods: prods,
        user: req.session.user || req.user,
        wishlistCount: wishlistCount,
        cartCount: cartItemCount,
        title: "Product Details",
      });
    } catch (err) {
      console.log(err);
      res.redirect("/");
    }
  },

  stockInfo: async (req, res) => {
    try {
      const productId = req.body.productId;
      const selectedSize = req.query.size;

      const product = await Products.findById(productId).lean();

      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      const variant = product.variants.find((v) => v.size === selectedSize);

      if (!variant) {
        res.status(404).json({ error: "Variant not found" });
        return;
      }

      res.json({ stock: variant.stock });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  shop: async (req, res) => {
    const { wishlistCount, cartItemCount } = req;

    try {
      const category = req.params.category || undefined;
      const sort = req.query.sort;
      const page = req.params.page || 1;
      const limit = 6;
      const skip = (page - 1) * limit;

      let prod;
      let cate;

      let query = { isPublished: true };
      let sortOptions = {};

      if (sort === "lowToHigh") {
        sortOptions.price = 1;
      } else if (sort === "highToLow") {
        sortOptions.price = -1;
      }

      cate = await Category.find({ isListed: true });

      const listedCategoryIds = cate.map((category) => category._id);

      if (category) {
        const requestedCategory = await Category.findOne({
          _id: category,
          isListed: true,
        });
        if (!requestedCategory) {
          return res.render("users/shop", {
            prod: [],
            cate: cate,
            user: req.session.user,
            text: category,
            sort: sort,
            currentPage: page,
            totalPages: 0,
            title: "Shop",
          });
        }

        query.category = category;
      } else {
        query.category = { $in: listedCategoryIds };
      }

      prod = await Products.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate("category")
        .populate("brand");

      const totalProductsCount = await Products.countDocuments(query);
      const totalPages = Math.ceil(totalProductsCount / limit);

      console.log("Products:", prod);

      res.render("users/shop", {
        prod: prod,
        cate: cate,
        user: req.session.user,
        text: category,
        sort: sort,
        currentPage: page,
        totalPages: totalPages,
        wishlistCount: wishlistCount,
        cartCount: cartItemCount,
        title: "Shop",
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).send("Internal Server Error");
    }
  },

  searchProduct: async (req, res) => {
    try {
      const { wishlistCount, cartItemCount } = req;
      const searchTerm = req.query.q;

      const searchResults = await Products.find({
        $or: [
          { product: { $regex: searchTerm, $options: "i" } },
          { description: { $regex: searchTerm, $options: "i" } },
        ],
      }).exec();

      res.render("users/search", {
        prod: searchResults,
        user: req.session.user,
        cartCount: cartItemCount,
        wishlistCount: wishlistCount,
        title: "Search",
      });
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};

module.exports = productController;
