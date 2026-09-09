const express = require('express');
const router = express.Router();

// 1. Middleware العام للأخطاء
const validate = require('../middleware/validate');

// 2. Auth Middleware (JWT)
const authMiddleware = require('../middleware/auth');

// 3. Validation Rules ديال Update Profile
const { updateProfileRules } = require('../validations/profileValidation');

// 4. Controllers ديال Profile
const { getMe, updateProfile } = require('../controllers/profileController');

// ==========================================
// PROFILE ROUTES (كلها محمية بـ JWT)
// ==========================================

// جلب بيانات المستخدم الحالي
router.get('/me', authMiddleware, getMe);

// تحديث بيانات المستخدم الحالي
router.put('/me', authMiddleware, updateProfileRules, validate, updateProfile);

module.exports = router;