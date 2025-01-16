const crypto = require('crypto');

// Generate a secure secret key
function generateSecretKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Usage
const secretKey = generateSecretKey(64); // You can adjust the length as needed
console.log('Generated Secret Key:', secretKey);