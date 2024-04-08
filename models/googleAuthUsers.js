const mongoose = require('mongoose');

const googleAuthUsersSchema = new mongoose.Schema({
  googleId: String,
  displayName: String,
  email: String,
  phone: String,
  // Add other user fields as needed
});

const User = mongoose.model('googleAuthUsers', googleAuthUsersSchema);

module.exports = User;
