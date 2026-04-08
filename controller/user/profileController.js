const User = require("../../models/users");
const googleUser = require("../../models/googleAuthUsers");
const Address = require("../../models/address");
const bcrypt = require("bcrypt");

const saltPassword = 10;

const profileController = {
  userProfile: async (req, res) => {
    const { wishlistCount, cartItemCount } = req;
    const user = await User.findOne({ email: req.session.user });
    const Guser = req.user;
    res.render("users/usersProfile", {
      user: user,
      gUser: Guser,
      cartCount: cartItemCount,
      wishlistCount: wishlistCount,
      title: "My Profile",
    });
  },

  myAddress: async (req, res) => {
    const { wishlistCount, cartItemCount } = req;
    const userID = req.session.userID;
    const address = await Address.find({ userId: userID });
    res.render("users/myAddress", {
      user: req.session.user || req.user,
      address: address,
      cartCount: cartItemCount,
      wishlistCount: wishlistCount,
      title: "My Address",
    });
  },

  addAddress: (req, res) => {
    const { wishlistCount, cartItemCount } = req;
    res.render("users/addAddress", {
      user: req.session.user || req.user,
      cartCount: cartItemCount,
      wishlistCount: wishlistCount,
      title: "Add address",
    });
  },

  addAddressPost: async (req, res) => {
    try {
      const userID = req.session.userID;
      const { address, street, city, state, zip, country } = req.body;
      const newAddress = { address, street, city, state, zip, country };

      let userAddress = await Address.findOne({ userId: userID });

      if (!userAddress) {
        userAddress = new Address({ userId: userID, address: [] });
      }

      userAddress.addressDetails.push(newAddress);
      await userAddress.save();
      res.redirect("/myAddress");
    } catch (err) {
      console.log(err);
    }
  },

  editAddress: async (req, res) => {
    try {
      const { wishlistCount, cartItemCount } = req;
      const addressId = req.params.addressId;
      const index = req.params.index;
      const userId = req.session.userID;

      const userAddress = await Address.findOne({ userId: userId });
      const address = userAddress.addressDetails[index];

      if (!address) {
        return res.status(404).send("Address not found");
      }

      res.render("users/editAddress", {
        user: req.session.user || req.user,
        address,
        cartCount: cartItemCount,
        wishlistCount: wishlistCount,
        title: "Edit address",
      });
    } catch (error) {
      console.error("Error editing address:", error);
      res.status(500).send("Internal Server Error");
    }
  },

  editAddressPost: async (req, res, next) => {
    const addressId = req.params.addressId;
    try {
      const { address, street, city, state, zip, country } = req.body;

      const userAddress = await Address.findOne({
        "addressDetails._id": addressId,
      });

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

  deleteAddress: async (req, res, next) => {
    const addressId = req.params.addressId;
    console.log("addressID:", addressId);
    try {
      const userId = req.session.userID;

      let userAddress = await Address.findOne({ userId: userId });

      if (!userAddress) {
        return res.status(404).send("User details not found");
      }

      userAddress.addressDetails = userAddress.addressDetails.filter(
        (address) => address._id.toString() !== addressId
      );

      await userAddress.save();
      res.redirect("/myAddress");
    } catch (err) {
      next(err);
    }
  },

  editProfile: async (req, res) => {
    try {
      if (req.user) {
        const id = req.user.id;
        const result = await googleUser.findByIdAndUpdate(id, {
          displayName: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
        });
        res.redirect("/userProfile");
      } else {
        console.log(req.session.user);
        const result = await User.findOneAndUpdate(
          { email: req.session.user },
          {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
          }
        );
        res.redirect("/userProfile");
      }
    } catch (err) {
      console.log("error:", err);
    }
  },

  changePassword: async (req, res) => {
    try {
      const id = req.params.id;
      const data = await User.findById(id);
      const passwordMatch = await bcrypt.compare(
        req.body.currentPassword,
        data.password
      );

      if (passwordMatch) {
        const hashedPassword = await bcrypt.hash(
          req.body.newPassword,
          saltPassword
        );
        data.password = hashedPassword;

        try {
          await data.save();
          res.redirect("/userProfile");
        } catch (err) {
          console.log(err);
        }
      } else {
        alert("wrong password");
      }
    } catch (err) {
      console.log(err);
    }
  },
};

module.exports = profileController;
