const User = require('../models/user');
const programmeValidationService = require('../services/programmeValidationService');

// ==========================================
// VALIDATE PROGRAMME DAY (التحقق من البرنامج)
// ==========================================
// الموضع: 1) تحقق من الهوية  2) استقبال الطلب  3) استدعاء الخدمة  4) الرد
const validateProgrammeDay = async (req, res) => {
  try {
    const { date } = req.params;

    // userId من الـ token فقط — لا نقبل أي userId من الـ params أو body
    const user = await User.findById(req.userId).select('country city sleepTargetMinutes');
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const result = await programmeValidationService.validateProgrammeDay({
      user,
      programmeDate: date
    });

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({ message: 'حدث خطأ في التحقق من البرنامج', error: error.message });
  }
};

module.exports = {
  validateProgrammeDay
};