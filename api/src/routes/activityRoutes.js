const express = require('express');
const {
  createActivity,
  getMyActivities,
  getActivityById,
  updateActivity,
  deleteActivity
} = require('../controllers/activityController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createActivityRules, updateActivityRules, activityIdRules } = require('../validations/activityValidation');

const router = express.Router();

// جميع النشاطات محمية بالتحقق من الهوية
router.get('/', authMiddleware, getMyActivities);
router.post('/', authMiddleware, createActivityRules, validate, createActivity);
router.get('/:id', authMiddleware, activityIdRules, validate, getActivityById);
router.patch('/:id', authMiddleware, activityIdRules, updateActivityRules, validate, updateActivity);
router.delete('/:id', authMiddleware, activityIdRules, validate, deleteActivity);

module.exports = router;