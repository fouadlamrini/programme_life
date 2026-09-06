const { body } = require('express-validator');

const registerRules = [
  body('firstName')
    .notEmpty().withMessage('الاسم الأول مطلوب')
    .trim(),

  body('lastName')
    .notEmpty().withMessage('الاسم العائلي مطلوب')
    .trim(),

  body('email')
    .isEmail().withMessage('البريد الإلكتروني غير صحيح')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 }).withMessage('كلمة السر يجب أن تكون 6 أحرف على الأقل'),

  body('sex')
    .isIn(['MALE', 'FEMALE']).withMessage('الجنس يجب أن يكون MALE أو FEMALE')
];

module.exports = {
  registerRules
};