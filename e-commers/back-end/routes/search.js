const express = require('express');
const router = express.Router();
const { searchProducts, advancedSearch } = require('../controller/searchController');

/**
 * @swagger
 * /api/search:
 *   post:
 *     summary: Search for products
 *     description: Search products by name, category, or brand
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search term
 *               type:
 *                 type: string
 *                 description: Search type (name, category, brand)
 *                 enum: [name, category, brand]
 *                 default: name
 *     responses:
 *       200:
 *         description: List of products matching the search criteria
 *       400:
 *         description: Invalid search parameters
 *       500:
 *         description: Server error
 */
router.post('/', searchProducts);
router.post('/advanced', advancedSearch);

module.exports = router;