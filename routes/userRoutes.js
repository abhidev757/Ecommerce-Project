const express = require("express");
const router = express.Router();
const nocache = require("nocache");
const passport = require("passport");
const authController = require("../middlewares/passportSetup");
const isUser = require("../middlewares/userAuth");
const itemsCount = require("../middlewares/itemsCount");
const downloadLimiter = require("../middlewares/downloadLimiter");

// Import granular user controllers
const userAuthController = require("../controller/user/authController");
const productController = require("../controller/user/productController");
const profileController = require("../controller/user/profileController");
const orderController = require("../controller/user/orderController");
const cartController = require("../controller/user/cartController");
const walletController = require("../controller/user/walletController");
const wishlistController = require("../controller/user/wishlistController");
const couponController = require("../controller/user/couponController");


// Auth
router.get("/userLogin", userAuthController.userLogin);
router.post("/userLoginPost", userAuthController.userLoginPost);
router.post("/submit", userAuthController.postUserSignup);
router.get("/otp", userAuthController.otp);
router.post("/otpVerification", userAuthController.otpVerification);
router.get("/logout", userAuthController.logout);
router.get("/resetPassword", userAuthController.resetPassword);
router.post("/resetPasswordPost", userAuthController.resetPasswordPost);

// Google Auth
router.get("/auth/google", authController.googleAuth);
router.get("/google/callback", authController.googleAuthCallback);

// Product
router.get("/", itemsCount, productController.homePage);
router.get("/productDetails/:id", itemsCount, productController.productDetails);
router.get("/getStockInfo", productController.stockInfo);
router.get("/shop/:page?", itemsCount, productController.shop);
router.get("/categoryFilter/:category", itemsCount, productController.shop);
router.get("/priceFilter/:category?", itemsCount, productController.shop);
router.get("/search", itemsCount, productController.searchProduct);

// My Account / Profile
router.get("/userProfile", itemsCount, isUser, profileController.userProfile);
router.post("/editProfile", isUser, profileController.editProfile);
router.post("/changePassword/:id", profileController.changePassword);
router.get("/myAddress", itemsCount, isUser, profileController.myAddress);
router.post("/addAddressPost", profileController.addAddressPost);
router.get("/addAddress", itemsCount, isUser, profileController.addAddress);
router.get("/editAddress/:addressId/:index", itemsCount, isUser, profileController.editAddress);
router.get("/deleteAddress/:addressId", isUser, profileController.deleteAddress);
router.post("/editAddress/:addressId", profileController.editAddressPost);

// Orders
router.get("/ordersProfile", itemsCount, isUser, orderController.ordersProfile);
router.get("/orderDetails/:orderId", itemsCount, isUser, orderController.orderDetails);
router.get("/downloadinvoice/:orderId", downloadLimiter, isUser, orderController.getOrderInvoice);
router.get("/checkout", itemsCount, isUser, orderController.checkout);
router.post("/placeOrder", isUser, orderController.placeOrder);
router.get("/cancelOrder/:orderId", isUser, orderController.cancleOrder);
router.post("/returnOrder/:orderId", isUser, orderController.returnOrder);
router.get("/thankyou", isUser, orderController.thankyou);

// Cart
router.get("/cart", itemsCount, isUser, cartController.cart);
router.get("/addToCart/:id", isUser, itemsCount, cartController.addToCart);
router.get("/check-stock/:id", cartController.checkStock);
router.post("/removeProduct/:id", isUser, cartController.removeProduct);
router.post("/updateQuantity/:id/:action", cartController.updateQuantity);

// Wallet
router.get("/wallet", itemsCount, isUser, walletController.wallet);
router.post("/addAmount", isUser, walletController.addAmount);
router.get("/check-wallet-balance", itemsCount, isUser, walletController.checkWalletBalance);

// Wishlist
router.get("/wishlist", itemsCount, isUser, wishlistController.wishlist);
router.get("/addToWishlist/:id", isUser, wishlistController.addToWishlist);
router.get("/removeWishlistProduct", isUser, wishlistController.removeWishlistProduct);

// Coupon
router.get("/getCoupons", isUser, couponController.getCoupons);
router.post("/applyCoupon", isUser, couponController.applyCoupon);
router.post("/cancelCoupon", isUser, couponController.cancelCoupon);

module.exports = router;