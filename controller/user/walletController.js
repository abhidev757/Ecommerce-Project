const Wallet = require("../../models/wallet");
const Transaction = require("../../models/transactions");
const User = require("../../models/users");
require("dotenv").config();

const walletController = {
  wallet: async (req, res) => {
    try {
      const { wishlistCount, cartItemCount } = req;
      const userId = req.session.userID;
      const transactions = await Transaction.find({ userId: userId });
      let wallet = await Wallet.findOne({ userId: userId }).populate("userId");

      const user = await User.findById(userId);

      if (!wallet) {
        wallet = new Wallet({
          userId: userId,
          balance: 0,
        });
        await wallet.save();
      }
      console.log("Wallet:" + Wallet);
      res.status(200).render("users/wallet", {
        title: "Wallet",
        wallet,
        user: user,
        cartCount: cartItemCount,
        wishlistCount: wishlistCount,
        transactions,
        rpzKey: process.env.RAZORPAY_ID_KEY,
      });
    } catch (error) {
      console.error(error);
      res.json({ error: "Internal server error" });
    }
  },

  addAmount: async (req, res) => {
    try {
      const userId = req.session.userID;
      console.log("userID: " + userId);
      const amount = req.body.amount;
      const userWallet = await Wallet.findOne({ userId: userId });
      userWallet.balance += parseInt(amount);
      await userWallet.save();

      const transaction = new Transaction({
        userId: userId,
        amount: amount,
        status: "Success",
        type: "Credited",
      });
      await transaction.save();

      res.json({ success: true });
    } catch (error) {
      console.error(error);
    }
  },

  checkWalletBalance: async (req, res, next) => {
    try {
      const userId = req.session.userID;

      const wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: "Wallet not found for the user",
        });
      }

      res.json({ success: true, balance: wallet.balance });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = walletController;
