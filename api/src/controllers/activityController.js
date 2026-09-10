const Activity = require('../models/Activity');

// ==========================================
// CREATE ACTIVITY (إنشاء نشاط جديد)
// ==========================================
const createActivity = async (req, res) => {
  try {
    // userId مأخوذ فقط من الـ token (req.userId) — لا نثق في أي userId من الـ body
    const { title, durationMinutes, preferredTimeSlot, priority, type, repeatDays } = req.body;

    const activity = await Activity.create({
      title,
      durationMinutes,
      preferredTimeSlot,
      priority: priority || 'MEDIUM',
      type: type || 'OTHER',
      repeatDays,
      userId: req.userId
    });

    return res.status(201).json({
      message: 'تم إنشاء النشاط بنجاح',
      activity
    });

  } catch (error) {
    return res.status(500).json({ message: 'حدث خطأ في السيرفر', error: error.message });
  }
};

// ==========================================
// GET MY ACTIVITIES (جلب أنشطة المستخدم الحالي)
// ==========================================
const getMyActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.userId }).sort({ createdAt: 1 });

    return res.status(200).json({ activities });

  } catch (error) {
    return res.status(500).json({ message: 'حدث خطأ في السيرفر', error: error.message });
  }
};

// ==========================================
// GET ACTIVITY BY ID (نشاط واحد مملوك للمستخدم)
// ==========================================
const getActivityById = async (req, res) => {
  try {
    // التحقق من الملكية: _id + userId اللي جا من الـ token
    const activity = await Activity.findOne({ _id: req.params.id, userId: req.userId });
    if (!activity) {
      return res.status(404).json({ message: 'النشاط غير موجود' });
    }

    return res.status(200).json({ activity });

  } catch (error) {
    return res.status(500).json({ message: 'حدث خطأ في السيرفر', error: error.message });
  }
};

// ==========================================
// UPDATE ACTIVITY (تحديث نشاط مملوك للمستخدم)
// ==========================================
const updateActivity = async (req, res) => {
  try {
    // التحقق من الملكية قبل التحديث
    const activity = await Activity.findOne({ _id: req.params.id, userId: req.userId });
    if (!activity) {
      return res.status(404).json({ message: 'النشاط غير موجود' });
    }

    // تحديث الحقول المسموحة فقط (لا نسمح بتغيير userId أو isSystem أو isDefault)
    const { title, durationMinutes, preferredTimeSlot, priority, type, repeatDays } = req.body;

    if (title !== undefined) activity.title = title;
    if (durationMinutes !== undefined) activity.durationMinutes = durationMinutes;
    if (preferredTimeSlot !== undefined) activity.preferredTimeSlot = preferredTimeSlot;
    if (priority !== undefined) activity.priority = priority;
    if (type !== undefined) activity.type = type;
    if (repeatDays !== undefined) activity.repeatDays = repeatDays;

    await activity.save();

    return res.status(200).json({
      message: 'تم تحديث النشاط بنجاح',
      activity
    });

  } catch (error) {
    return res.status(500).json({ message: 'حدث خطأ في السيرفر', error: error.message });
  }
};

// ==========================================
// DELETE ACTIVITY (حذف نشاط) — نشاط النظام محمي
// ==========================================
const deleteActivity = async (req, res) => {
  try {
    // التحقق من الملكية قبل الحذف
    const activity = await Activity.findOne({ _id: req.params.id, userId: req.userId });
    if (!activity) {
      return res.status(404).json({ message: 'النشاط غير موجود' });
    }

    if (activity.isSystem) {
      return res.status(400).json({ message: 'لا يمكن حذف نشاط النظام' });
    }

    await Activity.deleteOne({ _id: activity._id, userId: req.userId });

    return res.status(200).json({ message: 'تم حذف النشاط بنجاح' });

  } catch (error) {
    return res.status(500).json({ message: 'حدث خطأ في السيرفر', error: error.message });
  }
};

module.exports = {
  createActivity,
  getMyActivities,
  getActivityById,
  updateActivity,
  deleteActivity
};