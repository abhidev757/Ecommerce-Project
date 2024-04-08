// otpGenerator.js
const crypto = require('crypto');

const generateOTP = () => {
    return crypto.randomBytes(2).toString('hex').toUpperCase(); // Adjust the length as needed
};

module.exports = { generateOTP };
