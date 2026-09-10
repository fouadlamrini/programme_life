const User = require('../models/user');
const prayerTimelineService = require('../services/prayerTimelineService');

// ==========================================
// GET PRAYER-BASED TIMELINE
// ==========================================
// الموضع: 1) تحقق من الهوية  2) استقبال الطلب  3) استدعاء الخدمة  4) الرد
const getTimeline = async (req, res) => {
  try {
    const { date } = req.params;

    // userId من الـ token فقط — لا نقبل أي userId من الـ params أو body
    const user = await User.findById(req.userId).select('country city sleepTargetMinutes');
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const timeline = await prayerTimelineService.getPrayerTimeline({
      user,
      programmeDate: date
    });

    return res.status(200).json({ timeline });

  } catch (error) {
    return res.status(500).json({ message: 'حدث خطأ في بناء timeline', error: error.message });
  }
};

module.exports = {
  getTimeline
};