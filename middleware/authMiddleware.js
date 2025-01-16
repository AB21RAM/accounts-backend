const jwt = require('jsonwebtoken');
require('dotenv').config();

// Use the secret key from the environment variables
const secretKey = process.env.SECRET_KEY; // Create a separate config file for your secret key

exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Token not provided' });
    res.end();
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden: Invalid token' });
      res.end()
    }
    req.user = decoded;
    next();
  });
};