const Cart = require("../models/cart");
const Wishlist = require("../models/wishlist");

const calculateItemCounts = async (req, res, next) => {
    try {
        const userId = req.session.userID;
        const carts = await Cart.find({ userId });
        const wishlists = await Wishlist.find({ userId });

        let cartItemCount = 0;
        for (const cart of carts) {
            cartItemCount += cart.items.length;
        }

        let wishlistItemCount = 0;
        for (const wishlist of wishlists) {
            wishlistItemCount += wishlist.items.length;
        }

        // Set these counts on the request object to be used in routes
        req.cartItemCount = cartItemCount;
        req.wishlistCount = wishlistItemCount;

        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        // Handle any errors
        console.error("Error calculating item counts:", error);
        next(error);
    }
};

module.exports = calculateItemCounts;