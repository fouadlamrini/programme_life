const express = require('express');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateSleepRules } = require('../validations/sleepValidation');
const { getSleep, updateSleep } = require('../controllers/sleepController');

const router = express.Router();

// جميع مسارات النوم محمية بالتحقق من الهوية
router.get('/', authMiddleware, getSleep);
router.patch('/', authMiddleware, updateSleepRules, validate, updateSleep);

module.exports = router;