const jwt = require('jsonwebtoken');
const config = require('../config');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

/**
 * Middleware to authenticate JWT token
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    throw new UnauthorizedError('Access token required');
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token has expired');
    }
    throw new UnauthorizedError('Invalid token');
  }
};

/**
 * Optional authentication - attaches user if token present, but doesn't require it
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
  } catch (err) {
    // Token is invalid but we don't require auth, so continue
  }

  next();
};

/**
 * Middleware to authorize specific roles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions for this action');
    }

    next();
  };
};

/**
 * Generate JWT token for user
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    facilityId: user.facilityId,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Generate refresh token for user
 */
const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    type: 'refresh',
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

/**
 * Middleware to check facility access - ensures user can only access their facility's data
 * Admins can access all facilities
 */
const checkFacilityAccess = (req, res, next) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  // Admins can access all facilities
  if (req.user.role === 'admin') {
    return next();
  }

  // Check if user has access to the requested facility
  const requestedFacilityId = req.params.facilityId || req.body.facilityId || req.query.facilityId;

  if (requestedFacilityId && parseInt(requestedFacilityId) !== req.user.facilityId) {
    throw new ForbiddenError('Access denied: Cannot access data from other facilities');
  }

  // Set user's facility ID for queries
  req.facilityId = req.user.facilityId;

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  authorizeRoles,
  generateToken,
  generateRefreshToken,
  checkFacilityAccess,
};
