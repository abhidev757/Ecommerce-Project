const User = require("../models/users");
const googleUser = require("../models/googleAuthUsers");
const Address = require("../models/address");
const Cart = require("../models/cart");
const Order = require("../models/orders");
const Category = require("../models/category");
const Wallet = require("../models/wallet");
const Wishlist = require("../models/wishlist");
const Coupon = require("../models/coupon");
const Transaction = require("../models/transactions");
const saltPassword = 10;
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
require("dotenv").config();
const { generateOTP } = require("../middlewares/otpgenerator");
const Products = require("../models/product");
const passport = require("passport");
const easyinvoice = require("easyinvoice");
const path = require('path');
const fs = require('fs');
const ejs = require("ejs");
const pdf = require("html-pdf");
const { type } = require("os");



const userController = {
  userSignup: (req, res) => {
    res.render("users/userLogin",{ title: "Login" });
  },
  userLogin: (req, res) => {
    res.render("users/userLogin",{ title: "Login" });
  },
  resetPassword: (req, res) => {
    res.render("users/resetPassword",{ title: "Reset Password" });
  },
  resetPasswordPost: async (req, res) => {
    try {
      const data = await User.findOne({ email: req.body.email });
      if (!data) {
        res.render("users/resetPassword", {
          signup: "Account Doesn't Exist, Please signup",
          title: "Reset Password"
        });
      } else if (data.isBlocked) {
        res.render("users/resetPassword", {
          signup: "your acc blocked",
          title: "Reset Password"
        });
      } else {
        const emailMatch = await User.findOne({ email: req.body.email });

        if (emailMatch) {
          const hashedPassword = await bcrypt.hash(req.body.password, saltPassword);
          
          data.password = hashedPassword;
      
        try {
          await data.save();
          res.redirect("/userLogin");
        } catch (err) {
          console.log(err);
        }
        } else {
          res.render("users/resetPassword",{title: "Reset Password"});
          console.log("pass or email incorrect");
        }
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },

  userLoginPost: async (req, res) => {
    try {
      const data = await User.findOne({ email: req.body.email });
      if (!data) {
        res.render("users/userLogin", {
          signup: "Account Doesn't Exist, Please signup",
          title: "Login/Signup"
        });
      } else if (data.isBlocked) {
        res.render("users/userLogin", {
          signup: "your acc blocked",
          title: "Login/Signup"
        });
      } else {
        const passwordMatch = await bcrypt.compare(
          req.body.password,
          data.password
        );

        if (passwordMatch) {
          req.session.user = req.body.email;
          req.session.userID = data._id;
          res.redirect("/");
        } else {
          res.render("users/userLogin",{title: "Login/Signup",signup:"pass or email incorrect"});
          
        }
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },
  postUserSignup: async (req, res) => {
    const existingEmail = await User.findOne({ email: req.body.email });
    const existingName = await User.findOne({ name: req.body.name });

    if (existingEmail) {
      res.render("users/userLogin", {
        title: "Login/Signup",
        alert: "Email already exists, Please try with another one",
      });
      console.log("Username already exists, Please try with another one");
    } else if (existingName) {
      res.render("users/userLogin", {
        title: "Login/Signup",
        alert: "Username already exists, Please try with another one",
      });
      console.log("Username already exists, Please try with another one");
    } else {
      const hashedPassword = await bcrypt.hash(req.body.password, saltPassword);

      let config = {
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      };
      let transporter = nodemailer.createTransport(config);

      const otp = generateOTP();


      const info = await transporter.sendMail({
        from: process.env.EMAIL, // sender address
        to: req.body.email, // list of receivers
        subject: `OTP verification`, // Subject line
        html: `<b>Your OTP is ${otp} </b>`, // html body
      });
      console.log("info:",info);

      const user = new User({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        password: hashedPassword,
        OTP: otp,
      });

      try {
        await user.save();
        res.redirect("/otp");
      } catch (err) {
        console.log(err);
      }
    }
  },



  homePage: async (req, res) => {
    
    const { wishlistCount, cartItemCount } = req;
    const prod = await Products.aggregate([
      { $match: { isPublished: true } },
      { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "category" } },
      { $unwind: "$category" },
      { $match: { "category.isListed": true } },
      
  ]);
  
  req.session.checkoutBlock = false;
    res.render("users/homePage", {
      prod: prod,
      user: req.session.user || req.user,
      cartCount: cartItemCount,
      wishlistCount: wishlistCount,
      title:"Homepage"
    });
  },
  otp: (req, res) => {
    res.render("users/otp",{ title: "OTP verfication" });
  },
  otpVerification: async (req, res) => {
    const { otp } = req.body;

    const OTP = await User.findOne({ OTP: otp });
    const prod = await Products.find();

    if (OTP) {
      res.render("users/userLogin",{title: "Login/Signup"});
      console.log("successfully Signed Up");
    } else {
      res.redirect("/otp");
      console.log("Signup failed");
    }
  },
  productDetails: async (req, res) => {
    const userId = req.session.userID;
    console.log("userID :"+userId);
    const { wishlistCount, cartItemCount } = req;
    try {
      const id = req.params.id;
      const prod = await Products.findById(id).populate("category").populate("brand").lean();
      const prods = await Products.find({isPublished:true})
      .populate({
        path: "category",
        match: { isListed: true }, // filter by isListed field
      });

     
      
      
      if (!prod) {
        res.redirect("/");
        return;
      }
      res.render("users/productDetails", { prod: prod,prods:prods,
         user: req.session.user || req.user,
         wishlistCount:wishlistCount,
         cartCount:cartItemCount,
         title:"Product Details"
         });
    } catch (err) {
      console.log(err);
      res.redirect("/");
    }
  },
  stockInfo: async (req,res)=>{
    try {
      const productId = req.body.productId; // Assuming you have the product ID in the request
      const selectedSize = req.query.size;
  
      const product = await Products.findById(productId).lean();
  
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
  
      // Find the variant with the selected size
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

      if (sort === 'lowToHigh') {
          sortOptions.price = 1;
      } else if (sort === 'highToLow') {
          sortOptions.price = -1;
      }

      
      cate = await Category.find({ isListed: true });

     
      const listedCategoryIds = cate.map(category => category._id)

      
      if (category) {
          
          const requestedCategory = await Category.findOne({ _id: category, isListed: true })
          if (!requestedCategory) {
             
              return res.render("users/shop", {
                  prod: [],
                  cate: cate,
                  user: req.session.user,
                  text: category, 
                  sort: sort, 
                  currentPage: page, 
                  totalPages: 0,
                  title:"Shop"
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
                           .populate('category') 
                           .populate('brand');

                          
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
          wishlistCount:wishlistCount,
          cartCount:cartItemCount,
          title:"Shop"
      });
  } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).send("Internal Server Error");
        }


  },
  logout: (req, res) => {
    
    // req.user = null;
    req.logout((err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
      }
      req.session.user = null;
      res.redirect("/userLogin");
    });
  },

  //--------------------------------------------------------------Myaccount----------------------------------------------------------------
  userProfile: async (req, res) => {
    const { wishlistCount, cartItemCount } = req;
    const user = await User.findOne({email:req.session.user})
    const Guser = req.user
    res.render("users/usersProfile",{ 
      user: req.session.user || req.user,
      user:user,
      gUser:Guser,
      cartCount: cartItemCount,
      wishlistCount: wishlistCount,
      title: "My Profile"
    });
  },
  myAddress: async(req, res) => {
    const { wishlistCount, cartItemCount } = req;
    const userID = req.session.userID;
    const address = await Address.find({userId:userID})
    res.render("users/myAddress",{
       user: req.session.user || req.user,
      address:address,
      cartCount: cartItemCount,
      wishlistCount: wishlistCount,
      title: "My Address"
    });

  },
  addAddress: (req, res) => {
    const { wishlistCount, cartItemCount } = req;
    res.render("users/addAddress",{ user: req.session.user || req.user,
      cartCount: cartItemCount,
      wishlistCount: wishlistCount,
      title: "Add address"
    });

  },
  addAddressPost: async (req, res) => {
    try {
      const userID = req.session.userID;
      const {address,street,city,state,zip,country} = req.body;
      const newAddress = {
        address,
        street,
        city,
        state,
        zip,
        country
      };

      let userAddress = await Address.findOne({userId: userID});

      if(!userAddress){
        userAddress = new Address({userId:userID,address:[]});
      }

      userAddress.addressDetails.push(newAddress);

      await userAddress.save();
      res.redirect("/myAddress")
        

  }catch(err){
    console.log(err);
  }
},
editAddress: async (req, res) => {
  try {
    const { wishlistCount, cartItemCount } = req;
      const addressId = req.params.addressId;
      const index = req.params.index; // Get the index parameter from the URL
      const userId = req.session.userID;

      // Find the user's addresses
      const userAddress = await Address.findOne({ userId: userId });

      // Find the address using the index
      const address = userAddress.addressDetails[index];

      if (!address) {
          return res.status(404).send("Address not found");
      }

      res.render("users/editAddress", { user: req.session.user || req.user, address,
        cartCount: cartItemCount,
        wishlistCount: wishlistCount,
        title: "Edit address"
      });
  } catch (error) {
      console.error("Error editing address:", error);
      res.status(500).send("Internal Server Error");
  }
},

editAddressPost: async (req, res,next) => {
  const addressId = req.params.addressId;
  try {
    const { address, street, city, state, zip, country } =
      req.body;

    const userAddress = await Address.findOne({ "addressDetails._id": addressId });

    if (!userAddress) {
      console.log("User details not found");
      return res.status(404).send("User details not found");
    }

    const addressToUpdate = userAddress.addressDetails.find(
      (addr) => addr._id.toString() === addressId
    );

    if (!addressToUpdate) {
      console.log("Address not found");
      return res.status(404).send("Address not found");
    }

    addressToUpdate.address = address;
    addressToUpdate.street = street;
    addressToUpdate.city = city;
    addressToUpdate.state = state;
    addressToUpdate.zip = zip;
    addressToUpdate.country = country;

    await userAddress.save();

    res.redirect("/myAddress");
  } catch (err) {
    next(err);
  }
},

deleteAddress:async (req, res, next) => {
  const addressId = req.params.addressId;
  console.log('addressID:',addressId);
  try {
      const userId = req.session.userID;

      
      let userAddress = await Address.findOne({ userId: userId });

      if (!userAddress) {
          return res.status(404).send("User details not found");
      }

    
      userAddress.addressDetails = userAddress.addressDetails.filter(address => address._id.toString() !== addressId);

      
      await userAddress.save();

    
      res.redirect('/myAddress');
  } catch (err) {
      next(err);
  }
},

  editProfile: async (req,res)=>{
    try {
      if(req.user){
        const id = req.user.id
        const result = await googleUser.findByIdAndUpdate(id, {
          displayName: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
      });
      res.redirect('/userProfile');
      }else{
        // let id = req.session.user;
        console.log(req.session.user);
        const result = await User.findOneAndUpdate({email:req.session.user}, {
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
      });
      res.redirect('/userProfile');
      }
    } catch (err) {
        console.log("error:",err);
    }
  }, 
  changePassword: async (req,res)=>{
    try{
      const id = req.params.id;
      const data = await User.findById(id)
      const passwordMatch = await bcrypt.compare(
        req.body.currentPassword,
        data.password
      );

      if (passwordMatch) {
        const hashedPassword = await bcrypt.hash(req.body.newPassword, saltPassword);
          data.password = hashedPassword;
      
        try {
          await data.save();
          res.redirect("/userProfile");
        } catch (err) {
          console.log(err);
        }
      } else {
        
        alert("wrong password")
      }
    } catch(err){
      console.log(err);
    }
  },
  ordersProfile: async (req, res) => {
    const { wishlistCount, cartItemCount } = req;
    const userId = req.session.userID
    const orders = await Order.find({userID:userId});
    console.log(orders);
    res.render("users/ordersProfile",{
       user: req.session.user || req.user,
       orders: orders,
       cartCount: cartItemCount,
      wishlistCount: wishlistCount,
      title: "My Orders"

    });
  },
  orderDetails: async (req, res) => {
    const { wishlistCount, cartItemCount } = req;
    const orderId = req.params.orderId;
    const orders = await Order.findById(orderId).populate("items.product");
    res.render("users/orderDetails",{
       user: req.session.user || req.user,
       orders: orders,
       cartCount: cartItemCount,
      wishlistCount: wishlistCount,
      title: "Order Details"

    });
  },



  getOrderInvoice : async(req,res) => {
    try{

        const categoryData = await Category.find({isPublished:'true'})
        const orderId = req.params.orderId;
        const userId = req.session.userID;
        const order = await Order.findOne({_id:orderId,userID:userId}).populate('items.product')
        console.log("This is the order",order);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const invoiceTemplatePath = path.join(__dirname,'..','views', 'users','invoice.ejs');

        const invoiceHtml = await ejs.renderFile(invoiceTemplatePath,{categoryData,order});

        const options = {
            format: 'A4',
            orientation:'portrait',
            border:'10mm',
            phantomPath: '/path/to/phantomjs-binary'
        }

        pdf.create(invoiceHtml, options).toStream((err, stream) => {
            if(err) {
                console.log('Error generating PDF:',err);
                return res.status(500).json({ success: false, message: 'Error generating PDF' });
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');

            stream.pipe(res);
        })
        

    }catch(error){
        console.log(error.message);
        res.status(500).json({success:false,message:'Internal server error'})
    }
},

  //-----------------------------------------------------------------Cart---------------------------------------------------------
  checkStock: async (req, res, next) => {
    try {
        const productID = req.params.id;
        const product = await Products.findById(productID);
        console.log(product);

        if (!product) {
            console.log("1");
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        if (req.session.user == null) {
            console.log("No user logged in");
            return res.status(200).json({ success: false, message: "Please log in to add items to your cart." });
        }

        const userCart = await Cart.findOne({ userID: req.session.userID }).populate('items.product');

        if (!userCart) {
            console.log("2");
            return res.status(200).json({ success: true, message: "Product is in stock." });
        }

        console.log("User Cart:", userCart);

        const cartItem = userCart.items.find((item) => item.product._id.toString() === productID.toString());

        console.log("Cart Item:", cartItem);

        if (!cartItem) {
            console.log("3");
            return res.status(200).json({ success: true, message: "Product is in stock." });
        }

        const maxQuantity = product.stock;
        const currentQuantity = cartItem.quantity;
        console.log("Max Quantity:", maxQuantity);
        console.log("Current Quantity:", currentQuantity);

        if (currentQuantity >= maxQuantity) {
            return res.status(200).json({ success: false, message: "Maximum quantity reached for this product." });
        }

        return res.status(200).json({ success: true, message: "Product is in stock." });
    } catch (err) {
        next(err);
    }
},
  
  
  addToCart: async(req,res)=>{
    const userId = req.session.userID
    const productID  = req.params.id
    console.log("45",productID);
    const quantity = 1;

    const product = await Products.findById(productID);
    if (!product || product.stock === 0) {
      return res.status(400).json({ success: false, message: "Product is out of stock." });
  }
    
    let cart = await Cart.findOne({userId: userId})
     
    if(!cart){
      const newCart = new Cart({
        userId:userId,
        items:[
          {
            product: productID,
            price: product.price,
            quantity: quantity,
          }
        ],
        totalPrice: product.price*quantity,
      });
      await newCart.save();
    }
    else{
      const existingProduct = cart.items.find(
        (item)=> item.product.toString() === productID.toString()
      )

      if(existingProduct){
        existingProduct.quantity += quantity;
      }else{
        cart.items.push({
          product: productID,
          quantity: quantity,
          price: product.price
        })
      }

      cart.totalPrice = cart.items.reduce(
        (total,item)=> total + item.price * item.quantity,0
      )
      await cart.save();
    }
  },

  cart: async(req, res) => {
    const { wishlistCount, cartItemCount } = req;
    const userId = req.session.userID;
    const cartItems = await Cart.find({ userId }).populate("items.product");
    
    res.render("users/cart", {
        cartItems: cartItems,
        user: req.session.user || req.user,
        cartCount: cartItemCount,
        wishlistCount: wishlistCount,
        title: "My Cart"
    });
},

  removeProduct: async (req,res)=>{
    try {
      console.log("working");
      const userId = req.session.userID;
      const productId = req.params.id;

      let userCart = await Cart.findOne({ userId: userId });
      console.log(productId);

      if (userCart) {
          const productInCartIndex = userCart.items.findIndex(item => item.product.toString() === productId);
          console.log(productInCartIndex);
          
          
          if (productInCartIndex !== -1) {
              userCart.items.splice(productInCartIndex, 1);
              userCart.totalPrice = userCart.items.reduce((total, item) => total + item.price * item.quantity, 0);
              await userCart.save();
            console.log("1");
              res.json({ success: true });
          } else {
            console.log("2");
              res.json({ success: false, message: 'Product not found in the cart' });
          }
      } else {
        console.log("3");
          res.json({ success: false, message: 'User cart not found' });
      }
  } catch (error) {
      console.error('Error deleting product from cart:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
  },
  updateQuantity: async (req, res) => {
    try {
        const userId = req.session.userID;
        const productId = req.params.id;
        const action = req.params.action; // "increment" or "decrement"
        console.log(productId);
        console.log(action);
        

        // Fetch userCart and update quantity based on action
        let userCart = await Cart.findOne({ userId: userId }).populate('items.product');
        console.log(userCart);

        if (userCart) {
            const productInCart = userCart.items.find(item => item.product._id.toString() === productId);
          console.log("Product In Cart: "+ productInCart);

            if (productInCart) {
              const product = await Products.findById(productId);
              const maxQuantity = product.stock;
              console.log(maxQuantity);


                if (action === "increment") {
                  if (productInCart.quantity < maxQuantity) {
                    productInCart.quantity += 1;
                    productInCart.price = productInCart.product.price;

                    userCart.totalPrice = userCart.items.reduce(
                      (total, item) => total + (item.price * item.quantity),
                       0
                       );
                    await userCart.save();

                    return res.json({
                      success: true,
                      quantity: productInCart.quantity,
                      price: productInCart.price,
                      totalPrice: userCart.totalPrice
                  });
                }else{
                  return res.json({
                    success: false,
                    message: "Maximum quantity reached for this product",
                });
                }
                } else if (action === "decrement" && productInCart.quantity > 1) {
                    productInCart.quantity -= 1;
                    productInCart.price = productInCart.product.price;
                    userCart.totalPrice = userCart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
                    await userCart.save();
                    return res.json({
                      success: true,
                      quantity: productInCart.quantity,
                      price: productInCart.price,
                      totalPrice: userCart.totalPrice
                  });
                }else{
                  return res.json({
                    success: false,
                    message: "Invalid action or quantity",
                });
                }
              } else {
                return res.json({
                    success: false,
                    message: "Product not found in the cart",
                });
            }
                  
        } else {
            res.json({ success: false, message: 'User cart not found' });
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
},
  //-------------------------------------------------------------------Checkout----------------------------------------------------------
  checkout: async (req, res) => {

    if(req.session.checkoutBlock){
      req.session.checkoutBlock=false
      res.redirect("/");
    }else{
      const { wishlistCount, cartItemCount } = req;
      const orderId = req.query.orderId;
      const userId = req.session.userID;
      const userData = await User.findById(userId);
      // const cartItems = await Cart.find({userId:userId}).populate("items.product");
      // const address = await Address.find({userId:userId})
      // const coupon = await Coupon.findById(userId);
      // const cartTotalPrice = cartItems.totalPrice
      let userCart;
      let totalPrice;
      let addresses;
      
  
      if (orderId) {
        const order = await Order.findById(orderId).populate('items.product').exec();
        if (!order) {
          return res.status(404).json({ message: 'Order not found' });
        }
        addresses = await Address.find({ userId: userId });
        console.log(addresses);
       
        userCart = order.items;
        totalPrice = order.totalPrice;
      }else {
        addresses = await Address.find({ userId: userId });
        console.log(addresses);
       
        const cart = await Cart.findOne({ userId: userId }).populate('items.product').exec();
        if (!cart) {
          return res.status(404).json({ message: 'Cart not found' });
        }
        userCart = cart.items;
        totalPrice = cart.totalPrice;
      }
  
      const validCoupons = await Coupon.find({
          expiryDate: { $gt: new Date() }, 
           minimumAmount: { $lt: totalPrice }, 
          userID: { $ne: userId },
          isListed: true 
      });
      console.log('coupons',validCoupons);
  
      
     
      res.render("users/checkout",{ 
        user: userData || req.user,
        cartItems: userCart,
        address: addresses,
        coupons:validCoupons,
        cartCount: cartItemCount,
        wishlistCount: wishlistCount,
        totalPrice:totalPrice,
        orderID: orderId,
        title: "Checkout",
        alert: "Add new address to order",
        rpzKey:process.env.RAZORPAY_ID_KEY
      });
    }
   
  },

  placeOrder: async (req,res)=>{
    const userId = req.session.userID;
    const discount = req.body.discount
    const {addressID,paymentMethod,totalPrice,paymentStatus,orderID,couponCode } = req.body;
    console.log("discount:"+discount);
    console.log("orderId:"+orderID);

    if (orderID) {
      const orderToUpdate = await Order.findById(orderID);

      if (!orderToUpdate) {
          return res.status(404).json({ message: "Order not found" });
      }

      orderToUpdate.totalPrice = totalPrice;
      orderToUpdate.paymentMethod = paymentMethod;
      orderToUpdate.paymentStatus = paymentStatus;
      orderToUpdate.couponCode = couponCode;

      if (paymentStatus === "Paid" || paymentStatus === "Pending") {
          await orderToUpdate.save();
          req.session.checkoutBlock = true
          return res.status(200).render("users/thankyou", { title: "Thank You", orderID });
      } else if (paymentStatus === "Failed") {
          await orderToUpdate.save();
          return res.status(200).redirect("/ordersProfile");
      }
  }



    const user = await User.findById(req.session.userID);
    const cartItems = await Cart.find({userId:userId});
    console.log(cartItems);
    const address = await Address.findOne({ "addressDetails._id": addressID });

    const selectedAddress = address.addressDetails.find((a) => addressID.includes(a._id.toString()));

    const order = new Order({
      userID: user._id,
      items: cartItems.flatMap(cartItem =>
        cartItem.items.map(item => ({
            product: item.product,
            price: item.price,
            quantity: item.quantity,
        }))
    ),
      totalPrice: totalPrice,
      billingDetails: {
          name: user.name,
          address: selectedAddress.address,
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          country: selectedAddress.country,
          zip: selectedAddress.zip,
          phone: user.phone,
          email: user.email,
      },
      paymentMethod,
      paymentStatus,
      // amount:totalPrice
  });

  order.discount = discount;

  
  await order.save();
  if (paymentMethod === 'Wallet') {
    const wallet = await Wallet.findOne({ userId: user._id });

    
    wallet.balance -= totalPrice;
    await wallet.save();

    const transaction = new Transaction({
      userId: order.userID,
      amount: totalPrice,
      status: 'Success',
      type: 'Debited'
  });
  await transaction.save();

}
if (paymentStatus !== "Failed") {
  await Cart.findOneAndUpdate(
    { userId: user._id },
    { $set: { items: [], totalPrice: 0 } }
);
  }

if (paymentStatus !== "Failed" && couponCode) {
  await Coupon.findOneAndUpdate(
      { couponCode },
      { $addToSet: { usedBy: user._id } } 
  );
} 

for (const item of order.items) {
  await Products.findByIdAndUpdate(
      item.product,
      { $inc: { stock: -item.quantity } }
  );
}
if (paymentStatus === "Paid" || paymentStatus === "Pending") {
  req.session.checkoutBlock = true
  return res.status(200).render("users/thankyou", { title: "Thank You", orderId: order._id.toString() });

} else if (paymentStatus === "Failed") {
  return res.status(200).redirect("/ordersProfile");
}


  },
  cancleOrder: async (req,res)=>{
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

        const transaction = new Transaction({
          userId: order.userID,
          amount: order.totalPrice,
          status: 'Success',
          type: 'Credited'
      });
      await transaction.save();
  
        return res.status(200).redirect("/ordersProfile");
    } catch (err) {
        next(err);
    }
  },
  // Assuming Express and bodyParser are set up to parse JSON bodies

returnOrder: async (req, res, next) => {
  const orderId = req.params.orderId;
  const { returnReason } = req.body; // Extract returnReason from the request body

  try {
      const order = await Order.findById(orderId);
      
      if (!order) {
          return res.status(404).json({ message: "Order not found" });
      }
      
      // Update stock logic here...
      
      order.status = "Returned";
      order.returnReason = returnReason; // Save the return reason
      await order.save();

      return res.status(200).json({ message: "Order returned successfully" });
  } catch (err) {
      next(err);
  }
},

  thankyou:(req,res) =>{
    res.render("users/thankyou",{
      user: req.session.user || req.user,
      title: "Thankyou"
    });
  },

  //------------------------------------------------------------Wallet---------------------------------------------------------------
  wallet :async (req,res)=>{
    try {
      const { wishlistCount, cartItemCount } = req;
        const userId = req.session.userID
        const transactions = await Transaction.find({userId:userId});
        let wallet = await Wallet.findOne({userId:userId}).populate('userId')
       
        const user = await User.findById(userId);
      
        if(!wallet){
           wallet = new Wallet({
            userId: userId,
            balance: 0
          })
          await wallet.save()
        }
        console.log("Wallet:"+Wallet);
        res.status(200).render('users/wallet',{title: "Wallet",
        wallet,
        user: user,
        cartCount: cartItemCount,
        wishlistCount: wishlistCount,
        transactions,
        rpzKey:process.env.RAZORPAY_ID_KEY
      })
    } catch (error) {
        console.error(error);
        res.json({error:'Internal server error'})
    }
  },
  addAmount :async (req,res)=>{
    try {
        const userId = req.session.userID
        console.log("userID: "+userId);
        const amount = req.body.amount
        const userWallet =  await Wallet.findOne({userId:userId}) 
        userWallet.balance +=parseInt(amount)
        await userWallet.save()

        const transaction = new Transaction({
          userId: userId,
          amount: amount,
          status: 'Success',
          type: 'Credited'
      });
      await transaction.save();
        
        res.json({success:true})
    } catch (error) {
        console.error(error);
    }
  },
  checkWalletBalance  :async (req, res, next) => {
    try {
        const userId = req.session.userID; 

        const wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            return res.status(404).json({ success: false, message: 'Wallet not found for the user' });
        }

        res.json({ success: true, balance: wallet.balance });
    } catch (error) {
        next(error);
    }
},

//--------------------------------------------------------------wishlist-----------------------------------------------------------
 wishlist: async (req,res)=>{
  const { wishlistCount, cartItemCount } = req;
  const userId = req.session.userID;
    const WishlistItems = await Wishlist.find({userId:userId}).populate("items.product");
    res.render("users/wishlist",{
      WishlistItems: WishlistItems,
       user: req.session.user || req.user,
       cartCount: cartItemCount,
       wishlistCount: wishlistCount,
       title: "My Wishlist"
      });
 },
 addToWishlist: async (req, res, next) => {
  try {
      const userId = req.session.userID;
      const productID = req.params.id;
      await Products.findByIdAndUpdate(productID,{inWishlist:true});
      const product = await Products.findById(productID)
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
          // res.redirect(`/productDetails/${productID}`);
      } else {
          const existingProduct = userWishlist.items.find(
              (item) => item.product.toString() === productID.toString()
          );
          

          if (existingProduct) {
            return res.status(200).json({ success: false, message: "Product already exist in wishlist"});
          } else {
              userWishlist.items.push({
                  product: productID,
                  price: product.price,
              });
          }

          await userWishlist.save();

          return res.status(200).json({ success: true});
      }
  } catch (err) {
      next(err);
  }
},
removeWishlistProduct: async (req,res)=>{
  try {
    const userId = req.session.userID;
    const productId = req.query.productId;
    const itemId = req.query.itemId;
    console.log(itemId);
    console.log("ProductID:"+productId);

    try {
    await Products.findByIdAndUpdate(productId, { inWishlist: false }); // `new: true` to return the updated object for logging
     // Check what the update operation returns
    } catch (updateError) {
      console.error("Error updating product inWishlist status:", updateError);
    }
    

    let userWishlist = await Wishlist.findOne({ userId: userId });

    if (userWishlist) {
        const productInWishlistIndex = userWishlist.items.findIndex(item => item._id.toString() === itemId);
        
        if (productInWishlistIndex !== -1) {
          userWishlist.items.splice(productInWishlistIndex, 1);
            await userWishlist.save();

            res.redirect("/wishlist")
        } else {
            res.json({ success: false, message: 'Product not found in the cart' });
        }
    } else {
        res.json({ success: false, message: 'User Wishlist not found' });
    }
} catch (error) {
    console.error('Error deleting product from Wishlist:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
}
},
//======================================================================Coupon=======================================================
getCoupons: async (req, res) => {
  try {
      const userId = req.session.userID;
      const cartTotalPrice = req.query.totalPrice;
      console.log(cartTotalPrice);
      const currentDate = new Date();
      const coupons = await Coupon.find({  
          minAmount: { $lte: cartTotalPrice },
          isListed: true,
          expiryDate:{ $gte: currentDate},
          usedBy: { $ne: userId }
      });

      res.json({ coupons });
  } catch (error) {
      console.error('Error fetching coupons:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
},
applyCoupon :async (req, res) => {
  try {
      const { couponCode } = req.body;
    console.log("function working");
      
      const coupon = await Coupon.findOne({ couponCode: couponCode });
      if (!coupon) {
          return res.status(404).json({ message: 'Coupon not found' });
      }

      
      const userId = req.session.userID; 
      const userCart = await Cart.findOne({ userId });
      if (!userCart) {
          return res.status(404).json({ message: 'Cart not found' });
      }

      let discount = 0;
      if (coupon.discountPercentage) {
        discount = (userCart.totalPrice * coupon.discountPercentage) / 100;
        if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
          discount = Math.min(discount, parseInt(coupon.maxDiscountAmount));
        }
        discount = Math.floor(discount); // Convert to integer
      }
      console.log(discount);
      
    
      // const discount = coupon.percentage * userCart.totalPrice / 100;
     

      const newTotalPrice = userCart.totalPrice - discount;
      console.log("54354",newTotalPrice);

      // Update the cart total price
      // userCart.totalPrice = newTotalPrice;
  

     
      return res.status(200).json({ message: 'Coupon applied successfully', newTotalPrice,discount });
  } catch (error) {
      console.error('Error applying coupon:', error);
      return res.status(500).json({ error: 'Internal server error' });
  }
},

cancelCoupon :async (req, res) => {
  try {
      
      const userId = req.session.userID;
      const userCart = await Cart.findOne({ userId });

      if (!userCart) {
          return res.status(404).json({ message: 'Cart not found' });
      }

     
      const originalTotalPrice = userCart.totalPrice; 

      
      return res.status(200).json({ originalTotalPrice });
  } catch (error) {
      console.error('Error canceling coupon:', error);
      return res.status(500).json({ error: 'Internal server error' });
}
},
//=================================================================Search===================================================
searchProduct:async (req, res) => {
  try {
    const { wishlistCount, cartItemCount } = req;
    const searchTerm = req.query.q; // Assuming the search query parameter is named 'q'

    // Perform the search query against the MongoDB database
    const searchResults = await Products.find({
      $or: [
        { product: { $regex: searchTerm, $options: 'i' } }, // Case-insensitive search on product name
        { description: { $regex: searchTerm, $options: 'i' } }, // Case-insensitive search on description
        // Add more fields to search here as needed
      ],
    }).exec();

    res.render('users/search', { prod: searchResults,user:req.session.user,
      cartCount: cartItemCount,
      wishlistCount: wishlistCount,
      title: "Search"
    }); // Render the searchResults view with the search results
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
 },


};

module.exports = userController;
