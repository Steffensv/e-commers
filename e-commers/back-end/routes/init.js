const express = require('express');
const router = express.Router();
const { initDatabase } = require('../controller/initController'); // Import the controller function

// POST /init route
router.post('/', initDatabase);

module.exports = router;