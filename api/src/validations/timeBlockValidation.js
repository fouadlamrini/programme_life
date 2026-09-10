const { body, param } = require('express-validator');
const { isValidHHMM } = require('../utils/time');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'];

const PRIORITIES = ['NON_NEGOTIABLE', 'HIGH', 'MEDIUM', 'LOW'];

// تاريخ حقيقي وليس 2026-99-99
const isRealDateKey = (value) => {
  if (!DATE_RE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

// معرّف برنامج اليوم: "YYYY-MM-DD" (تاريخ فجر بداية البرنامج اليوم)
const dateRules = [
  param('date')
    .matches(DATE_RE).withMessage('التاريخ يجب أن يكون بصيغة YYYY-MM-DD')
    .custom(isRealDateKey).withMessage('التاريخ غير صالح')
];

const dateAndBlockRules = [
  ...dateRules,
  param('blockId').isMongoId().withMessage('معرّف الفقرة الزمنية غير صالح')
];

const hhmmOptional = (field) =>
  body(field)
    .optional()
    .custom(isValidHHMM).withMessage(`التوقيت ${field} يجب أن يكون بصيغة HH:mm داخل اليوم`);

const createTimeBlockRules = [
  ...dateRules,
  body('activityId')
    .optional()
    .isMongoId().withMessage('معرّف النشاط غير صالح'),

  body('title')
    .trim()
    .custom((value, { req }) => {
      // title إجباري فقط عند عدم الإحالة على نشاط
      if (req.body.activityId) return true;
      return typeof value === 'string' && value.trim().length > 0;
    }).withMessage('عنوان الفقرة مطلوب عندما لا يتم اختيار نشاط'),

  body('priority')
    .optional()
    .isIn(PRIORITIES).withMessage('الأولوية غير صالحة'),

  body('startTime')
    .notEmpty().withMessage('وقت البداية مطلوب')
    .custom(isValidHHMM).withMessage('وقت البداية يجب أن يكون بصيغة HH:mm'),
  body('endTime')
    .notEmpty().withMessage('وقت النهاية مطلوب')
    .custom(isValidHHMM).withMessage('وقت النهاية يجب أن يكون بصيغة HH:mm'),

  body('status')
    .optional()
    .isIn(STATUSES).withMessage('الحالة غير صالحة')
];

const updateTimeBlockRules = [
  ...dateAndBlockRules,
  body('activityId')
    .optional({ values: 'undefined' })
    .isMongoId().withMessage('معرّف النشاط غير صالح'),

  body('title')
    .optional({ values: 'undefined' })
    .trim()
    .notEmpty().withMessage('عنوان الفقرة لا يمكن أن يكون فارغاً'),

  body('priority')
    .optional()
    .isIn(PRIORITIES).withMessage('الأولوية غير صالحة'),

  body('startTime')
    .optional()
    .custom(isValidHHMM).withMessage('وقت البداية يجب أن يكون بصيغة HH:mm'),
  body('endTime')
    .optional()
    .custom(isValidHHMM).withMessage('وقت النهاية يجب أن يكون بصيغة HH:mm'),

  body('status')
    .optional()
    .isIn(STATUSES).withMessage('الحالة غير صالحة')
];

module.exports = {
  dateRules,
  dateAndBlockRules,
  createTimeBlockRules,
  updateTimeBlockRules,
  isValidHHMM
};