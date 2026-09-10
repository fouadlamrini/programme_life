const { param } = require('express-validator');

// رقم يوم برنامج اليوم: صيغة "YYYY-MM-DD" تمثل تاريخ بداية برنامج اليوم (فجر → فجر الموالي)
const programmeDateRules = [
  param('date')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('التاريخ يجب أن يكون بصيغة YYYY-MM-DD')
    .custom((value) => {
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
      ) {
        throw new Error('التاريخ غير صالح');
      }
      return true;
    })
];

module.exports = {
  programmeDateRules
};