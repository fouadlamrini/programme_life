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
const { toMinuteOfDay, toHHMM, toInterval, intervalsOverlap } = require('../utils/time');

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

  // موعد الجمعة يستعمل نفس وقت الظهر — فلا يُنشأ إلا فقرة واحدة لنفس المفتاح (الأطول)
  const handledKeys = new Set();

  for (const activity of prayerActivities) {
    // التحقق من تكرار أيام الأسبوع
    if (!Array.isArray(activity.repeatDays) || !activity.repeatDays.includes(weekday)) {
      continue;
    }

    const prayerKey = resolvePrayerKey(activity);
    if (!prayerKey || !times[prayerKey]) continue;
    if (handledKeys.has(prayerKey)) continue;
    handledKeys.add(prayerKey);

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

  // إزالة الفقرات القديمة الزائدة لنفس مفتاح الصلاة (فيوم الجمعة: الظهر + الجمعة سابقاً)
  const keyMaxEnd = {};
  const blockInfos = [];
  for (const block of schedule.timeBlocks) {
    if (!block.activityId) continue;
    const act = prayerActivities.find((a) => String(a._id) === String(block.activityId));
    if (!act) continue;
    const key = resolvePrayerKey(act);
    if (!key) continue;
    const endMinute = toMinuteOfDay(block.endTime);
    blockInfos.push({ id: String(block._id), key, endMinute });
    if (!keyMaxEnd[key] || endMinute > keyMaxEnd[key]) keyMaxEnd[key] = endMinute;
  }
  for (const info of blockInfos) {
    if (info.endMinute < keyMaxEnd[info.key]) {
      schedule.timeBlocks.pull(info.id);
      changed = true;
    }
  }

  if (changed) {
    await schedule.save();
  }

  return schedule;
};

// ==========================================
// تحديد النشاط "التلقائي المثبّت بعد الصلاة"
// ==========================================
// أذكار الصباح → بعد الفجر | أذكار المساء → بعد العصر | القرآن → بعد كل صلاة | سورة الكهف → الجمعة بعد أذكار الصباح
// تُعرَّف بالعنوان الافتراضي المعروف (مثل الصلوات): لا حقل جديد في Activity.
// تُرجع نوع المِرساة أو null.
const isAutoGeneratedActivity = (activity) => {
  if (!activity) return null;
  const title = String(activity.title || '').trim().toLowerCase();
  if (activity.type === 'ADHKAR' && (title.includes('الصباح') || title.includes('صباح'))) return 'MORNING_ADHKAR';
  if (activity.type === 'ADHKAR' && (title.includes('المساء') || title.includes('مساء'))) return 'EVENING_ADHKAR';
  if (activity.type === 'QURAN' && title.includes('قراءة القرآن')) return 'QURAN';
  if (activity.type === 'QURAN' && (title.includes('الكهف') || title.includes('كهف'))) return 'SURAH_AL_KAHF';
  return null;
};

// الأنشطة المثبّتة تلقائياً بعد الصلوات (ترتيب الأسبقية في كتلة الفجر/العصر)
const AUTO_CHAIN = {
  MORNING_ADHKAR: { anchor: 'fajr', keywords: ['الصباح', 'صباح'] },
  SURAH_AL_KAHF: { anchor: 'fajr', chainAfter: 'MORNING_ADHKAR', keywords: ['الكهف', 'كهف'] },
  EVENING_ADHKAR: { anchor: 'asr', keywords: ['المساء', 'مساء'] },
  QURAN: { anchor: 'EVERY', keywords: ['قراءة القرآن'] }
};

// ==========================================
// ضمان فقرات الأنشطة المرتبطة بالصلوات (أذكار/قرآن/كهف)
// ==========================================
// idempotent مثل ensurePrayerTimeBlocks:
//   - تُنشأ الفقرات بعد نهاية كل فقرة صلاة (أو بعد سابقتها في الكتلة: كهف ← بعد أذكار الصباح).
//   - HIGH/NON_NEGOTIABLE: تُنشأ حتى لو تداخلت مع النوم — النوم يُحسب لاحقاً ليتأخر بعدها.
//   - LOW/MEDIUM: تُتخطى إذا تداخلت مع النوم أو فقرة أخرى (لم يحدث أي خطأ).
//   - تصحيح الأوقات الخاطئة للفقرات القديمة.
// ==========================================
const ensurePrayerAnchoredBlocks = async ({ userId, programmeDate, schedule, ctx }) => {
  if (!schedule) return null;

  const allActivities = await Activity.find({ userId });
  if (allActivities.length === 0) return schedule;

  const weekday = weekdayNumber(programmeDate);
  const { fajrMinute, capacityMinutes, sleepInterval, location } = ctx;

  const [year, month, day] = programmeDate.split('-').map(Number);
  const times = await prayerTimeService.getPrayerTimes(new Date(year, month - 1, day), location);

  // 1. نهاية فقرة كل صلاة (الحد الأقصى لنشاطات الصلاة المطبقة — الجمعة تأخذ الصدارة)
  const anchorEnds = {};
  const addAnchor = (key, endMinute) => {
    if (!anchorEnds[key] || endMinute > anchorEnds[key]) anchorEnds[key] = endMinute;
  };
  for (const activity of allActivities) {
    if (!isSystemPrayerActivity(activity)) continue;
    if (!Array.isArray(activity.repeatDays) || !activity.repeatDays.includes(weekday)) continue;
    const key = resolvePrayerKey(activity);
    if (!key || !times[key]) continue;
    addAnchor(key, toMinuteOfDay(times[key]) + (activity.durationMinutes || 0));
  }

  // 2. الأنشطة التلقائية المطبقة في هذا اليوم
  const findAuto = (type, keywords) =>
    allActivities.find(
      (a) => a.type === type && keywords.some((kw) => String(a.title || '').includes(kw)) &&
        (!Array.isArray(a.repeatDays) || a.repeatDays.includes(weekday))
    ) || null;

  const morningAdhkar = findAuto('ADHKAR', AUTO_CHAIN.MORNING_ADHKAR.keywords);
  const kahf = findAuto('QURAN', AUTO_CHAIN.SURAH_AL_KAHF.keywords);
  const eveningAdhkar = findAuto('ADHKAR', AUTO_CHAIN.EVENING_ADHKAR.keywords);
  const quran = findAuto('QURAN', AUTO_CHAIN.QURAN.keywords);

  // 3. بناء المرشحين بالترتيب الزمني داخل اليوم
  const candidates = [];
  const chain = (autoType, activity, startMinute) => {
    if (!activity) return startMinute;
    candidates.push({ autoType, activity, startMinute, endMinute: startMinute + activity.durationMinutes });
    return startMinute + activity.durationMinutes;
  };

  // كتلة الفجر: الفجر → أذكار الصباح → [سورة الكهف الجمعة] → القرآن
  if (anchorEnds.fajr) {
    let cursor = anchorEnds.fajr;
    cursor = chain('MORNING_ADHKAR', morningAdhkar, cursor);
    cursor = chain('SURAH_AL_KAHF', kahf, cursor);
    chain('QURAN', quran, cursor);
  }
  // كل صلاة أخرى: بعدها القرآن مباشرة (مع أذكار المساء بعد العصر)
  if (anchorEnds.dhuhr) chain('QURAN', quran, anchorEnds.dhuhr);
  if (anchorEnds.asr) {
    let cursor = anchorEnds.asr;
    cursor = chain('EVENING_ADHKAR', eveningAdhkar, cursor);
    chain('QURAN', quran, cursor);
  }
  if (anchorEnds.maghrib) chain('QURAN', quran, anchorEnds.maghrib);
  if (anchorEnds.isha) chain('QURAN', quran, anchorEnds.isha);

  // 4. التطبيق: إضافة/تصحيح أو تخطي حسب التعارض
  let changed = false;

  for (const cand of candidates) {
    const startTime = toHHMM(cand.startMinute);
    const endTime = toHHMM(cand.endMinute);

    // حدود برنامج اليوم (الفجر → فجر الموالي)
    if (toMinuteOfDay(startTime) < fajrMinute) continue;
    if (cand.endMinute > capacityMinutes) continue;

    // فقرة تلقائية موجودة (QURAN متعدد: مطابقة بالتوقيت البادئ)
    const exists = (schedule.timeBlocks || []).find(
      (b) => b.autoGenerated === cand.autoType &&
        (cand.autoType === 'QURAN' ? b.startTime === startTime : true)
    );
    if (exists) {
      if (exists.startTime !== startTime || exists.endTime !== endTime || exists.activityId !== String(cand.activity._id)) {
        exists.startTime = startTime;
        exists.endTime = endTime;
        exists.title = cand.activity.title;
        exists.activityId = cand.activity._id;
        exists.priority = cand.activity.priority;
        changed = true;
      }
      continue;
    }

    const interval = toInterval(startTime, endTime, fajrMinute, capacityMinutes);

    // تعارض مع فقرة موجودة → تخطي
    const overlapsExisting = (schedule.timeBlocks || []).some((b) => {
      const bi = toInterval(b.startTime, b.endTime, fajrMinute, capacityMinutes);
      return intervalsOverlap(interval, bi);
    });
    if (overlapsExisting) continue;

    // النوم: HIGH/NON_NEGOTIABLE تتقدم عليه (يقصر النوم)، البقية تُتخطى
    const priority = cand.activity.priority;
    if (!['NON_NEGOTIABLE', 'HIGH'].includes(priority)) {
      if (intervalsOverlap(interval, sleepInterval)) continue;
    }

    schedule.timeBlocks.push({
      activityId: cand.activity._id,
      title: cand.activity.title,
      startTime,
      endTime,
      priority,
      status: 'PENDING',
      autoGenerated: cand.autoType
    });
    changed = true;
  }

  if (changed) await schedule.save();

  return schedule;
};

module.exports = {
  isSystemPrayerActivity,
  resolvePrayerKey,
  resolvePrayerTime,
  ensurePrayerTimeBlocks,
  ensurePrayerAnchoredBlocks,
  isAutoGeneratedActivity,
  AUTO_CHAIN,
  PRAYER_KEY_MAP
};
