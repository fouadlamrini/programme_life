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
];

module.exports = {
  updateProfileRules
};