const jwt = require('jsonwebtoken');

// Verifies a customer's JWT (separate token space from employee tokens -
// a customer token can NEVER be used to access staff/employee routes,
// and vice versa, because the payload shape and secret usage are checked here).
function verifyCustomerToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'customer') {
      return res.status(403).json({ error: 'Invalid token type for this endpoint' });
    }

    req.customer = decoded; // { type: 'customer', customerId, name }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token. Please log in again.' });
  }
}

module.exports = { verifyCustomerToken };