// src/routes/auth.routes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Login
router.post('/login', authController.login);
// Register
router.post('/register', authController.register);


module.exports = router;