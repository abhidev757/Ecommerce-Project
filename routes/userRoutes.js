const express = require("express");
const router = express.Router();
const nocache = require("nocache");
const userController = require("../controller/userController")
const passport = require("passport")
const authController = require("../middlewares/passportSetup");
const isUser = require("../middlewares/userAuth");
const itemsCount = require("../middlewares/itemsCount");
const downloadLimiter = require("../middlewares/downloadLimiter");



router.get("/",itemsCount,userController.homePage);

router.get("/userLogin",userController.userLogin);
router.post("/userLoginPost",userController.userLoginPost);
router.post("/submit",userController.postUserSignup);
router.get("/otp",userController.otp);
router.post("/otpVerification",userController.otpVerification);
router.get('/logout', userController.logout);
router.get('/resetPassword', userController.resetPassword);
router.post('/resetPasswordPost', userController.resetPasswordPost);

//google auth
router.get('/auth/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback);


//Product
router.get("/productDetails/:id",itemsCount,userController.productDetails);
router.get("/getStockInfo",userController.stockInfo);
router.get("/shop/:page?",itemsCount,userController.shop);
router.get('/categoryFilter/:category',itemsCount, userController.shop);
router.get('/priceFilter/:category?',itemsCount, userController.shop);

//Myaccount
router.get("/userProfile",itemsCount,isUser,userController.userProfile);
router.post("/editProfile",isUser,userController.editProfile);
router.post("/changePassword/:id",userController.changePassword);
router.get("/myAddress",itemsCount,isUser,userController.myAddress);
router.post("/addAddressPost",userController.addAddressPost);
router.get("/addAddress",itemsCount,isUser,userController.addAddress);
router.get("/editAddress/:addressId/:index",itemsCount,isUser,userController.editAddress);
router.get('/deleteAddress/:addressId',isUser, userController.deleteAddress);
router.post("/editAddress/:addressId",userController.editAddressPost);
router.get("/ordersProfile",itemsCount,isUser,userController.ordersProfile);
router.get("/orderDetails/:orderId",itemsCount,isUser,userController.orderDetails);
router.get('/downloadinvoice/:orderId',downloadLimiter,isUser,userController.getOrderInvoice)

//Cart
router.get("/cart",itemsCount,isUser,userController.cart);
router.get("/addToCart/:id",isUser,itemsCount,userController.addToCart);
router.get("/check-stock/:id", userController.checkStock);
router.post("/removeProduct/:id",isUser,userController.removeProduct);
router.post("/updateQuantity/:id/:action", userController.updateQuantity);

//Checkout
router.get("/checkout",itemsCount,isUser,userController.checkout);
router.post("/placeOrder",isUser,userController.placeOrder);
router.get("/cancelOrder/:orderId",isUser,userController.cancleOrder);
router.post("/returnOrder/:orderId",isUser,userController.returnOrder);
router.get("/thankyou",isUser,userController.thankyou);

  
//Wallet
router.get("/wallet",itemsCount,isUser, userController.wallet);
router.post("/addAmount",isUser, userController.addAmount);
router.get("/check-wallet-balance",itemsCount,isUser, userController.checkWalletBalance);

//Wishlist
router.get("/wishlist",itemsCount,isUser,userController.wishlist);
router.get("/addToWishlist/:id",isUser,userController.addToWishlist);
router.get("/removeWishlistProduct",isUser,userController.removeWishlistProduct);

//Coupon
router.get("/getCoupons",isUser, userController.getCoupons);
router.post("/applyCoupon",isUser, userController.applyCoupon);
router.post("/cancelCoupon",isUser, userController.cancelCoupon);

//Search
router.get('/search',itemsCount,userController.searchProduct)

module.exports = router;