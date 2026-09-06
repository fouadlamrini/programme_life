const express = require('express');
const router = express.Router();

// 1. Middleware العام للأخطاء
const validate = require('../middleware/validate');

// 2. Validation Rules ديال Register
const { registerRules } = require('../validations/authValidation');

// 3. Controller ديال Register
const { register } = require('../controllers/authController');

// ==========================================
// AUTH ROUTES
// ==========================================

// Route الوحيد المكتوب لحد الآن
router.post('/register', registerRules, validate, register);

module.exports = router;