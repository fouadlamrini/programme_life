const { body, param } = require('express-validator');

const TIME_SLOTS = [
  'AT_PRAYER_TIME',
  'POST_FAJR',
  'POST_DHUHR',
  'POST_ASR',
  'POST_MAGHRIB',
  'POST_ISHA',
  'BEFORE_SLEEP',
  'ANYTIME'
];

const PRIORITIES = ['NON_NEGOTIABLE', 'HIGH', 'MEDIUM', 'LOW'];

const TYPES = [
  'PRAYER',
  'QURAN',
  'ADHKAR',
  'DUA',
  'SLEEP',
  'MEAL',
  'STUDY',
  'WORK',
  'SPORT',
  'CHESS',
  'PERSONAL',
  'OTHER'
];

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

// إزالة التكرار من الأيام وترتيبها تصاعدياً
const dedupeAndSortDays = (days) => {
  if (!Array.isArray(days)) return days;
  return [...new Set(days.map(Number))].sort((a, b) => a - b);
};

const activityBodyRules = (optional = false) => [
  body('title')
    .if(optional ? (_, { req }) => req.body.title !== undefined : () => true)
    .notEmpty().withMessage('عنوان النشاط مطلوب')
    .trim(),

  body('durationMinutes')
    .if(optional ? (_, { req }) => req.body.durationMinutes !== undefined : () => true)
    .isInt({ min: 1, max: 1440 }).withMessage('المدة يجب أن تكون عدد دقائق بين 1 و 1440').toInt(),

  body('preferredTimeSlot')
    .if(optional ? (_, { req }) => req.body.preferredTimeSlot !== undefined : () => true)
    .isIn(TIME_SLOTS).withMessage('الخانة الزمنية المفضلة غير صالحة'),

  body('priority')
    .optional()
    .isIn(PRIORITIES).withMessage('الأولوية غير صالحة'),

  body('type')
    .optional({ values: 'undefined' })
    .isIn(TYPES).withMessage('نوع النشاط غير صالح'),

  body('repeatDays')
    .if(optional ? (_, { req }) => req.body.repeatDays !== undefined : () => true)
    .isArray({ min: 1 }).withMessage('يجب اختيار يوم واحد على الأقل')
    .customSanitizer(dedupeAndSortDays)
    .custom((days) => {
      if (!Array.isArray(days) || days.length === 0) return false;
      return days.every((day) => Number.isInteger(day) && WEEKDAYS.includes(day));
    }).withMessage('أيام التكرار يجب أن تكون أرقاماً بين 1 و 7')
];

const createActivityRules = activityBodyRules(false);

const updateActivityRules = activityBodyRules(true);

const activityIdRules = [
  param('id').isMongoId().withMessage('معرّف النشاط غير صالح')
];

module.exports = {
  createActivityRules,
  updateActivityRules,
  activityIdRules
};