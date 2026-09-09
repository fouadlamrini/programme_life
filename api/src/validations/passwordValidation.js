const { body } = require('express-validator');

const changePasswordRules = [
  body('currentPassword')
    .notEmpty().withMessage('كلمة المرور الحالية مطلوبة')
    .trim(),

  body('newPassword')
    .notEmpty().withMessage('كلمة المرور الجديدة مطلوبة')
    .isLength({ min: 6 }).withMessage('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل')
    .trim(),

  body('confirmPassword')
    .notEmpty().withMessage('تأكيد كلمة المرور مطلوب')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('كلمتا المرور غير متطابقتين');
      }
      return true;
    }),
];

module.exports = {
  changePasswordRules
};