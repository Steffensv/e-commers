const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const { User, Token, Cart, Role, Membership, Order } = require('../models');
const { Op } = require('sequelize');
const { generateAccessToken, generateRefreshToken } = require('../services/tokenService');
const { AppError, catchAsync } = require('../middleware/errorHandler');

// Login Function - refactored with catchAsync
const login = catchAsync(async (req, res) => {
  console.log('Form data received in the back-end:', req.body);
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    throw new AppError('Please provide both username/email and password', 400, 'login');
  }

  // Find user by username or email
  const user = await User.findOne({
    where: {
      [Op.or]: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    },
  });

  if (!user) {
    throw new AppError('Authentication failed', 401, 'login');
  }

  // Compare the password with hashed password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Authentication failed', 401, 'login');
  }

  // Generate access and refresh tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store the access token in the database
  await Token.create({
    userId: user.id,
    token: accessToken,
    expiresAt: moment().add(2, "hours").toDate(), // Access token expiry
    type: 'access',
  });

  // Store the refresh token in the database
  await Token.create({
    userId: user.id,
    token: refreshToken,
    expiresAt: moment().add(7, "days").toDate(), // Refresh token expiry
    type: 'refresh',
  });

  // Check if the user has an active cart, if not create one
  try {
    // Use lowercase 'id' consistently
    let cart = await Cart.findOne({
      where: { userId: user.id, status: 'active' }
    });
      
    if (!cart) {
      console.log(`Creating new empty cart for user: ${user.id} (${user.username})`);
      cart = await Cart.create({
        userId: user.id,
        status: 'active'
      });
      console.log('Empty cart created successfully:', cart.id);
    } else {
      console.log(`User ${user.id} already has an active cart:`, cart.id);
    }
  
    // Send tokens as response  
    res.status(200).json({
      status: 'success',
      statuscode: 200,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id || user.Id,
          username: user.username,
          email: user.email,
          roleId: user.roleId,
          isAdmin: user.isAdmin
        },
        cart: cart ? { id: cart.id } : { id: null }
      },
    }); 
  } catch (cartError) {
    console.error('Error managing user cart:', cartError);
    // Continue without a cart and still return the response
    res.status(200).json({
      status: 'success',
      statuscode: 200,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id || user.Id,
          username: user.username,
          email: user.email,
          roleId: user.roleId,
          isAdmin: user.isAdmin
        },
        cart: { id: null }
      },
    });
  }
});

// Register Function - refactored with catchAsync
const register = catchAsync(async (req, res) => {
  const { firstname, lastname, username, email, password, address, phone } = req.body;

  // Validate required fields
  if (!username || !email || !password) {
    throw new AppError('Username, email, and password are required', 400, 'register');
  }

  // Check if user already exists
  const user = await User.findOne({
    where: {
      [Op.or]: [{ username }, { email }],
    },
  });

  if (user) {
    throw new AppError('User already exists', 400, 'register');
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create the user
  const newUser = await User.create({
    firstname,
    lastname,
    username,
    email,
    password: hashedPassword,
    address,
    phone,
    // Default values for missing fields
    roleId: 2, // Regular user
    isAdmin: false,
    membershipId: 1 // Basic membership
  });

  // Create a cart for the new user
  try {
    const userId = newUser.Id || newUser.id;
    await Cart.create({
      userId,
      status: 'active'
    });
    console.log(`Created cart for new user ${userId}`);
  } catch (cartError) {
    console.error('Error creating cart for new user:', cartError);
    // Continue even if cart creation fails
  }

  res.status(201).json({
    status: 'success',
    statuscode: 201,
    data: { Result: 'User created successfully with empty cart' },
  });
});

// Refresh Token Function - refactored with catchAsync
const refresh = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('No refresh token provided', 401, 'refresh');
  }

  // Validate the refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401, 'refresh');
  }
  
  // Find the user from the token
  const user = await User.findByPk(decoded.id);
  if (!user) {
    throw new AppError('User not found', 401, 'refresh');
  }

  // Generate new access token
  const newAccessToken = generateAccessToken(user);
  res.status(200).json({ 
    status: 'success',
    statuscode: 200, 
    data: {
      accessToken: newAccessToken
    }
  });
});

module.exports = { login, register, refresh };