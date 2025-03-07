const express = require('express');
const router = express.Router();
const { login, register, refresh } = require('../controller/authController'); // Import login function

// POST /login route
router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refresh);

module.exports = router;