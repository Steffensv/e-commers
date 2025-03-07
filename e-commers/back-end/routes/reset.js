const express = require('express');
const router = express.Router();
const { resetDb } = require('../controller/resetController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/reset:
 *   post:
 *     summary: Reset the database (development environment only)
 *     description: Drops all tables and recreates them, for development purposes only
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Database reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 statuscode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     Result:
 *                       type: string
 *                       example: Database reset completed successfully
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - admin privileges required or not in development environment
 *       500:
 *         description: Server error during reset operation
 */
router.post('/', authenticate, authorize([1]), resetDb);

module.exports = router;