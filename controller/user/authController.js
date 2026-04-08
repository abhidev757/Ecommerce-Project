const User = require("../../models/users");
const bcrypt = require("bcrypt");
const sgMail = require("@sendgrid/mail");
require("dotenv").config();
const { generateOTP } = require("../../middlewares/otpgenerator");

// Configure SendGrid with API key from .env
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const saltPassword = 10;

const authController = {
  userSignup: (req, res) => {
    res.render("users/userLogin", { title: "Login" });
  },

  userLogin: (req, res) => {
    res.render("users/userLogin", { title: "Login" });
  },

  resetPassword: (req, res) => {
    res.render("users/resetPassword", { title: "Reset Password" });
  },

  resetPasswordPost: async (req, res) => {
    try {
      const data = await User.findOne({ email: req.body.email });
      if (!data) {
        res.render("users/resetPassword", {
          signup: "Account Doesn't Exist, Please signup",
          title: "Reset Password",
        });
      } else if (data.isBlocked) {
        res.render("users/resetPassword", {
          signup: "your acc blocked",
          title: "Reset Password",
        });
      } else {
        const emailMatch = await User.findOne({ email: req.body.email });

        if (emailMatch) {
          const hashedPassword = await bcrypt.hash(
            req.body.password,
            saltPassword
          );

          data.password = hashedPassword;

          try {
            await data.save();
            res.redirect("/userLogin");
          } catch (err) {
            console.log(err);
          }
        } else {
          res.render("users/resetPassword", { title: "Reset Password" });
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
          title: "Login/Signup",
        });
      } else if (data.isBlocked) {
        res.render("users/userLogin", {
          signup: "your acc blocked",
          title: "Login/Signup",
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
          res.render("users/userLogin", {
            title: "Login/Signup",
            signup: "pass or email incorrect",
          });
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
      const otp = generateOTP();

      // Send OTP email via SendGrid
      const msg = {
        to: req.body.email,
        from: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL, // Must be a verified sender in SendGrid
        subject: "Your OTP Verification Code - HERO CLUB",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #f05321;">HERO CLUB</h2>
            <p>Hi <strong>${req.body.name}</strong>,</p>
            <p>Use the OTP below to verify your account. It is valid for <strong>5 minutes</strong>.</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333; margin: 24px 0;">${otp}</div>
            <p style="color: #888; font-size: 13px;">If you did not request this, please ignore this email.</p>
          </div>
        `,
      };

      try {
        await sgMail.send(msg);
        console.log(`OTP email sent to ${req.body.email}`);
      } catch (emailErr) {
        console.error("SendGrid error:", emailErr.response?.body?.errors || emailErr.message);
        // Don't block signup if email fails — still save user and redirect
      }

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

  otp: (req, res) => {
    res.render("users/otp", { title: "OTP verfication" });
  },

  otpVerification: async (req, res) => {
    const { otp } = req.body;

    const OTP = await User.findOne({ OTP: otp });

    if (OTP) {
      res.render("users/userLogin", { title: "Login/Signup" });
      console.log("successfully Signed Up");
    } else {
      res.redirect("/otp");
      console.log("Signup failed");
    }
  },

  logout: (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
      }
      req.session.user = null;
      res.redirect("/userLogin");
    });
  },
};

module.exports = authController;
