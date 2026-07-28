const jwt = require('jsonwebtoken');

// Verifies the JWT sent in the Authorization header.
// Expected header format: Authorization: Bearer <token>
// On success, attaches req.employee = { employeeId, name, roleName, branchId }
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.employee = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token. Please log in again.' });
  }
}

// Restricts a route to specific roles.
// Usage: router.post('/', verifyToken, requireRole('SuperAdmin', 'Admin'), controller.fn)
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.employee) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    if (!allowedRoles.includes(req.employee.roleName)) {
      return res.status(403).json({
        error: `Access denied. This action requires one of: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
