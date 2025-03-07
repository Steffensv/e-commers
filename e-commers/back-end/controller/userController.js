const { User, Membership, Order, OrderItem, Product } = require('../models');
const bcrypt = require('bcrypt');
const { AppError, catchAsync } = require('../middleware/errorHandler');

// Get all users - refactored with catchAsync
const getAllUsers = catchAsync(async (req, res) => {
  // Check if the requesting user is an admin
  if (!req.user.isAdmin) {
    throw new AppError('Unauthorized: Admin access required', 403, 'getAllUsers');
  }
  
  const users = await User.findAll({
    attributes: { exclude: ['password'] }, // Don't send passwords
    include: [{ model: Membership, as: 'membership' }]
  });
  
  return res.json({
    status: 'success',
    statuscode: 200,
    data: { users }
  });
});

// Get user by ID - refactored with catchAsync
const getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Only allow users to access their own data or admins to access any user
  if (req.user.id != id && !req.user.isAdmin) {
    throw new AppError('Unauthorized: You can only access your own user data', 403, 'getUserById');
  }

  const user = await User.findByPk(id, {
    attributes: { exclude: ['password'] },
    include: [{ model: Membership, as: 'membership' }]
  });

  if (!user) {
    throw new AppError('User not found', 404, 'getUserById');
  }

  return res.json({
    status: 'success',
    statuscode: 200,
    data: { user }
  });
});

// Update user - refactored with catchAsync
const updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { firstname, lastname, email, address, phone } = req.body;
  
  // Only allow users to update their own data or admins to update any user
  if (req.user.id != id && !req.user.isAdmin) {
    throw new AppError('Unauthorized: You can only update your own user data', 403, 'updateUser');
  }

  const user = await User.findByPk(id);
  
  if (!user) {
    throw new AppError('User not found', 404, 'updateUser');
  }
  
  // Update fields that were provided
  if (firstname) user.firstname = firstname;
  if (lastname) user.lastname = lastname;
  if (email) {
    // Check if email already exists for a different user
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser && existingUser.id != id) {
      throw new AppError('Email already in use', 400, 'updateUser');
    }
    user.email = email;
  }
  if (address) user.address = address;
  if (phone) user.phone = phone;
  
  await user.save();
  
  // Don't send password in response
  const { password, ...userWithoutPassword } = user.toJSON();
  
  return res.json({
    status: 'success',
    statuscode: 200,
    data: { 
      Result: 'User updated successfully',
      user: userWithoutPassword 
    }
  });
});

// Update user password - refactored with catchAsync
const updatePassword = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;
  
  // Only allow users to change their own password or admins to change any password
  if (req.user.id != id && !req.user.isAdmin) {
    throw new AppError('Unauthorized: You can only change your own password', 403, 'updatePassword');
  }

  // Validate input
  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400, 'updatePassword');
  }
  
  if (newPassword.length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400, 'updatePassword');
  }
  
  const user = await User.findByPk(id);
  
  if (!user) {
    throw new AppError('User not found', 404, 'updatePassword');
  }
  
  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 401, 'updatePassword');
  }
  
  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  // Update password
  user.password = hashedPassword;
  await user.save();
  
  return res.json({
    status: 'success',
    statuscode: 200,
    data: { Result: 'Password updated successfully' }
  });
});

// Delete user - refactored with catchAsync
const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Only allow users to delete their own account or admins to delete any account
  if (req.user.id != id && !req.user.isAdmin) {
    throw new AppError('Unauthorized: You can only delete your own account', 403, 'deleteUser');
  }
  
  const user = await User.findByPk(id);
  
  if (!user) {
    throw new AppError('User not found', 404, 'deleteUser');
  }
  
  await user.destroy();
  
  return res.json({
    status: 'success',
    statuscode: 200,
    data: { Result: 'User deleted successfully' }
  });
});

// Get user dashboard data - refactored with catchAsync
const getDashboard = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  // Get user data
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
    include: [{ model: Membership, as: 'membership' }]
  });
  
  if (!user) {
    throw new AppError('User not found', 404, 'getDashboard');
  }
  
  // Get recent orders
  const recentOrders = await Order.findAll({
    where: { userId },
    limit: 5,
    order: [['createdAt', 'DESC']],
    include: [{
      model: OrderItem,
      include: [Product]
    }]
  });
  
  return res.json({
    status: 'success',
    statuscode: 200,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        address: user.address,
        phone: user.phone,
        membership: user.membership ? {
          name: user.membership.name,
          discount: user.membership.discount
        } : null
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        date: order.createdAt,
        status: order.status,
        totalAmount: order.totalAmount,
        itemCount: order.OrderItems.length,
        items: order.OrderItems.map(item => ({
          name: item.Product.name,
          quantity: item.quantity,
          price: item.price
        }))
      }))
    }
  });
});

// Update user membership - refactored with catchAsync
const updateMembership = catchAsync(async (req, res) => {
  const { userId, membershipId } = req.body;
  
  // Only admins can update memberships
  if (!req.user.isAdmin) {
    throw new AppError('Unauthorized: Admin access required', 403, 'updateMembership');
  }
  
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'updateMembership');
  }
  
  // Verify membership exists
  const membership = await Membership.findByPk(membershipId);
  if (!membership) {
    throw new AppError('Membership not found', 404, 'updateMembership');
  }
  
  // Update user's membership
  user.membershipId = membershipId;
  await user.save();
  
  return res.json({
    status: 'success',
    statuscode: 200,
    data: { 
      Result: 'Membership updated successfully',
      user: {
        id: user.id,
        username: user.username,
        membershipId: user.membershipId,
        membershipName: membership.name
      }
    }
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updatePassword,
  deleteUser,
  getDashboard,
  updateMembership
};