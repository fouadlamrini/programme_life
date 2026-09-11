// ==========================================
// DEFAULT TIME BLOCK SERVICE
// ==========================================
// يضمن أن فقرات الصلاة الخمسة (والجمعة) موجودة في كل جدولة يومية.
//
//   Activity (PRAYER + AT_PRAYER_TIME) → defines WHICH prayer
//   PrayerTimeService (date + location) → defines WHEN (HH:MM)
//
// القاعدة:
//   - ensurePrayerTimeBlocks(...) تتبع فقط أنشطة الصلاة الخمسة.
//   - الأنشطة الأخرى (QURAN, ADHKAR, MEAL...) لا تُنشأ تلقائياً — Feature 8+.
//   - معيارtheidempotent: التكرار لا يُنشئ فقرات مكررة.
//   - تصحيح الأوقات الخاطئة: إذا كانت الفقرة موجودة بأوقات غير مطابقة، تُصحح.
// ==========================================

const Activity = require('../models/Activity');
const prayerTimeService = require('./prayerTimeService');
const { toMinuteOfDay, toHHMM } = require('../utils/time');

// ترتيب الصلوات الخمسة (نفس المفهوم في prayerTimelineService.PRAYER_ORDER)
const PRAYER_KEY_MAP = [
  { keywords: ['الفجر', 'fajr'], key: 'fajr' },
  { keywords: ['الظهر', 'dhuhr'], key: 'dhuhr' },
  { keywords: ['العصر', 'asr'], key: 'asr' },
  { keywords: ['المغرب', 'maghrib'], key: 'maghrib' },
  { keywords: ['العشاء', 'isha'], key: 'isha' },
  { keywords: ['الجمعة', 'jumu', 'jumaa'], key: 'dhuhr' }
];

// ترقيم الأسبوع: 1=Mon ... 7=Sun (نفس repeatDays)
const weekdayNumber = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const jsDay = new Date(year, month - 1, day).getDay();
  return ((jsDay + 6) % 7) + 1;
};

// ==========================================
// تحديد ما إذا كان النشاط صلاة نظامية
// ==========================================
const isSystemPrayerActivity = (activity) => {
  if (!activity) return false;
  return activity.type === 'PRAYER' && activity.preferredTimeSlot === 'AT_PRAYER_TIME';
};

// ==========================================
// تحديد مفتاح الصلاة من عنوان النشاط
// ==========================================
const resolvePrayerKey = (activity) => {
  if (!activity) return null;
  const title = String(activity.title || '').trim().toLowerCase();
  for (const mapping of PRAYER_KEY_MAP) {
    if (mapping.keywords.some((kw) => title.includes(kw.toLowerCase()))) {
      return mapping.key;
    }
  }
  return null;
};

// ==========================================
// جلب وقت الصلاة الفعلي من PrayerTimeService
// ==========================================
const resolvePrayerTime = async (prayerKey, programmeDate, location) => {
  const [year, month, day] = programmeDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const times = await prayerTimeService.getPrayerTimes(date, location);
  return times[prayerKey] || null;
};

// ==========================================
// ضمان فقرات الصلاة في جدولة يومية موجودة
// ==========================================
// idempotent: لا يُنشئ فقرات مكررة. يصحح أوقات الفقرات الخاطئة.
// لا ينشئ DailySchedule — يتعامل فقط مع schedule موجودة.
// ==========================================
const ensurePrayerTimeBlocks = async ({ userId, programmeDate, schedule, location }) => {
  if (!schedule) return null;

  // 1. جلب أنشطة الصلاة للمستخدم
  const prayerActivities = await Activity.find({
    userId,
    type: 'PRAYER',
    preferredTimeSlot: 'AT_PRAYER_TIME'
  });

  if (prayerActivities.length === 0) return schedule;

  // 2. جلب أوقات الصلاة لهذا البرنامج اليوم
  const [year, month, day] = programmeDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const times = await prayerTimeService.getPrayerTimes(date, location);

  // 3. لكل نشاط صلاة: تحديد الوقت وإضافة/تصحيح الفقرة
  const weekday = weekdayNumber(programmeDate);
  let changed = false;

  for (const activity of prayerActivities) {
    // التحقق من تكرار أيام الأسبوع
    if (!Array.isArray(activity.repeatDays) || !activity.repeatDays.includes(weekday)) {
      continue;
    }

    const prayerKey = resolvePrayerKey(activity);
    if (!prayerKey || !times[prayerKey]) continue;

    const startTime = times[prayerKey];
    const endTime = toHHMM(toMinuteOfDay(startTime) + activity.durationMinutes);

    // البحث عن فقرة موجودة لنفس النشاط
    const existingBlock = schedule.timeBlocks.find(
      (b) => String(b.activityId) === String(activity._id)
    );

    if (existingBlock) {
      // تصحيح الأوقات الخاطئة (إذا كانت مختلفة عن الوقت الفعلي للصلاة)
      if (existingBlock.startTime !== startTime || existingBlock.endTime !== endTime) {
        existingBlock.startTime = startTime;
        existingBlock.endTime = endTime;
        changed = true;
      }
    } else {
      // إضافة فقرة جديدة
      schedule.timeBlocks.push({
        activityId: activity._id,
        title: activity.title,
        startTime,
        endTime,
        priority: activity.priority,
        status: 'PENDING'
      });
      changed = true;
    }
  }

  if (changed) {
    await schedule.save();
  }

  return schedule;
};

module.exports = {
  isSystemPrayerActivity,
  resolvePrayerKey,
  resolvePrayerTime,
  ensurePrayerTimeBlocks,
  PRAYER_KEY_MAP
};
