const express = require("express");
const { User, Role, Product, Order, Membership, Category, Brand } = require('../models');
const { authenticate, authorize } = require("../middleware/auth");
const router = express.Router();
require("dotenv").config();


// ADMIN USER MANAGEMENT

/* GET users listing. */
router.get('/', authenticate, authorize([1]), async (req, res) => {
  try {
    const users = await User.findAll().select('name email phone address');
    res.json({ status: 'success', statuscode: 200, data: { Result: 'Users found', users } });
  } catch (error) {
    res.status(500).json({ status: 'error', statuscode: 500, data: { Result: error.message } });
  }
});

// Get all roles (Admin only)
router.get('/roles', authenticate, authorize([1]), async (req, res) => {
	try {
		const roles = await Role.findAll();
		res.json({
			status: "success",
			statuscode: 200,
			data: { Result: "Roles retrieved", roles },
		});
	} catch (error) {
		res
			.status(500)
			.json({
				status: "error",
				statuscode: 500,
				data: { Result: error.message },
			});
	}
});

// Change user role (Admin only)
router.put('/role/:id', authenticate, authorize([1]), async (req, res) => {
	try {
		const user = await User.update(
			{ roleId: req.body.roleId },
			{ where: { id: req.params.id } }
		);
		res.json({
			status: "success",
			statuscode: 200,
			data: { Result: "User role updated", user },
		});
	} catch (error) {
		res
			.status(500)
			.json({
				status: "error",
				statuscode: 500,
				data: { Result: error.message },
			});
	}
});


// ADMIN PRODUCT MANAGEMENT
// Create a new product
router.post('/', authenticate, authorize([1]), async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.json({ status: 'success', statuscode: 201, data: { Result: 'Product created', product } });
  } catch (error) {
    res.status(500).json({ status: 'error', statuscode: 500, data: { Result: error.message } });
  }
});

// Update a product
router.put('/:id', authenticate, authorize([1]), async (req, res) => {
  try {
    const product = await Product.update(req.body, { where: { id: req.params.id } });
    res.json({ status: 'success', statuscode: 200, data: { Result: 'Product updated', product } });
  } catch (error) {
    res.status(500).json({ status: 'error', statuscode: 500, data: { Result: error.message } });
  }
});

// Soft delete a product
router.delete('/:id', authenticate, authorize([1]), async (req, res) => {
  try {
    const product = await Product.update({ isDeleted: true }, { where: { id: req.params.id } });
    res.json({ status: 'success', statuscode: 200, data: { Result: 'Product deleted', product } });
  } catch (error) {
    res.status(500).json({ status: 'error', statuscode: 500, data: { Result: error.message } });
  }
});


// ADMIN ORDER MANAGEMENT
// Update an order
router.put('/:id', authenticate, authorize([1]), async (req, res) => {
  try {
    const order = await Order.update(req.body, { where: { id: req.params.id } });
    res.json({ status: 'success', statuscode: 200, data: { Result: 'Order updated', order } });
  } catch (error) {
    res.status(500).json({ status: 'error', statuscode: 500, data: { Result: error.message } });
  }
});

// Delete an order
router.delete('/:id', authenticate, authorize([1]), async (req, res) => {
  try {
    await Order.destroy({ where: { id: req.params.id } });
    res.json({ status: 'success', statuscode: 200, data: { Result: 'Order deleted' } });
  } catch (error) {
    res.status(500).json({ status: 'error', statuscode: 500, data: { Result: error.message } });
  }
});


// ADMIN MEMBERSHIP MANAGEMENT
// Create a new membership
router.post('/', authenticate, authorize([1]), async (req, res) => {
  try {
    const membership = await Membership.create(req.body);
    res.json({ status: 'success', statuscode: 201, data: { Result: 'Membership created', membership } });
  } catch (error) {
    res.status(500).json({ status: 'error', statuscode: 500, data: { Result: error.message } });
  }
});

// Update a membership
router.put('/:id', authenticate, authorize([1]), async (req, res) => {
  try {
    const membership = await Membership.update(req.body, { where: { id: req.params.id } });
    res.json({ status: 'success', statuscode: 200, data: { Result: 'Membership updated', membership } });
  } catch (error) {
    res.status(500).json({ status: 'error', statuscode: 500, data: { Result: error.message } });
  }
});

// Delete a membership
router.delete('/:id', authenticate, authorize([1]), async (req, res) => {
  try {
    await Membership.destroy({ where: { id: req.params.id } });
    res.json({ status: 'success', statuscode: 200, data: { Result: 'Membership deleted' } });
  } catch (error) {
    res.status(500).json({ status: 'error', statuscode: 500, data: { Result: error.message } });
  }
});


// ADMIN CATEGORY MANAGEMENT
// Create a new category
router.post('/', authenticate, authorize([1]), async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.json({ status: 'success', statuscode: 201, data: { Result: 'Category created', category } });
  } catch (error) {
    res.status(500).json({ status: 'error', statuscode: 500, data: { Result: error.message } });
  }
});

// Update a category
router.put('/:id', authenticate, authorize([1]), async (req, res) => {
  try {
    const category = await Category.update(req.body, { where: { id: req.params.id } });
    res.json({ status: 'success', statuscode: 200, data: { Result: 'Category updated', category } });
  } catch (error) {
    res.status(500).json({ status: 'error', statuscode: 500, data: { Result: error.message } });
  }
});

// Delete a category
router.delete('/:id', authenticate, authorize([1]), async (req, res) => {
  try {
    await Category.destroy({ where: { id: req.params.id } });
    res.json({ status: 'success', statuscode: 200, data: { Result: 'Category deleted' } });
  } catch (error) {
    res.status(500).json({ status: 'error', statuscode: 500, data: { Result: error.message } });
  }
});


// ADMIN BRAND MANAGEMENT
// Create a new brand
router.post('/', authenticate, authorize([1]), async (req, res) => {
  try {
    const brand = await Brand.create(req.body);
    res.json({ status: 'success', statuscode: 201, data: { Result: 'Brand created', brand } });
  } catch (error) {
    res.status(500).json({ status: 'error', statuscode: 500, data: { Result: error.message } });
  }
});

// Update a brand
router.put('/:id', authenticate, authorize([1]), async (req, res) => {
  try {
    const brand = await Brand.update(req.body, { where: { id: req.params.id } });
    res.json({ status: 'success', statuscode: 200, data: { Result: 'Brand updated', brand } });
  } catch (error) {
    res.status(500).json({ status: 'error', statuscode: 500, data: { Result: error.message } });
  }
});

// Delete a brand
router.delete('/:id', authenticate, authorize([1]), async (req, res) => {
  try {
    await Brand.destroy({ where: { id: req.params.id } });
    res.json({ status: 'success', statuscode: 200, data: { Result: 'Brand deleted' } });
  } catch (error) {
    res.status(500).json({ status: 'error', statuscode: 500, data: { Result: error.message } });
  }
});


module.exports = router;
