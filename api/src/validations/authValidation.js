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
    .normalizeEmail({ gmail_remove_dots: false }),

  body('password')
    .isLength({ min: 6 }).withMessage('كلمة السر يجب أن تكون 6 أحرف على الأقل'),

  body('sex')
    .isIn(['homme', 'femme']).withMessage('الجنس يجب أن يكون homme أو femme')
];

const loginRules = [
  body('email')
    .isEmail().withMessage('البريد الإلكتروني غير صحيح')
    .normalizeEmail({ gmail_remove_dots: false }),

  body('password')
    .notEmpty().withMessage('كلمة السر مطلوبة')
    .trim()
];

module.exports = {
  registerRules,
  loginRules
};