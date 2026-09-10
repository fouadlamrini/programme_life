const express = require('express');
const { getToday } = require('../controllers/programmeDayController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// تحديد برنامج اليوم الحالي (محمي)
router.get('/today', authMiddleware, getToday);

module.exports = router;