const express = require('express');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { programmeDateRules } = require('../validations/programmeValidation');
const { getTimeline } = require('../controllers/prayerTimelineController');

const router = express.Router();

// Timeline برنامج يوم محدد (محمي) — التاريخ = تاريخ بداية برنامج اليوم (فجر)
router.get('/:date', authMiddleware, programmeDateRules, validate, getTimeline);

module.exports = router;