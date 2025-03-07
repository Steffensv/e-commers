const express = require('express');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const router = express.Router();
const productsController = require('../controller/productsController');

// Get all products (Optional auth to determine view)
router.get('/', optionalAuth, productsController.getAllProducts);

// Get products by category (Optional auth to determine view)
router.get('/category/:categoryId', optionalAuth, productsController.getProductsByCategory);

// Get products by brand (Optional auth to determine view)
router.get('/brand/:brandId', optionalAuth, productsController.getProductsByBrand);

// Get product by ID (Optional auth to determine view) - Must come AFTER other specific routes
router.get('/:id', optionalAuth, productsController.getProductById);

// Create a new product (Admin only)
router.post('/', authenticate, authorize([1]), productsController.createProduct);

// Update an existing product (Admin only)
router.put('/:id', authenticate, authorize([1]), productsController.updateProduct);

// Delete a product (Admin only)
router.delete('/:id', authenticate, authorize([1]), productsController.deleteProduct);

module.exports = router;