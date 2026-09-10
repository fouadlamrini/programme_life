const User = require('../models/user');
const programmeDayService = require('../services/programmeDayService');

// ==========================================
// GET TODAY PROGRAMME DAY
// ==========================================
// الموضع: 1) تحقق من الهوية  2) استقبال الطلب  3) استدعاء الخدمة  4) الرد
const getToday = async (req, res) => {
  try {
    // userId من الـ token فقط — لا نقبل أي userId من الـ body
    const user = await User.findById(req.userId).select('country city');
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const programmeDay = await programmeDayService.getCurrentProgrammeDay({
      now: new Date(),
      location: {
        country: user.country,
        city: user.city
      }
    });

    return res.status(200).json({ programmeDay });

  } catch (error) {
    return res.status(500).json({ message: 'حدث خطأ في السيرفر', error: error.message });
  }
};

module.exports = {
  getToday
};