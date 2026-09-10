const User = require('../models/user');
const sleepService = require('../services/sleepService');

// ==========================================
// GET SLEEP SETTINGS (إعدادات النوم + الفترة المحسوبة)
// ==========================================
const getSleep = async (req, res) => {
  try {
    // userId من الـ token فقط — لا نقبل أي userId من الـ body
    const user = await User.findById(req.userId).select('country city sleepTargetMinutes');
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const schedule = await sleepService.getSleepSchedule({
      userId: user._id,
      now: new Date(),
      location: {
        country: user.country,
        city: user.city
      },
      sleepTargetMinutes: user.sleepTargetMinutes
    });

    return res.status(200).json(schedule);

  } catch (error) {
    // يتضمن فشل حساب أوقات الصلاة — لا نخترع وقت فجر
    return res.status(500).json({ message: 'تعذر حساب وقت النوم', error: error.message });
  }
};

// ==========================================
// PATCH SLEEP SETTINGS (تحديث مدة النوم المطلوبة)
// ==========================================
const updateSleep = async (req, res) => {
  try {
    const { sleepTargetMinutes } = req.body;

    const user = await User.findById(req.userId).select('country city sleepTargetMinutes');
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    user.sleepTargetMinutes = sleepTargetMinutes;
    await user.save();

    const schedule = await sleepService.getSleepSchedule({
      userId: user._id,
      now: new Date(),
      location: {
        country: user.country,
        city: user.city
      },
      sleepTargetMinutes: user.sleepTargetMinutes
    });

    return res.status(200).json({
      message: 'تم تحديث إعدادات النوم بنجاح',
      sleep: schedule
    });

  } catch (error) {
    return res.status(500).json({ message: 'تعذر حساب وقت النوم', error: error.message });
  }
};

module.exports = {
  getSleep,
  updateSleep
};