const Activity = require('../models/Activity');

// ==========================================
// GET MY ACTIVITIES CONTROLLER (جلب أنشطة المستخدم الحالي)
// ==========================================
const getMyActivities = async (req, res) => {
  try {
    // 1. جلب الأنشطة بـ userId اللي جا من الـ token فقط (ماشي من الـ body)
    const activities = await Activity.find({ userId: req.userId }).sort({ createdAt: 1 });

    return res.status(200).json({
      activities
    });

  } catch (error) {
    return res.status(500).json({ message: 'حدث خطأ في السيرفر', error: error.message });
  }
};

module.exports = {
  getMyActivities
};