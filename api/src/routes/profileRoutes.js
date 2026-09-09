const express = require('express');
const router = express.Router();

// 1. Middleware العام للأخطاء
const validate = require('../middleware/validate');

// 2. Auth Middleware (JWT)
const authMiddleware = require('../middleware/auth');

// 3. Validation Rules ديال Update Profile
const { updateProfileRules } = require('../validations/profileValidation');

// 4. Validation Rules ديال Change Password
const { changePasswordRules } = require('../validations/passwordValidation');

// 5. Controllers ديال Profile
const { getMe, updateProfile, changePassword } = require('../controllers/profileController');

// ==========================================
// PROFILE ROUTES (كلها محمية بـ JWT)
// ==========================================

// جلب بيانات المستخدم الحالي
router.get('/me', authMiddleware, getMe);

// تحديث بيانات المستخدم الحالي
router.put('/me', authMiddleware, updateProfileRules, validate, updateProfile);

// تغيير كلمة السر (منفصل عن تحديث البيانات)
router.put('/password', authMiddleware, changePasswordRules, validate, changePassword);

module.exports = router;