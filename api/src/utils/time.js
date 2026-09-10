// ==========================================
// TIME UTILS
// ==========================================
// أدوات مشتركة للتحقق من صيغة التوقيت وحسابات الفترات داخل "برنامج اليوم".
// المعيار الوحيد: توقيت "HH:MM" (05:17، 13:20، 20:55، 23:30...).
// كل الفترات تُحسب بدقائق نسبية من فجر بداية برنامج اليوم (عبور منتصف الليل آمن).
// ==========================================

const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// التحقق من صيغة "HH:MM" الصارمة — رفض "5:17" و "25:00" و "13:70" و "abc"
const isValidHHMM = (value) => {
  if (typeof value !== 'string') return false;
  return HHMM_RE.test(value.trim());
};

// "HH:MM" → عدد دقائق من بداية اليوم (00:00 → 0 ... 23:59 → 1439)
const toMinuteOfDay = (hhmm) => {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
};

// عدد دقائق → "HH:MM" مع التوحيد في نطاق اليوم (قد يعبر منتصف الليل)
const toHHMM = (minutes) => {
  const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

// توقيت "HH:MM" → دقائق نسبة من بداية برنامج اليوم (الفجر).
// التوقيت الواقع قبل الفجر في نفس اليوم يُنسب لآخر برنامج اليوم السابق.
const toRelativeMinutes = (hhmm, fajrMinute) => {
  const minutes = toMinuteOfDay(hhmm);
  return ((minutes - fajrMinute) % 1440 + 1440) % 1440;
};

// ==========================================
// فاصل زمني معياري [start, end) داخل "برنامج اليوم"
// ==========================================
// التفسير الصحيح لعبور منتصف الليل:
//   إذا endTime <= startTime → endTime يُفهم على أنه اليوم (التقويمي) الموالي.
// مثال: 21:05 → 05:17 = [فجر+948 ، الفجر+1440] = 492 دقيقة (وليس -15h48).
const toInterval = (startTime, endTime, fajrMinute, capacityMinutes) => {
  const start = toRelativeMinutes(startTime, fajrMinute);
  let end = toRelativeMinutes(endTime, fajrMinute);

  // عبور نقطة الالتفاف النسبية: نهاية الليلة تُضاف إليها سعة برنامج اليوم
  if (end <= start) {
    end += capacityMinutes;
  }

  return { start, end };
};

// مدة الفترة بالدقائق
const intervalDuration = (interval) => interval.end - interval.start;

// تداخل نطاقين [start, end) — نقطة الالتقاء تماماً ليست تداخلاً
const intervalsOverlap = (a, b) => a.start < b.end && b.start < a.end;

// ==========================================
// تصنيف الخطأ
// ==========================================
const createHttpError = (status, message) => {
  const error = new Error(message);
  error.httpStatus = status;
  return error;
};

module.exports = {
  isValidHHMM,
  toMinuteOfDay,
  toHHMM,
  toRelativeMinutes,
  toInterval,
  intervalDuration,
  intervalsOverlap,
  createHttpError
};