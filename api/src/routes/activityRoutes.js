const express = require('express');
const { getMyActivities } = require('../controllers/activityController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// جلب أنشطة المستخدم الحالي (محمية)
router.get('/', authMiddleware, getMyActivities);

module.exports = router;