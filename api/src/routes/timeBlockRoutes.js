const express = require('express');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  dateRules,
  dateAndBlockRules,
  createTimeBlockRules,
  updateTimeBlockRules
} = require('../validations/timeBlockValidation');
const {
  createTimeBlock,
  listTimeBlocks,
  getTimeBlock,
  updateTimeBlock,
  deleteTimeBlock
} = require('../controllers/timeBlockController');

const router = express.Router();

// جميع المسارات محمية بالتحقق من الهوية — userId من الـ token فقط
// المسار الكامل: /api/daily-schedules/:date/time-blocks...
router.get('/:date/time-blocks', authMiddleware, dateRules, validate, listTimeBlocks);
router.post('/:date/time-blocks', authMiddleware, createTimeBlockRules, validate, createTimeBlock);
router.get('/:date/time-blocks/:blockId', authMiddleware, dateAndBlockRules, validate, getTimeBlock);
router.patch('/:date/time-blocks/:blockId', authMiddleware, updateTimeBlockRules, validate, updateTimeBlock);
router.delete('/:date/time-blocks/:blockId', authMiddleware, dateAndBlockRules, validate, deleteTimeBlock);

module.exports = router;