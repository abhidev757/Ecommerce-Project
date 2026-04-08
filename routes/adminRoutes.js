const express = require("express");
const router = express.Router();
const nocache = require("nocache");
const isAdmin = require("../middlewares/adminAuth");

// Import granular admin controllers
const adminAuthController = require("../controller/admin/authController");
const { upload, productController } = require("../controller/admin/productController");
const categoryController = require("../controller/admin/categoryController");
const customerController = require("../controller/admin/customerController");
const orderController = require("../controller/admin/orderController");
const couponController = require("../controller/admin/couponController");
const brandController = require("../controller/admin/brandController");
const reportController = require("../controller/admin/reportController");
const dashController = require("../controller/admin/dashboardController");


// Auth
router.get("/adminLogin", adminAuthController.adminLogin);
router.get("/adminLogout", adminAuthController.adminLogout);
router.post("/adminLoginPost", adminAuthController.adminLoginPost);

// Dashboard
router.get("/adminHome", isAdmin, dashController.getDashboard);
router.get("/fetchdashboard", isAdmin, dashController.fetchDashboard);
router.get("/dashboard", isAdmin, dashController.getDashboard);

// Product
router.get("/products", isAdmin, productController.adminProducts);
router.get("/addProduct", isAdmin, productController.adminAddProduct);
router.post("/addProductPost", upload, productController.adminAddProductPost);
router.get("/editProduct/:id", productController.adminEditProduct);
router.post("/editProductPost/:id", upload, productController.adminEditProductPost);
router.get("/publish/:id", productController.publish);
router.get("/unpublish/:id", productController.unpublish);
router.get("/products/:page", isAdmin, productController.getProductsPagination);

// Category
router.get("/category", isAdmin, categoryController.adminCategory);
router.get("/addCategory", isAdmin, categoryController.adminAddCategory);
router.post("/addCategoryPost", categoryController.adminAddCategoryPost);
router.get("/editCategory/:id", isAdmin, categoryController.adminEditCategory);
router.post("/editCategoryPost/:id", categoryController.adminEditCategoryPost);
router.get("/list/:id", categoryController.list);
router.get("/unlist/:id", categoryController.unlist);

// Customers
router.get("/customer", isAdmin, customerController.adminCustomer);
router.get("/blockUser/:id", customerController.blockUser);
router.get("/unblockUser/:id", customerController.unblockUser);

// Orders
router.get("/orders", isAdmin, orderController.orders);
router.get("/orders/:page", isAdmin, orderController.getOrdersPagination);
router.get("/adminOrderDetails/:orderId", isAdmin, orderController.adminOrdersDetails);
router.post("/updateStatus", orderController.updateStatus);
router.get("/adminOrderCancel/:orderId", orderController.adminOrderCancel);

// Coupons
router.get("/coupons", isAdmin, couponController.coupons);
router.get("/addCoupon", isAdmin, couponController.addCoupon);
router.post("/addCouponPost", isAdmin, couponController.addCouponPost);
router.get("/editCoupon/:id", isAdmin, couponController.editCoupon);
router.post("/editCouponPost/:id", couponController.editCouponPost);
router.get("/couponList/:id", couponController.couponList);
router.get("/couponUnlist/:id", couponController.couponUnlist);

// Brand
router.get("/brand", isAdmin, brandController.adminBrand);
router.get("/addBrand", isAdmin, brandController.adminAddBrand);
router.post("/addBrandPost", brandController.adminAddBrandPost);
router.get("/editBrand/:id", isAdmin, brandController.adminEditBrand);
router.post("/editBrandPost/:id", brandController.adminEditBrandPost);
router.get("/brandList/:id", brandController.brandList);
router.get("/brandUnlist/:id", brandController.brandUnlist);

// Reports / Best Selling
router.post("/generate-report", reportController.generateReport);
router.get("/bestCategory", isAdmin, reportController.bestCategory);
router.get("/bestProduct", isAdmin, reportController.bestProduct);
router.get("/bestBrand", isAdmin, reportController.bestBrand);

module.exports = router;