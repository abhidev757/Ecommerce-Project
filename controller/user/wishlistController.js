const Wishlist = require("../../models/wishlist");
const Products = require("../../models/product");

const wishlistController = {
  wishlist: async (req, res) => {
    const { wishlistCount, cartItemCount } = req;
    const userId = req.session.userID;
    const WishlistItems = await Wishlist.find({ userId: userId }).populate(
      "items.product"
    );
    res.render("users/wishlist", {
      WishlistItems: WishlistItems,
      user: req.session.user || req.user,
      cartCount: cartItemCount,
      wishlistCount: wishlistCount,
      title: "My Wishlist",
    });
  },

  addToWishlist: async (req, res, next) => {
    try {
      const userId = req.session.userID;
      const productID = req.params.id;
      await Products.findByIdAndUpdate(productID, { inWishlist: true });
      const product = await Products.findById(productID);
      let userWishlist = await Wishlist.findOne({ userId: userId });

      if (!userWishlist) {
        const newWishlist = new Wishlist({
          userId: userId,
          items: [
            {
              product: productID,
              price: product.price,
            },
          ],
        });

        await newWishlist.save();
      } else {
        const existingProduct = userWishlist.items.find(
          (item) => item.product.toString() === productID.toString()
        );

        if (existingProduct) {
          return res.status(200).json({
            success: false,
            message: "Product already exist in wishlist",
          });
        } else {
          userWishlist.items.push({
            product: productID,
            price: product.price,
          });
        }

        await userWishlist.save();

        return res.status(200).json({ success: true });
      }
    } catch (err) {
      next(err);
    }
  },

  removeWishlistProduct: async (req, res) => {
    try {
      const userId = req.session.userID;
      const productId = req.query.productId;
      const itemId = req.query.itemId;
      console.log(itemId);
      console.log("ProductID:" + productId);

      try {
        await Products.findByIdAndUpdate(productId, { inWishlist: false });
      } catch (updateError) {
        console.error(
          "Error updating product inWishlist status:",
          updateError
        );
      }

      let userWishlist = await Wishlist.findOne({ userId: userId });

      if (userWishlist) {
        const productInWishlistIndex = userWishlist.items.findIndex(
          (item) => item._id.toString() === itemId
        );

        if (productInWishlistIndex !== -1) {
          userWishlist.items.splice(productInWishlistIndex, 1);
          await userWishlist.save();

          res.redirect("/wishlist");
        } else {
          res.json({
            success: false,
            message: "Product not found in the cart",
          });
        }
      } else {
        res.json({ success: false, message: "User Wishlist not found" });
      }
    } catch (error) {
      console.error("Error deleting product from Wishlist:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },
};

module.exports = wishlistController;
