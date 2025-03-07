const { Cart, CartItem, Order, OrderItem, Product, User, Membership } = require('../models');
const { AppError, catchAsync } = require('../middleware/errorHandler');


//Generate a unique 8-character order number
const generateOrderNumber = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

//Calculate total items purchased by a user
//Used for membership level determination
const calculateTotalPurchasedItems = async (userId) => {
  const result = await OrderItem.findOne({
    attributes: [
      [sequelize.fn('SUM', sequelize.col('quantity')), 'totalItems']
    ],
    include: [{
      model: Order,
      attributes: [],
      where: { userId, status: 'Completed' } // Only count completed orders
    }],
    raw: true
  });
  
  return result.totalItems || 0;
};

//Update user membership based on total purchased items
const updateUserMembership = async (userId, totalItems) => {
  const user = await User.findByPk(userId);
  if (!user) return;
  
  // Membership upgrade logic based on items purchased
  if (totalItems >= 30 && user.membershipId !== 3) {
    // Upgrade to Gold (assuming Gold has id 3)
    user.membershipId = 3;
    await user.save();
    return 'Gold';
  } else if (totalItems >= 15 && totalItems < 30 && user.membershipId !== 2) {
    // Upgrade to Silver (assuming Silver has id 2)
    user.membershipId = 2;
    await user.save();
    return 'Silver';
  }
  
  return null; // No change
};

// Get cart - refactored with catchAsync and AppError
const getCart = catchAsync(async (req, res) => {
  // Handle possible case differences in user ID prop
  const userId = req.user.Id || req.user.id;
  console.log('Getting cart for user ID:', userId);
  
  // Find user's cart with items
  let cart = await Cart.findOne({
    where: { userId: userId, status: 'active' },
    include: [{
      model: CartItem,
      include: [Product]
    }]
  });

  if (!cart) {
    // Create a new cart if none exists
    cart = await Cart.create({
      userId: userId,
      status: 'active'
    });
    
    // Reload with associations
    cart = await Cart.findByPk(cart.id, {
      include: [{
        model: CartItem,
        include: [Product]
      }]
    });
  }

  // Calculate total price
  let totalPrice = 0;
  const cartItems = cart.CartItems.map(item => {
    const itemTotal = item.quantity * item.Product.price;
    totalPrice += itemTotal;
    
    return {
      id: item.id,
      productId: item.productId,
      name: item.Product.name,
      description: item.Product.description,
      price: item.Product.price,
      quantity: item.quantity,
      total: itemTotal,
      imgUrl: item.Product.imgUrl
    };
  });

  console.log(`Cart found with ${cartItems.length} items, total: $${totalPrice}`);
  
  res.json({
    status: 'success',
    statuscode: 200,
    data: {
      cart: {
        id: cart.id,
        items: cartItems,
        totalPrice
      }
    }
  });
});

// Add item to cart - refactored with catchAsync and AppError
const addToCart = catchAsync(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  
  if (!productId) {
    throw new AppError('Product ID is required', 400, 'addToCart');
  }

  // Check if product exists
  const product = await Product.findByPk(productId);
  if (!product) {
    throw new AppError('Product not found', 404, 'addToCart');
  }
  
  // Check if product is deleted
  if (product.isDeleted) {
    throw new AppError('This product is no longer available', 400, 'addToCart');
  }

  // Check if product is in stock
  if (product.quantity < quantity) {
    throw new AppError('Insufficient stock', 400, 'addToCart');
  }

  // Find or create user's cart
  let cart = await Cart.findOne({
    where: { userId: req.user.id, status: 'active' }
  });

  if (!cart) {
    cart = await Cart.create({
      userId: req.user.id,
      status: 'active'
    });
  }

  // Check if product already in cart
  let cartItem = await CartItem.findOne({
    where: { cartId: cart.id, productId }
  });

  if (cartItem) {
    // Update quantity if product already in cart
    cartItem.quantity += parseInt(quantity);
    
    // Verify updated quantity doesn't exceed stock
    if (cartItem.quantity > product.quantity) {
      throw new AppError(`Cannot add ${quantity} more item(s) - exceeds available stock`, 400, 'addToCart');
    }
    
    await cartItem.save();
  } else {
    // Add new item to cart
    cartItem = await CartItem.create({
      cartId: cart.id,
      productId,
      quantity
    });
  }

  res.json({
    status: 'success',
    statuscode: 200,
    data: {
      Result: 'Product added to cart',
      cartItem: {
        id: cartItem.id,
        productId,
        quantity: cartItem.quantity
      }
    }
  });
});

// Update cart item quantity - refactored with catchAsync and AppError
const updateCartItem = catchAsync(async (req, res) => {
  const { cartItemId, quantity } = req.body;
  
  if (!cartItemId || !quantity) {
    throw new AppError('Cart item ID and quantity are required', 400, 'updateCartItem');
  }

  // Find the cart item
  const cartItem = await CartItem.findOne({
    where: { id: cartItemId },
    include: [{
      model: Cart,
      where: { userId: req.user.id, status: 'active' }
    }]
  });

  if (!cartItem) {
    throw new AppError('Cart item not found', 404, 'updateCartItem');
  }

  // Check if product is in stock
  const product = await Product.findByPk(cartItem.productId);
  
  // Verify product exists and is not deleted
  if (!product || product.isDeleted) {
    throw new AppError('Product is no longer available', 400, 'updateCartItem');
  }
  
  // Check stock
  if (product.quantity < quantity) {
    throw new AppError(`Insufficient stock. Only ${product.quantity} available.`, 400, 'updateCartItem');
  }

  // Update quantity
  cartItem.quantity = quantity;
  await cartItem.save();

  res.json({
    status: 'success',
    statuscode: 200,
    data: {
      Result: 'Cart item updated',
      cartItem: {
        id: cartItem.id,
        productId: cartItem.productId,
        quantity: cartItem.quantity
      }
    }
  });
});

// Remove item from cart - refactored with catchAsync and AppError
const removeFromCart = catchAsync(async (req, res) => {
  const { cartItemId } = req.params;

  // Find the cart item
  const cartItem = await CartItem.findOne({
    where: { id: cartItemId },
    include: [{
      model: Cart,
      where: { userId: req.user.id, status: 'active' }
    }]
  });

  if (!cartItem) {
    throw new AppError('Cart item not found', 404, 'removeFromCart');
  }

  // Delete the cart item
  await cartItem.destroy();

  res.json({
    status: 'success',
    statuscode: 200,
    data: { Result: 'Item removed from cart' }
  });
});

// Process payment with dummy payment gateway
const processPayment = async (paymentDetails) => {
  // This is a dummy payment processor for testing purposes
  // In a real application, this would integrate with a payment gateway like Stripe, PayPal, etc.
  
  return new Promise((resolve, reject) => {
    // Simulate API call to payment gateway
    setTimeout(() => {
      // Validate card number (simple mock validation - accepts any 16-digit number)
      const cardNumberValid = /^\d{16}$/.test(paymentDetails.cardNumber);
      
      // Validate expiry (simple mock validation - accepts any MM/YY format)
      const expiryValid = /^\d{2}\/\d{2}$/.test(paymentDetails.expiry);
      
      // Validate CVV (simple mock validation - accepts any 3-digit number)
      const cvvValid = /^\d{3}$/.test(paymentDetails.cvv);
      
      // Always succeed for test cards starting with "4111"
      const isTestCard = paymentDetails.cardNumber.startsWith('4111');
      
      if (isTestCard || (cardNumberValid && expiryValid && cvvValid)) {
        resolve({
          success: true,
          transactionId: 'mock_' + Math.random().toString(36).substring(2, 15),
          message: 'Payment processed successfully'
        });
      } else {
        reject({
          success: false,
          error: 'Payment failed',
          details:  !cardNumberValid ? 'Invalid card number' : 
                    !expiryValid ? 'Invalid expiry date' : 
                    !cvvValid ? 'Invalid CVV' : 'Unknown error'
        });
      }
    }, 1000); // Simulate 1 second processing time
  });
};

// Create an order from cart - refactored with catchAsync and AppError
const checkout = catchAsync(async (req, res) => {
  const { paymentDetails } = req.body;
  
  // Basic validation
  if (!paymentDetails || !paymentDetails.cardNumber || !paymentDetails.expiry || !paymentDetails.cvv) {
    throw new AppError('Payment details are required (cardNumber, expiry, cvv)', 400, 'checkout');
  }
  
  // Find user's cart
  const cart = await Cart.findOne({
    where: { userId: req.user.id, status: 'active' },
    include: [{
      model: CartItem,
      include: [Product]
    }]
  });

  if (!cart || cart.CartItems.length === 0) {
    throw new AppError('Cart is empty', 400, 'checkout');
  }
  
  // Verify all products are still available and have sufficient stock
  for (const item of cart.CartItems) {
    const product = item.Product;
    
    if (product.isDeleted) {
      throw new AppError(`Product "${product.name}" is no longer available`, 400, 'checkout');
    }
    
    if (product.quantity < item.quantity) {
      throw new AppError(`Insufficient stock for "${product.name}". Only ${product.quantity} available.`, 400, 'checkout');
    }
  }

  // Get user membership for discount
  const user = await User.findByPk(req.user.id, {
    include: [{ model: Membership, as: 'membership' }]
  });
  
  if (!user.membership) {
    throw new AppError('Membership information not found', 500, 'checkout');
  }
  
  const membershipDiscount = user.membership ? user.membership.discount / 100 : 0;
  const membershipName = user.membership ? user.membership.name : 'Bronze';
  
  // Calculate order total with discount
  let totalBeforeDiscount = 0;
  cart.CartItems.forEach(item => {
    totalBeforeDiscount += item.quantity * item.Product.price;
  });
  
  const discountAmount = totalBeforeDiscount * membershipDiscount;
  const totalAfterDiscount = totalBeforeDiscount - discountAmount;

  // Generate unique order number
  const orderNumber = generateOrderNumber();

  try {
    // Process the payment
    const paymentResult = await processPayment({
      amount: totalAfterDiscount,
      cardNumber: paymentDetails.cardNumber,
      expiry: paymentDetails.expiry,
      cvv: paymentDetails.cvv,
      name: paymentDetails.name || ''
    });
    
    // Create order with membership data
    const order = await Order.create({
      userId: req.user.id,
      status: 'In Progress', // Initial status
      totalAmount: totalAfterDiscount,
      discountAmount,
      orderNumber,
      membershipStatus: membershipName,
      membershipDiscount: membershipDiscount * 100, // Store as percentage
      paymentDetails: JSON.stringify({
        cardNumber: `XXXX-XXXX-XXXX-${paymentDetails.cardNumber.slice(-4)}`, // Mask card number
        transactionId: paymentResult.transactionId
      })
    });

    // Create order items and update inventory
    for (const item of cart.CartItems) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.Product.price // Store current price at time of order
      });

      // Update product inventory
      const product = item.Product;
      product.quantity -= item.quantity;
      await product.save();
    }

    // Mark cart as completed
    cart.status = 'completed';
    await cart.save();

    // Calculate total purchased items to update membership if needed
    const totalPurchasedItems = await calculateTotalPurchasedItems(req.user.id);
    const newMembershipStatus = await updateUserMembership(req.user.id, totalPurchasedItems);
    
    // Add message about membership upgrade if applicable
    let membershipMessage = '';
    if (newMembershipStatus) {
      membershipMessage = `Congratulations! You've been upgraded to ${newMembershipStatus} membership!`;
    }

    res.json({
      status: 'success',
      statuscode: 200,
      data: {
        Result: 'Order placed successfully',
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalBeforeDiscount,
          discountAmount,
          totalAfterDiscount,
          transactionId: paymentResult.transactionId,
          membershipMessage: membershipMessage || undefined
        }
      }
    });
    
  } catch (paymentError) {
    // Payment failed - convert to AppError and throw
    throw new AppError(
      `Payment failed: ${paymentError.details || 'Unknown payment error'}`, 
      400, 
      'checkout.processPayment'
    );
  }
});

// Get user's orders - refactored with catchAsync and AppError
const getUserOrders = catchAsync(async (req, res) => {
  const orders = await Order.findAll({
    where: { userId: req.user.id },
    include: [{
      model: OrderItem,
      include: [Product]
    }],
    order: [['createdAt', 'DESC']]
  });

  // Format order data for response
  const formattedOrders = orders.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    status: order.status,
    totalAmount: order.totalAmount,
    discountAmount: order.discountAmount,
    membershipStatus: order.membershipStatus,
    membershipDiscount: order.membershipDiscount,
    items: order.OrderItems.map(item => ({
      id: item.id,
      productId: item.productId,
      name: item.Product.name,
      price: item.price, // Price at time of order
      quantity: item.quantity,
      total: item.price * item.quantity,
      imgUrl: item.Product.imgUrl
    }))
  }));

  res.json({
    status: 'success',
    statuscode: 200,
    data: { orders: formattedOrders }
  });
});

// Get single order details - refactored with catchAsync and AppError
const getOrderDetails = catchAsync(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findOne({
    where: { id: orderId, userId: req.user.id },
    include: [{
      model: OrderItem,
      include: [Product]
    }]
  });

  if (!order) {
    throw new AppError('Order not found', 404, 'getOrderDetails');
  }

  // Format order for response
  const formattedOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    status: order.status,
    totalAmount: order.totalAmount,
    discountAmount: order.discountAmount, 
    membershipStatus: order.membershipStatus,
    membershipDiscount: order.membershipDiscount,
    items: order.OrderItems.map(item => ({
      id: item.id,
      productId: item.productId,
      name: item.Product.name,
      price: item.price, // Price at time of order, not current product price
      quantity: item.quantity,
      total: item.price * item.quantity,
      imgUrl: item.Product.imgUrl
    }))
  };

  res.json({
    status: 'success',
    statuscode: 200,
    data: { order: formattedOrder }
  });
});

// Admin-only: Update order status - refactored with catchAsync and AppError
const updateOrderStatus = catchAsync(async (req, res) => {
  const { orderId, status } = req.body;
  
  // Verify user is admin
  if (!req.user.isAdmin) {
    throw new AppError('Unauthorized: Only admins can update order status', 403, 'updateOrderStatus');
  }
  
  // Validate status
  const validStatuses = ['In Progress', 'Ordered', 'Completed'];
  if (!validStatuses.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400, 'updateOrderStatus');
  }
  
  // Find the order
  const order = await Order.findByPk(orderId);
  
  if (!order) {
    throw new AppError('Order not found', 404, 'updateOrderStatus');
  }
  
  // Update the status
  order.status = status;
  await order.save();
  
  // If status changed to Completed, update membership status
  if (status === 'Completed') {
    const totalPurchasedItems = await calculateTotalPurchasedItems(order.userId);
    await updateUserMembership(order.userId, totalPurchasedItems);
  }
  
  res.json({
    status: 'success',
    statuscode: 200,
    data: { 
      Result: 'Order status updated successfully',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status
      }
    }
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  checkout,
  getUserOrders,
  getOrderDetails,
  updateOrderStatus
};