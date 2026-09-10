const express = require('express');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { programmeDateRules } = require('../validations/programmeValidation');
const { validateProgrammeDay } = require('../controllers/programmeValidationController');

const router = express.Router();

// التحقق من برنامج يوم محدد (محمي) — التاريخ = تاريخ بداية برنامج اليوم (فجر)
router.get('/:date', authMiddleware, programmeDateRules, validate, validateProgrammeDay);

module.exports = router;