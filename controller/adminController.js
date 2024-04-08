const Users = require("../models/users");
const Category = require("../models/category");
const Products = require("../models/product");
const Order = require("../models/orders");
const Coupon = require("../models/coupon");
const Brand = require("../models/brand");
const Wallet = require("../models/wallet");
const multer = require("multer");
const PDFDocument = require("pdfkit");
const fs = require("fs")

let storage =  multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,"./public/uploads");
    },
    filename: function (req, file, cb){
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname)
    }
})

let upload = multer({
    storage:storage,
}).array("images",3)

const credential = {
  email: "admin@gmail.com",
  password: "123456",
};
//-------------------------------------------------------------------Admin--------------------------------------------------------------------//
const adminController = {
  adminLogin: (req,res)=>{
    if(!req.session.admin){
        res.render('admin/adminLogin');
    }else{
        res.render('admin/dashboard');
    }
},
  adminLoginPost: (req,res)=>{
    if(req.body.email == credential.email &&
        req.body.password == credential.password)
        {
            req.session.admin = req.body.email;
            res.redirect('/dashboard');
    }else{
        res.render('admin/adminLogin',{error: "Invalid Username or Password"})
    }
},
//   adminDashboard: async(req,res)=>{
//     if(!req.session.admin){
//         res.render('admin/adminLogin');
//     }else{
//       try {
//         const ordersCount = await Order.countDocuments({});
//         const customers = await Users.countDocuments({});
//         const productsCount = await Products.countDocuments({})

        
//         const Revenue = await Order.aggregate([
//             {
//                 $group: {
//                     _id: null,
//                     totalAmount: { $sum: "$totalPrice" }
//                 }
//             }
//         ]);

//         // Extracting total revenue from the aggregation result
//         const totalRevenue = Revenue.length > 0 ? Revenue[0].totalAmount : 0;

//         res.render('admin/dashboard', { ordersCount, totalRevenue,customers,productsCount });
//     } catch (error) {
//         console.error("Error:", error);
//         res.status(500).send("Internal Server Error");
//     }

//     }
// },

// generateReport: async (req, res) => {
//   try {
//     const { startDate, endDate } = req.body;

//     const orders = await Order.find({
//       orderDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
//     }).populate('items.product');

//     const doc = new PDFDocument();
//     const writeStream = fs.createWriteStream('./temp/report.pdf');
//     doc.pipe(writeStream);

//     doc.fontSize(12).text('Order Details Report', { align: 'center' });
//     doc.moveDown();
//     doc.text(`Start Date: ${startDate}`);
//     doc.text(`End Date: ${endDate}`);
    
//     doc.moveDown();

//     if (orders.length === 0) {
//       doc.fontSize(24).fillColor('#666666').text('No records found', { align: 'center' });
//     } else {
//       orders.forEach(order => {
//         const orderDetails = `Order ID: ${order._id}, Order Date: ${order.orderDate.toDateString()}, Payment Status: ${order.paymentStatus}`;
//         doc.text(orderDetails);
//         order.items.forEach(item => {
//           const itemDetails = `Product: ${item.product.title}, Quantity: ${item.quantity}, Price: ${item.price}`;
//           doc.text(itemDetails);
//         });

//         doc.moveDown();
//       });
//     }

//     doc.end();

//     res.json({ reportUrl: './temp/report.pdf' });
//   } catch (err) {
//     console.error('Error generating report:', err);
//     res.status(500).json({ error: 'Failed to generate report' });
//   }
// }
// ,



generateReport : async (req, res) => {
  try {
    console.log("WORKING");
      const { startDate, endDate } = req.body;

      console.log("Start Date: " , startDate);
      console.log("End Date: " , endDate);

      // Fetch orders from the database based on the provided date range
      const orders = await Order.find({
          orderDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }).populate('items.product');

      console.log("orders: " , orders);

      // Process fetched orders to extract necessary information for the report
      const reportData = orders.map((order, index) => {
          let totalPrice = 0;
          order.items.forEach(product => {
              totalPrice += product.product.price * product.quantity;
          });

          return {
              orderId: order._id,
              date: order.orderDate,
              totalPrice,
              products: order.items.map(product => {
                  return {
                      productName: product.product.title,
                      quantity: product.quantity,
                      price: product.price
                  };
              }),
              firstName: order.billingDetails.name,
              address: order.billingDetails.address,
              paymentMethod: order.paymentMethod,
              paymentStatus: order.paymentStatus
          };
      });

      console.log("Report Data: " , reportData);
      res.status(200).json({ reportData });
  } catch (err) {
      console.error('Error generating report:', err);
      res.status(500).json({ error: 'Failed to generate report' });
  }
},


adminLogout: (req,res)=>{
  
  if(req.session.admin){
    req.session.admin = null;
    res.render('admin/adminLogin');
}else{
    res.render('admin/adminLogin');
}
},
   //----------------------------------------------------------------PRODUCT-----------------------------------------------------------------------
  adminProducts: async (req, res) => {
    try {
      const perPage = 5;
      const page = req.query.page || 1;

      const totalProducts = await Products.aggregate([
        {
          $group: {
            _id: null,
            count: { $sum: 1 }
          }
        }
      ]);

      const totalProductsCount = totalProducts.length > 0 ? totalProducts[0].count : 0;

      const products = await Products.aggregate([
        { $sort: { time: -1 } },
        {
          $skip: perPage * page - perPage
        },
        {
          $limit: perPage
        },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category"
          }
        },
        {
          $unwind: "$category"
        },
        {
          $lookup: {
            from: "brands",
            localField: "brand",
            foreignField: "_id",
            as: "brand"
          }
        },
        {
          $unwind: "$brand"
        }
       
        
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
    const category = await Category.find()
    const brands = await Brand.find()
    console.log("brands",brands);
    res.render("admin/addProduct",{cate:category,brands:brands});
  },
  adminAddProductPost: async (req, res) => {
    const existingProduct = await Products.findOne({ title: req.body.title });

    if (existingProduct) {
      res.render("admin/addProduct", {});
      console.log("Username already exists, Please try with another one");
    } else {
      const images = req.files.map(file => file.filename);
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
          { size: "M", stock:  req.body.Mstock },
          { size: "L", stock:  req.body.Lstock },
          { size: "XL", stock:  req.body.XLstock },
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
  adminEditProduct: async (req,res)=>{
   try{
    const id = req.params.id;
    const prod = await Products.findById(id)
    const category = await Category.find()
    const brands = await Brand.find()
    if(!prod){
        res.redirect("/products")
        return
    }
        res.render("admin/editProduct",{prod:prod,cate:category,brands:brands})
   }catch(err){
    console.log(err);
    redirect("/products")
   }
  },
  adminEditProductPost: async (req, res) => {
    let id = req.params.id;

    try {
      const images = req.files.map(file => file.filename);
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
            images:images,
            variants: [
              { size: "S", stock: req.body.Sstock },
              { size: "M", stock:  req.body.Mstock },
              { size: "L", stock:  req.body.Lstock },
              { size: "XL", stock:  req.body.XLstock },
            ],
        });
        res.redirect('/products');
    } catch (err) {
        console.log("error:",err);
    }
},
 publish: async (req, res) => {
  const id = req.params.id;
  const product = await Products.findByIdAndUpdate(id,{isPublished:true});
  return res.status(200).redirect("/products");
},
unpublish: async (req, res) => {
  const id = req.params.id;
  const category = await Products.findByIdAndUpdate(id,{isPublished:false});
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
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalProductsCount = totalProducts.length > 0 ? totalProducts[0].count : 0;
    
    const products = await Products.aggregate([
      {
        $skip: perPage * page - perPage
      },
      {
        $limit: perPage
      }
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


  //-----------------------------------------------------------------CATEGORY----------------------------------------------------------
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
  adminEditCategory: async (req,res)=>{
    try{
     const id = req.params.id;
     const catNdec = await Category.findById(id)
     if(!catNdec){
         res.redirect("/category")
         return
     }
         res.render("admin/editCategory",{data:catNdec})
    }catch(err){
     console.log(err);
     res.redirect("/category")
    }
   },
  adminEditCategoryPost: async (req,res)=>{
    let id = req.params.id;

    try {
        const result = await Category.findByIdAndUpdate(id, {
            description: req.body.description,
            category: req.body.category,
        });
        res.redirect('/category');
    } catch (err) {
        console.log("error:",err);
    }
  }, 
  unlist: async (req, res) => {
    const id = req.params.id;
    const category = await Category.findByIdAndUpdate(id,{isListed:false});
    // req.session.user = null;
    res.redirect("/category")
  },
  list: async (req, res) => {
    const id = req.params.id;
    const category = await Category.findByIdAndUpdate(id,{isListed:true});
    res.redirect("/category")
  },
 

  //-----------------------------------------------------------------------CUSTOMER---------------------------------------------------
  adminCustomer: async (req, res) => {
    const users = await Users.find();
    res.render("admin/customer", { users: users });
  },
  blockUser: async (req, res) => {
    const id = req.params.id;
    const user = await Users.findByIdAndUpdate(id,{isBlocked:true});
    req.session.user = null;
    res.redirect("/customer")
  },
  unblockUser: async (req, res) => {
    const id = req.params.id;
    const user = await Users.findByIdAndUpdate(id,{isBlocked:false});
    res.redirect("/customer")
  },

  //-------------------------------------------------------------------------ORDERS-------------------------------------------------------------
  orders: async (req, res) => {
    const perPage = 5;
    const page = req.query.page || 1;
  
    try {
      const totalOrders = await Order.countDocuments();
  
      const orders = await Order.aggregate([
        { $sort: { orderDate: -1 } },
        { $skip: perPage * page - perPage },
        { $limit: perPage }
      ]);
  
      const totalPages = Math.ceil(totalOrders / perPage);
  
      res.render("admin/orders", {
        title: "Orders",
        orders: orders,
        totalPages: totalPages,
        currentPage: page,
        perPage: perPage,
      });
    } catch (err) {
      next(err);
    }
  },

  adminOrderCancel: async (req,res)=>{
    const orderId = req.params.orderId;

    try {
      const order = await Order.findById(orderId);
      
      if (!order) {
          return res.status(404).json({ message: "Order not found" });
      }

      if (order.paymentStatus === 'Paid') {
          const wallet = await Wallet.findOne({ userId: order.userID });

          if (!wallet) {
              return res.status(404).json({ error: 'Wallet not found for user' });
          }

          wallet.balance += order.totalPrice;
          await wallet.save();
      }

      for (const item of order.items) {
          await Products.findByIdAndUpdate(
              item.product,
              { $inc: { stock: item.quantity } }
          );
      }

      order.status = "Cancelled";
      await order.save();

      return res.status(200).redirect("/orders");
  } catch (err) {
      next(err);
  }
},

  getOrdersPagination: async (req, res, next) => {
    const perPage = 5;
    const page = req.query.page || 1;
  
    try {
      const totalOrders = await Order.countDocuments();
  
      const orders = await Order.aggregate([
        { $sort: { orderDate: -1 } },
        { $skip: perPage * page - perPage },
        { $limit: perPage }
      ]);
  
      const totalPages = Math.ceil(totalOrders / perPage);
  
      res.render("admin/orders", {
        orders: orders,
        totalPages: totalPages,
        currentPage: page,
        perPage: perPage,
      });
    } catch (err) {
      next(err);
    }
  },
  adminOrdersDetails: async (req, res) => {
    const orderId = req.params.orderId;
    const users = await Users.find();
    const orders = await Order.findById(orderId).populate('items.product');
    console.log(orders);
    res.render("admin/adminOrderDetails", {
       users: users,
       orders: orders,
      });
  },
updateStatus: async (req, res, next) => {
  try {
    const { orderId, selectedStatus } = req.body;
    console.log(req.body);

    const order = await Order.findById(orderId).populate('items.product');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (selectedStatus === 'Cancelled') {
      // Increment stock for each product in the order
      // for (const item of order.items) {
      //   const product = await Products.findById(item.product);
      //   if (product) {
      //     product.stock += item.quantity;
      //     await product.save();
      //   }
      // }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: { status: selectedStatus } },
      { new: true }
    );

    if (updatedOrder) {
      res.redirect("/adminOrderDetails")
    } else {
      res.status(404).json({ success: false, message: 'Order not found' });
    }
  } catch (err) {
    next(err);
  }
},
//------------------------------------------------------------------Coupons-------------------------------------------------------
coupons: async (req, res) => {
  const Data = await Coupon.find();
  res.render("admin/coupon", { data: Data });
},
addCoupon: async (req, res) => {
  const category = await Category.find()
  res.render("admin/addCoupon",{cate:category});
},
addCouponPost: async (req, res) => {
  try {
    const existingCoupon = await Coupon.findOne({ couponCode: req.body.couponCode });

    if (existingCoupon) {
      console.log("Coupon already exists, Please try with another one");
      return res.render("admin/addCoupon", {});
    } else {
      const coupon = new Coupon({
        couponCode: req.body.couponCode,
        description: req.body.description,
        discountPercentage: req.body.discount,
        maxDiscountAmount: req.body.maxAmount,
        minAmount: req.body.minAmount,
        expiryDate: req.body.expiryDate
      });

      await coupon.save();
      console.log("Coupon added successfully");
      return res.redirect("/addCoupon");
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
},
editCoupon: async (req,res)=>{
  try{
   const id = req.params.id;
   const coupon = await Coupon.findById(id)
   if(!coupon){
       res.redirect("/coupons")
       return
   }
       res.render("admin/editCoupon",{coupon:coupon})
  }catch(err){
   console.log(err);
   res.redirect("/coupons")
  }
 },
 editCouponPost: async (req, res) => {
  let id = req.params.id;

  try {
      const result = await Coupon.findByIdAndUpdate(id, {
        couponCode: req.body.couponCode,
        description: req.body.description,
        discountPercentage: req.body.discount,
        maxDiscountAmount: req.body.maxAmount,
        minAmount: req.body.minAmount,
        expiryDate: req.body.expiryDate
      });
      res.redirect('/coupons');
  } catch (err) {
      console.log("error:",err);
  }
},
couponList: async (req, res) => {
  const id = req.params.id;
  const coupon = await Coupon.findByIdAndUpdate(id,{isListed:true});
  res.redirect("/coupons")
},
couponUnlist: async (req, res) => {
  const id = req.params.id;
  const coupon = await Coupon.findByIdAndUpdate(id,{isListed:false});
  res.redirect("/coupons")
},
//==============================================================Brand==========================================================
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
adminEditBrand: async (req,res)=>{
  try{
   const id = req.params.id;
   const brands = await Brand.findById(id)
   if(!brands){
       res.redirect("/brand")
       return
   }
       res.render("admin/editBrand",{data:brands})
  }catch(err){
   console.log(err);
   res.redirect("/brand")
  }
 },
adminEditBrandPost: async (req,res)=>{
  let id = req.params.id;

  try {
      const result = await Brand.findByIdAndUpdate(id, {
          description: req.body.description,
          brand: req.body.brand,
      });
      res.redirect('/brand');
  } catch (err) {
      console.log("error:",err);
  }
}, 
brandUnlist: async (req, res) => {
  const id = req.params.id;
  const brand = await Brand.findByIdAndUpdate(id,{isListed:false});
  // req.session.user = null;
  res.redirect("/brand")
},
brandList: async (req, res) => {
  const id = req.params.id;
  const brand = await Brand.findByIdAndUpdate(id,{isListed:true});
  res.redirect("/brand")
},
//==========================================================BestSelling======================================================
bestCategory: async (req, res) => {
  try {
    const bestSellingCategories = await Order.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          totalQuantity: { $sum: '$items.quantity' },
        },
      },
      {
        $sort: { totalQuantity: -1 },
      },
      {
        $limit: 10, 
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          _id: '$category._id',
          category: '$category.category',
          totalQuantity: 1,
        },
      },
    ]);
    res.render('admin/bestcategory', { title: "Best Categories",bestSellingCategories });
  } catch (err) {
    next(err);
  }
},
bestProduct: async (req, res) => {
  try {
    const bestSellingProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }, 
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: '$product._id',
          productTitle: '$product.title',
          totalQuantity: 1,
        },
      },
    ]);

    res.render("admin/bestProduct",{title: "Best Products", bestSellingProducts });
  } catch (err) {
    next(err);
  }
},
bestBrand: async (req, res) => {
  try {
    const bestSellingBrands = await Order.aggregate([
        { $unwind: '$items' },
        {
            $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'product',
            },
        },
        { $unwind: '$product' },
        {
            $group: {
                _id: '$product.brand',
                totalQuantity: { $sum: '$items.quantity' },
            },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: 'brands',
                localField: '_id',
                foreignField: '_id',
                as: 'brand',
            },
        },
        { $unwind: '$brand' },
        {
            $project: {
                _id: '$brand._id',
                brandName: '$brand.brand',
                totalQuantity: 1,
            },
        },
    ]);
    res.render('admin/bestBrand', {title: "Best Brands", bestSellingBrands });
} catch (err) {
    next(err);
}
},



}; 

module.exports = {upload,adminController}
