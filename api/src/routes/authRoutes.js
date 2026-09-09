const express = require('express');
const router = express.Router();

// 1. Middleware العام للأخطاء
const validate = require('../middleware/validate');

// 2. Validation Rules ديال Register و Login
const { registerRules, loginRules } = require('../validations/authValidation');

// 3. Controllers ديال Register و Login
const { register, login } = require('../controllers/authController');

// ==========================================
// AUTH ROUTES
// ==========================================

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);

module.exports = router;