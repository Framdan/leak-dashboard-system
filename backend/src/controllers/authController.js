const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../middleware/errorResponse');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public


const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check for user
  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // 2. Check password (using the new camelCase field name)
  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // 3. Create token
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    }
  });
});

module.exports = { login };
