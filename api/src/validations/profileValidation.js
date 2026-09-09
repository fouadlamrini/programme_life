const { body } = require('express-validator');

const updateProfileRules = [
  body('firstName')
    .optional()
    .notEmpty().withMessage('الاسم الأول لا يمكن أن يكون فارغاً')
    .trim(),

  body('lastName')
    .optional()
    .notEmpty().withMessage('الاسم العائلي لا يمكن أن يكون فارغاً')
    .trim(),

  body('city')
    .optional()
    .notEmpty().withMessage('المدينة لا يمكن أن تكون فارغة')
    .trim(),

  body('country')
    .optional()
    .notEmpty().withMessage('البلد لا يمكن أن يكون فارغاً')
    .trim(),

  body('password')
    .optional()
    .isLength({ min: 6 }).withMessage('كلمة السر يجب أن تكون 6 أحرف على الأقل')
    .custom((value, { req }) => {
      if (value && value !== req.body.confirmPassword) {
        throw new Error('كلمتا المرور غير متطابقتين');
      }
      return true;
    }),
];

module.exports = {
  updateProfileRules
};