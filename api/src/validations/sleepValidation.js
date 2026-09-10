const { body } = require('express-validator');

const updateSleepRules = [
  body('sleepTargetMinutes')
    .exists().withMessage('مدة النوم المطلوبة ضرورية')
    .isInt({ min: 60, max: 1440 }).withMessage('مدة النوم يجب أن تكون بين 60 و 1440 دقيقة')
];

module.exports = {
  updateSleepRules
};