const express = require("express");
const router = express.Router();
const nocache = require("nocache");
const {upload, adminController} = require("../controller/adminController")
const isAdmin = require("../middlewares/adminAuth");
const dashController = require("../controller/dashboardController")


//admin
router.get("/adminLogin",adminController.adminLogin);
router.get("/adminLogout",adminController.adminLogout);
router.post("/adminLoginPost",adminController.adminLoginPost);
// router.get("/dashboard",adminController.adminDashboard);
router.post("/generate-report",adminController.generateReport);
router.get("/adminHome",isAdmin, dashController.getDashboard);
router.get("/fetchdashboard",isAdmin, dashController.fetchDashboard)
router.get("/dashboard",isAdmin, dashController.getDashboard)

//product
router.get("/products",isAdmin,adminController.adminProducts);
router.get("/addProduct",isAdmin,adminController.adminAddProduct);
router.post("/addProductPost",upload,adminController.adminAddProductPost);
router.get("/editProduct/:id",adminController.adminEditProduct);
router.post("/editProductPost/:id",upload,adminController.adminEditProductPost);
router.get("/publish/:id",adminController.publish);
router.get("/unpublish/:id",adminController.unpublish);
router.get("/products/:page",isAdmin, adminController.getProductsPagination);

//category
router.get("/category",isAdmin,adminController.adminCategory);
router.get("/addCategory",isAdmin,adminController.adminAddCategory);
router.post("/addCategoryPost",adminController.adminAddCategoryPost);
router.get("/editCategory/:id",isAdmin,adminController.adminEditCategory);
router.post("/editCategoryPost/:id",adminController.adminEditCategoryPost);
router.get("/list/:id",adminController.list)
router.get("/unlist/:id",adminController.unlist)

//customers
router.get("/customer",isAdmin,adminController.adminCustomer);
router.get("/blockUser/:id",adminController.blockUser);
router.get("/unblockUser/:id",adminController.unblockUser);

//Orders
router.get("/orders",isAdmin,adminController.orders);
router.get("/orders/:page",isAdmin, adminController.getOrdersPagination);
router.get("/adminOrderDetails/:orderId",isAdmin,adminController.adminOrdersDetails);
router.post("/updateStatus",adminController.updateStatus);
router.get("/adminOrderCancel/:orderId",adminController.adminOrderCancel);

//Coupons
router.get("/coupons",isAdmin,adminController.coupons);
router.get("/addCoupon",isAdmin,adminController.addCoupon);
router.post("/addCouponPost",isAdmin,adminController.addCouponPost);
router.get("/editCoupon/:id",isAdmin,adminController.editCoupon);
router.post("/editCouponPost/:id",adminController.editCouponPost);
router.get("/couponList/:id",adminController.couponList)
router.get("/couponUnlist/:id",adminController.couponUnlist)

//Brand
router.get("/brand",isAdmin,adminController.adminBrand);
router.get("/addBrand",isAdmin,adminController.adminAddBrand);
router.post("/addBrandPost",adminController.adminAddBrandPost);
router.get("/editBrand/:id",isAdmin,adminController.adminEditBrand);
router.post("/editBrandPost/:id",adminController.adminEditBrandPost);
router.get("/brandList/:id",adminController.brandList)
router.get("/brandUnlist/:id",adminController.brandUnlist)

//BestSelling
router.get("/bestCategory",isAdmin,adminController.bestCategory);
router.get("/bestProduct",isAdmin,adminController.bestProduct);
router.get("/bestBrand",isAdmin,adminController.bestBrand);

module.exports = router;