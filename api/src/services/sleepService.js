// ==========================================
// SLEEP SERVICE
// ==========================================
// نظام النوم: لا يخزن المستخدم وقت استيقاظ ثابتاً، بل فقط "مدة النوم المطلوبة".
// كل الحسابات ديناميكية من أوقات الصلاة:
//
//   wakeUpTime = Fajr
//   calculatedSleepStart = Fajr - sleepTargetMinutes   (نظري)
//
// لكن النوم الحقيقي لا يمكن أن يبدأ إلا بعد استكمال صلاة العشاء، وبعد كل
// نشاط إلزامي (NON_NEGOTIABLE) مجدول بقعة زمنية فعلية (TimeBlock) يقع بعد العشاء.
//
//   sleepStart = max(calculatedSleepStart, نهاية صلاة العشاء, نهاية الأنشطة الإلزامية بعد العشاء)
//   sleepDurationMinutes = المدة الفعلية القابلة للتحقيق (قد تكون أقل من الهدف)
//
// الهدف (sleepTargetMinutes) لا يتغير أبداً عند المستخدم — يُحسب فقط أقصى مدة
// ممكنة دون كسر القيود الإلزامية. الحدود النسبة (relative minutes) تجعل
// عبور منتصف الليل آمناً (لا مقارنة نصوص).
//
// لا تُخزن النتائج — تُحسب دائماً وقت الطلب. لا يوجد نموذج Sleep جديد.
// ==========================================

const Activity = require('../models/Activity');
const DailySchedule = require('../models/DailySchedule');
const prayerTimeService = require('./prayerTimeService');
const programmeDayService = require('./programmeDayService');

// مدة افتراضية لصلاة العشاء فقط إذا لم يُعثر على نشاط "صلاة العشاء" للمستخدم
const DEFAULT_ISHA_PRAYER_DURATION_MINUTES = 10;

// القيود الإلزامية التي يجب إنجازها قبل النوم تأتي من الأولوية الثنائية غير القابلة للتفاوض
const REQUIRED_PRIORITY = 'NON_NEGOTIABLE';

// تحويل "HH:MM" إلى عدد دقائق اليوم (00:00 → 0 ... 23:59 → 1439)
const toMinuteOfDay = (hhmm) => {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
};

// تحويل عدد الدقائق إلى "HH:MM" مع التوحيد في نطاق اليوم (عبور منتصف الليل آمن)
const toHHMM = (minutes) => {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

// توقيت "HH:MM" → دقائق نسبة من بداية برنامج اليوم (الفجر) — مرة واحدة من [00:00-23:59]
const toRelativeMinutes = (hhmm, fajrMinute) => {
  const minutes = toMinuteOfDay(hhmm);
  return ((minutes - fajrMinute) % 1440 + 1440) % 1440;
};

// ==========================================
// مساعدات محلية للتواريخ (بدون إنشاء نماذج جديدة)
// ==========================================
const startOfLocalDay = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const addDaysKey = (dateKey, days) => {
  const date = startOfLocalDay(dateKey);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ==========================================
// تحديد نشاط صلاة العشاء
// ==========================================
// ممنوع ربط النوم بعناوين عشوائية مثل "العشاء/Dinner/الأكل" (الوجبات تأتي من TimeBlocks فقط).
// أما نشاط الصلاة فلا يملك حقلاً مميزاً في المخطط — لذلك يتم التعرف على "صلاة العشاء"
// من قائمة أنشطة PRAYER + AT_PRAYER_TIME بمطابقة العنوان بشكل طبيعي.
// ملاحظة: العنوان المعروف في التهيئة الافتراضية هو "صلاة العشاء".
const normalizeTitle = (title) => String(title || '').trim().toLowerCase();

const isIshaPrayerTitle = (title) => {
  const normalized = normalizeTitle(title);
  return normalized.includes('العشاء') || normalized.includes('عشاء') || normalized.includes('isha');
};

const findIshaPrayer = (activities) =>
  (activities || []).find(
    (activity) =>
      activity.type === 'PRAYER' &&
      activity.preferredTimeSlot === 'AT_PRAYER_TIME' &&
      isIshaPrayerTitle(activity.title)
  ) || null;

// ==========================================
// الحساب الأساسي: فترة النوم الهدف/الفعلية + القيود
// ==========================================
// fajr            : "HH:MM" توقيت الاستيقاظ (فجر نهاية برنامج اليوم)
// capacityMinutes : سعة برنامج اليوم (فجر → فجر الموالي)
// sleepTargetMinutes : المدة المطلوبة (لا تتغير)
// boundaries      : [{ endRel, type, title, start, end }] بدايات لا يمكن النوم قبلها (نهاية العشاء، نهاية الأنشطة الإلزامية)
const calculateSleepPeriod = ({ fajr, capacityMinutes, sleepTargetMinutes, boundaries = [] }) => {
  const fajrMinute = toMinuteOfDay(fajr);

  // الموضع النظري: الفجر - الهدف (قد يعبر منتصف الليل → دورة معيارية)
  const calculatedStartRel = Math.max(0, capacityMinutes - sleepTargetMinutes);

  // أقصى قيد إلزامي: نهاية آخر نشاط يجب إنجازه قبل النوم
  const limitRel = boundaries.reduce((max, boundary) => Math.max(max, boundary.endRel), 0);

  // الموضع الفعلي: لا قبل الهدف ولا قبل أي قيد إلزامي
  const sleepStartRel = Math.min(capacityMinutes, Math.max(calculatedStartRel, limitRel));

  // المدة الفعلية القابلة للتحقيق (قد تكون أقل من الهدف)
  const sleepDurationMinutes = Math.max(0, capacityMinutes - sleepStartRel);

  return {
    sleepTargetMinutes,
    capacityMinutes,
    calculatedSleepStartRel: calculatedStartRel,
    // توقيت النظري بالصيغة "Fajr - target" (تعريف المشروع)
    calculatedSleepStart: toHHMM(fajrMinute - sleepTargetMinutes),
    sleepStartRel,
    sleepEndRel: capacityMinutes,
    // توقيت فعلي محسوب بالنسب المطلقة (آمن مع منتصف الليل)
    sleepStart: toHHMM(fajrMinute + sleepStartRel),
    sleepEnd: fajr,
    wakeUpTime: fajr,
    sleepDurationMinutes,
    achieved: Math.abs(sleepDurationMinutes - sleepTargetMinutes) < 1,
    overnight: sleepStartRel < capacityMinutes
  };
};

// ==========================================
// خطة النوم المرتبطة بـ "برنامج اليوم" الحالي
// ==========================================
// لا تُخزن النتائج — تُحسب دائماً وقت الطلب.
// userId مطلوب لقراءة: نشاط صلاة العشاء + الأنشطة المجدولة (TimeBlocks) لذلك اليوم.
// ==========================================
const getSleepSchedule = async ({ userId, now = new Date(), location = {}, sleepTargetMinutes }) => {
  const programmeDay = await programmeDayService.getCurrentProgrammeDay({ now, location });
  const programmeDate = programmeDay.programmeDate;
  const prayerTimes = programmeDay.prayerTimes;
  const fajr = prayerTimes.fajr;
  const fajrMinute = toMinuteOfDay(fajr);

  const capacityMinutes = Math.round(
    (new Date(programmeDay.end).getTime() - new Date(programmeDay.start).getTime()) / 60000
  );

  if (!capacityMinutes || capacityMinutes <= 0) {
    throw new Error('سعة برنامج اليوم غير صالحة');
  }

  // 1. صلاة العشاء: وقت بدايتها + مدتها (من نشاط المستخدم) تحددان حد "بعد العشاء".
  let ishaDuration = DEFAULT_ISHA_PRAYER_DURATION_MINUTES;
  let ishaTitle = 'صلاة العشاء';
  if (userId) {
    const activities = await Activity.find({ userId });
    const ishaActivity = findIshaPrayer(activities);
    if (ishaActivity) {
      ishaDuration = ishaActivity.durationMinutes || DEFAULT_ISHA_PRAYER_DURATION_MINUTES;
      ishaTitle = ishaActivity.title;
    }
  }

  const ishaRel = toRelativeMinutes(prayerTimes.isha, fajrMinute);
  const ishaEndRel = Math.min(capacityMinutes, ishaRel + ishaDuration);

  const boundaries = [
    {
      type: 'ISHA_PRAYER',
      title: ishaTitle,
      start: prayerTimes.isha,
      end: toHHMM(toMinuteOfDay(prayerTimes.isha) + ishaDuration),
      endRel: ishaEndRel
    }
  ];

  // 2. الأنشطة الإلزامية المجدولة بقعة زمنية فعلية (TimeBlock) بعد العشاء.
  //    لا نأخذ أي أنشطة بدون وقت فعلي محدد — لا نُخترع وقتاً لنشاط.
  //    الوجبة لا تقيّد النوم إلا إذا كان وقتها المجدول يقع بعد العشاء.
  if (userId) {
    const schedules = await DailySchedule.find({
      userId,
      date: {
        $gte: startOfLocalDay(programmeDate),
        $lt: startOfLocalDay(addDaysKey(programmeDate, 1))
      }
    });
    const schedule = schedules[0] || null;

    if (schedule && Array.isArray(schedule.timeBlocks)) {
      for (const block of schedule.timeBlocks) {
        // نحترم فقط النشاطات الإلزامية (NON_NEGOTIABLE) — الواجب إنجازها قبل النوم
        if (block.priority !== REQUIRED_PRIORITY && block.priority !== 'HIGH') continue;

        const blockStartRel = toRelativeMinutes(block.startTime, fajrMinute);
        const blockEndRel = toRelativeMinutes(block.endTime, fajrMinute);
        // إذا انتهى النشاط قبل بداية العشاء فهو لا يؤخر النوم (لا يوجّه بعد العشاء)
        if (blockEndRel <= ishaRel) continue;

        boundaries.push({
          type: 'SCHEDULED_ACTIVITY',
          title: block.title,
          start: block.startTime,
          end: block.endTime,
          endRel: Math.min(capacityMinutes, blockEndRel)
        });
      }
    }
  }

  boundaries.sort((a, b) => a.endRel - b.endRel);

  const period = calculateSleepPeriod({ fajr, capacityMinutes, sleepTargetMinutes, boundaries });

  return {
    ...period,
    fajr,
    programmeDate,
    constraints: boundaries
  };
};

module.exports = {
  calculateSleepPeriod,
  getSleepSchedule,
  findIshaPrayer,
  toMinuteOfDay,
  toHHMM,
  toRelativeMinutes
};