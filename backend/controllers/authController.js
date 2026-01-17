const { User } = require('../models');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { UnauthorizedError, ConflictError, NotFoundError } = require('../utils/errors');
const response = require('../utils/response');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  const { username, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    where: {
      [require('sequelize').Op.or]: [{ email }, { username }],
    },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ConflictError('Email already registered');
    }
    throw new ConflictError('Username already taken');
  }

  // Create new user (password will be hashed by the model hook)
  const user = await User.create({
    username,
    email,
    password,
    role: role || 'staff',
  });

  // Generate tokens
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  return response.created(res, {
    user: user.toJSON(),
    token,
    refreshToken,
  }, 'User registered successfully');
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  // Find user with password included
  const user = await User.scope('withPassword').findOne({
    where: { email },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Account is deactivated');
  }

  // Check password
  const isValidPassword = await user.checkPassword(password);
  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Update last login
  await user.update({ lastLogin: new Date() });

  // Generate tokens
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  // Fetch user with facility data
  const userWithFacility = await User.findByPk(user.id, {
    include: [{
      model: require('../models').Facility,
      as: 'facility',
    }],
  });

  return response.success(res, {
    user: userWithFacility.toJSON(),
    token,
    refreshToken,
  }, 'Login successful');
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  const user = await User.findByPk(req.user.id);

  if (!user) {
    throw new NotFoundError('User');
  }

  return response.success(res, { user }, 'User profile retrieved');
};

/**
 * Update current user profile
 * PUT /api/auth/me
 */
const updateMe = async (req, res) => {
  const { username, email } = req.body;

  const user = await User.findByPk(req.user.id);

  if (!user) {
    throw new NotFoundError('User');
  }

  // Check for conflicts
  if (email && email !== user.email) {
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      throw new ConflictError('Email already in use');
    }
  }

  if (username && username !== user.username) {
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      throw new ConflictError('Username already taken');
    }
  }

  await user.update({ username, email });

  return response.success(res, { user }, 'Profile updated successfully');
};

/**
 * Change password
 * PUT /api/auth/password
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.scope('withPassword').findByPk(req.user.id);

  if (!user) {
    throw new NotFoundError('User');
  }

  // Verify current password
  const isValidPassword = await user.checkPassword(currentPassword);
  if (!isValidPassword) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  // Update password (will be hashed by model hook)
  await user.update({ password: newPassword });

  return response.success(res, null, 'Password changed successfully');
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new UnauthorizedError('Refresh token required');
  }

  try {
    const jwt = require('jsonwebtoken');
    const config = require('../config');

    const decoded = jwt.verify(token, config.jwt.secret);

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    return response.success(res, {
      token: newToken,
      refreshToken: newRefreshToken,
    }, 'Token refreshed successfully');
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
};

/**
 * Logout user (client-side token removal, but useful for logging)
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  // In a more complete implementation, you might invalidate the token
  // by adding it to a blacklist or using short-lived tokens with refresh
  return response.success(res, null, 'Logged out successfully');
};

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
  refreshToken,
  logout,
};
