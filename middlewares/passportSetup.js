const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy
const googleAuthUsers = require("../models/googleAuthUsers");


passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await googleAuthUsers.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });


  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
   async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await googleAuthUsers.findOne({ googleId: profile.id });
  
      if (user) {
        return done(null, user);
      }
  
      const newUser = new googleAuthUsers({
        googleId: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value
        // Add other user fields as needed
      });
  
      await newUser.save();
      done(null, newUser);
    } catch (err) {
      done(err, null);
    } 


  }));

  const authController = {
    googleAuth: passport.authenticate('google', {
      scope: ['profile', 'email'],
    }),
  
    googleAuthCallback: passport.authenticate('google', {
      failureRedirect: '/userLogin',
      successRedirect: '/', // Redirect to your dashboard or home page
    }),

    
  };

module.exports = authController;