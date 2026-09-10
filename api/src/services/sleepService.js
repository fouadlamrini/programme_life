// ==========================================
// SLEEP SERVICE
// ==========================================
// نظام النوم: لا يخزن المستخدم وقت استيقاظ ثابتاً، بل فقط "مدة النوم المطلوبة".
// كل الحسابات ديناميكية من أوقات الصلاة:
//
//   wakeUpTime = Fajr
//   sleepStart = Fajr - sleepTargetMinutes
//   sleepEnd   = Fajr
//
// مثال: Fajr = 05:20 و sleepTargetMinutes = 480 → النوم من 21:20 إلى 05:20.
// الحساب يعبر منتصف الليل بأمان (طرح دقائق مع تمثيل داخلي بالدقائق، وليس مقارنة نصوص).
// ==========================================

const prayerTimeService = require('./prayerTimeService');
const programmeDayService = require('./programmeDayService');

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

// الحساب الأساسي: فترة النوم من توقيت الفجر + مدة النوم المطلوبة
const calculateSleepPeriod = ({ fajr, sleepTargetMinutes }) => {
  const fajrMinute = toMinuteOfDay(fajr);
  // الطرح قد يعطي قيماً سالبة = النوم يبدأ قبل منتصف الليل من اليوم السابق
  const sleepStartMinute = fajrMinute - sleepTargetMinutes;

  return {
    sleepStart: toHHMM(sleepStartMinute),
    sleepEnd: fajr,
    wakeUpTime: fajr,
    sleepDurationMinutes: sleepTargetMinutes
  };
};

// خطة النوم المرتبطة بـ "برنامج اليوم" الحالي
// (لا تُخزن النتائج — تُحسب دائماً وقت الطلب)
const getSleepSchedule = async ({ now = new Date(), location = {}, sleepTargetMinutes }) => {
  const programmeDay = await programmeDayService.getCurrentProgrammeDay({ now, location });
  const fajr = programmeDay.prayerTimes.fajr;

  const period = calculateSleepPeriod({ fajr, sleepTargetMinutes });

  return {
    sleepTargetMinutes,
    sleepDurationMinutes: period.sleepDurationMinutes,
    sleepStart: period.sleepStart,
    sleepEnd: period.sleepEnd,
    wakeUpTime: period.wakeUpTime,
    fajr,
    programmeDate: programmeDay.programmeDate
  };
};

module.exports = {
  calculateSleepPeriod,
  getSleepSchedule,
  toMinuteOfDay,
  toHHMM
};