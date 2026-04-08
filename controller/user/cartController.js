const Cart = require("../../models/cart");
const Products = require("../../models/product");

const cartController = {
  checkStock: async (req, res, next) => {
    try {
      const productID = req.params.id;
      const product = await Products.findById(productID);
      console.log(product);

      if (!product) {
        console.log("1");
        return res
          .status(404)
          .json({ success: false, message: "Product not found." });
      }

      if (req.session.user == null) {
        console.log("No user logged in");
        return res.status(200).json({
          success: false,
          message: "Please log in to add items to your cart.",
        });
      }

      const userCart = await Cart.findOne({
        userID: req.session.userID,
      }).populate("items.product");

      if (!userCart) {
        console.log("2");
        return res
          .status(200)
          .json({ success: true, message: "Product is in stock." });
      }

      console.log("User Cart:", userCart);

      const cartItem = userCart.items.find(
        (item) => item.product._id.toString() === productID.toString()
      );

      console.log("Cart Item:", cartItem);

      if (!cartItem) {
        console.log("3");
        return res
          .status(200)
          .json({ success: true, message: "Product is in stock." });
      }

      const maxQuantity = product.stock;
      const currentQuantity = cartItem.quantity;
      console.log("Max Quantity:", maxQuantity);
      console.log("Current Quantity:", currentQuantity);

      if (currentQuantity >= maxQuantity) {
        return res.status(200).json({
          success: false,
          message: "Maximum quantity reached for this product.",
        });
      }

      return res
        .status(200)
        .json({ success: true, message: "Product is in stock." });
    } catch (err) {
      next(err);
    }
  },

  addToCart: async (req, res) => {
    const userId = req.session.userID;
    const productID = req.params.id;
    console.log("45", productID);
    const quantity = 1;

    const product = await Products.findById(productID);
    if (!product || product.stock === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Product is out of stock." });
    }

    let cart = await Cart.findOne({ userId: userId });

    if (!cart) {
      const newCart = new Cart({
        userId: userId,
        items: [
          {
            product: productID,
            price: product.price,
            quantity: quantity,
          },
        ],
        totalPrice: product.price * quantity,
      });
      await newCart.save();
    } else {
      const existingProduct = cart.items.find(
        (item) => item.product.toString() === productID.toString()
      );

      if (existingProduct) {
        existingProduct.quantity += quantity;
      } else {
        cart.items.push({
          product: productID,
          quantity: quantity,
          price: product.price,
        });
      }

      cart.totalPrice = cart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
      await cart.save();
    }
  },

  cart: async (req, res) => {
    const { wishlistCount, cartItemCount } = req;
    const userId = req.session.userID;
    const cartItems = await Cart.find({ userId }).populate("items.product");

    res.render("users/cart", {
      cartItems: cartItems,
      user: req.session.user || req.user,
      cartCount: cartItemCount,
      wishlistCount: wishlistCount,
      title: "My Cart",
    });
  },

  removeProduct: async (req, res) => {
    try {
      console.log("working");
      const userId = req.session.userID;
      const productId = req.params.id;

      let userCart = await Cart.findOne({ userId: userId });
      console.log(productId);

      if (userCart) {
        const productInCartIndex = userCart.items.findIndex(
          (item) => item.product.toString() === productId
        );
        console.log(productInCartIndex);

        if (productInCartIndex !== -1) {
          userCart.items.splice(productInCartIndex, 1);
          userCart.totalPrice = userCart.items.reduce(
            (total, item) => total + item.price * item.quantity,
            0
          );
          await userCart.save();
          console.log("1");
          res.json({ success: true });
        } else {
          console.log("2");
          res.json({
            success: false,
            message: "Product not found in the cart",
          });
        }
      } else {
        console.log("3");
        res.json({ success: false, message: "User cart not found" });
      }
    } catch (error) {
      console.error("Error deleting product from cart:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  updateQuantity: async (req, res) => {
    try {
      const userId = req.session.userID;
      const productId = req.params.id;
      const action = req.params.action;
      console.log(productId);
      console.log(action);

      let userCart = await Cart.findOne({ userId: userId }).populate(
        "items.product"
      );
      console.log(userCart);

      if (userCart) {
        const productInCart = userCart.items.find(
          (item) => item.product._id.toString() === productId
        );
        console.log("Product In Cart: " + productInCart);

        if (productInCart) {
          const product = await Products.findById(productId);
          const maxQuantity = product.stock;
          console.log(maxQuantity);

          if (action === "increment") {
            if (productInCart.quantity < maxQuantity) {
              productInCart.quantity += 1;
              productInCart.price = productInCart.product.price;

              userCart.totalPrice = userCart.items.reduce(
                (total, item) => total + item.price * item.quantity,
                0
              );
              await userCart.save();

              return res.json({
                success: true,
                quantity: productInCart.quantity,
                price: productInCart.price,
                totalPrice: userCart.totalPrice,
              });
            } else {
              return res.json({
                success: false,
                message: "Maximum quantity reached for this product",
              });
            }
          } else if (action === "decrement" && productInCart.quantity > 1) {
            productInCart.quantity -= 1;
            productInCart.price = productInCart.product.price;
            userCart.totalPrice = userCart.items.reduce(
              (total, item) => total + item.price * item.quantity,
              0
            );
            await userCart.save();
            return res.json({
              success: true,
              quantity: productInCart.quantity,
              price: productInCart.price,
              totalPrice: userCart.totalPrice,
            });
          } else {
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
        res.json({ success: false, message: "User cart not found" });
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },
};

module.exports = cartController;
