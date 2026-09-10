// ==========================================
// PROGRAMME DAY SERVICE
// ==========================================
// مفهوم "برنامج اليوم": يبدأ عند الفجر وينتهي عند فجر اليوم الموالي.
//
//   Programme Day September 10 = Fajr Sep 10 → Fajr Sep 11
//
// التحديد يعتمد على:
//   current time + orقات الصلاة اليوم + موقع المستخدم
// لا يتم تخزين "برنامج اليوم" في قاعدة البيانات — بل يُحسب دائماً.
// ==========================================

const prayerTimeService = require('./prayerTimeService');

// تحويل التاريخ إلى مفتاح "YYYY-MM-DD" بالتوقيت المحلي
const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// صيغة محلية بدون منطقة زمنية: "YYYY-MM-DDTHH:mm:00"
const toLocalIso = (date) => {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${toDateKey(date)}T${hh}:${mm}:00`;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

// بناء Date من مفتاح يوم + توقيت "HH:MM" (توقيت محلي)
const atLocalTime = (dateKey, hhmm) => new Date(`${dateKey}T${hhmm}`);

const getCurrentProgrammeDayCore = async ({ now, location }) => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayKey = toDateKey(today);
  const yesterday = addDays(today, -1);
  const yesterdayKey = toDateKey(yesterday);
  const tomorrow = addDays(today, 1);

  const [todayTimes, yesterdayTimes, tomorrowTimes] = await Promise.all([
    prayerTimeService.getPrayerTimes(today, location),
    prayerTimeService.getPrayerTimes(yesterday, location),
    prayerTimeService.getPrayerTimes(tomorrow, location)
  ]);

  const todayFajr = atLocalTime(todayKey, todayTimes.fajr);
  const isAfterFajr = now >= todayFajr;

  let programmeDate;
  let start;
  let end;
  let prayerTimes;

  if (isAfterFajr) {
    // الوقت داخل "برنامج اليوم" الحالي: [فجر اليوم، فجر الغد)
    programmeDate = today;
    start = todayFajr;
    end = atLocalTime(toDateKey(tomorrow), tomorrowTimes.fajr);
    prayerTimes = todayTimes;
  } else {
    // وقت قبل فجر اليوم = ما زال داخل "برنامج اليوم" الفارط: [فجر أمس، فجر اليوم)
    programmeDate = yesterday;
    start = atLocalTime(yesterdayKey, yesterdayTimes.fajr);
    end = todayFajr;
    prayerTimes = yesterdayTimes;
  }

  return {
    programmeDate: toDateKey(programmeDate),
    start: toLocalIso(start),
    end: toLocalIso(end),
    isAfterFajr,
    prayerTimes
  };
};

// الحصول على "برنامج اليوم" الحالي للمستخدم
const getCurrentProgrammeDay = async ({ now = new Date(), location = {} } = {}) => {
  return getCurrentProgrammeDayCore({ now, location });
};

// المساعد لعمليات DailySchedule لاحقاً: يعيد تاريخ "برنامج اليوم" (YYYY-MM-DD)
// مثال: على الساعة 04:30 مع فجر 05:20 يرجع تاريخ الأمس (لأن الفجر لم يطل).
const getProgrammeDate = async ({ now = new Date(), location = {} } = {}) => {
  const result = await getCurrentProgrammeDayCore({ now, location });
  return result.programmeDate;
};

module.exports = {
  getCurrentProgrammeDay,
  getProgrammeDate,
  toDateKey
};