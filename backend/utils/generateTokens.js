const jwt = require('jsonwebtoken');

exports.generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '15m', // Short-lived token
  });
};

exports.generateRefreshToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d', // Long-lived token
  });
};
