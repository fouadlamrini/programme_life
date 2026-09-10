// ==========================================
// PRAYER TIME PROVIDER (Placeholder)
// ==========================================
// هاد هو الـ Provider لي كيوفّر أوقات الصلاة الفعلية.
// حالياً placeholder مؤقت وقابل للتحديد: كيرجع أوقات تقديرية ثابتة
// مع تموج بسيط لصلاة الفجر باش يتوضح الـ Drift بين يوم ويوم.
// ملاحظة: كيتم تجاهل الـ location في هذه النسخة المؤقتة.
// Devrait être remplacé plus tard par un vrai provider (API aladhan...).
// ==========================================

const FAJR_BASE_MINUTES = 5 * 60 + 20; // 05:20
const DHUHR_MINUTES = 13 * 60 + 20; // 13:20
const ASR_MINUTES = 16 * 60 + 40; // 16:40
const MAGHRIB_MINUTES = 19 * 60 + 40; // 19:40
const ISHA_MINUTES = 20 * 60 + 55; // 20:55

const toHHMM = (minutesOfDay) => {
  const hh = String(Math.floor(minutesOfDay / 60)).padStart(2, '0');
  const mm = String(minutesOfDay % 60).padStart(2, '0');
  return `${hh}:${mm}`;
};

// تموج يومي بسيط ±3 دقائق حسب ترتيب اليوم في السنة (تحديدي، لا عشوائية)
const getFajrMinutes = (date) => {
  const dayIndex = Math.floor(date.getTime() / 86400000);
  const drift = Math.round(3 * Math.sin((dayIndex * 2 * Math.PI) / 365));
  return FAJR_BASE_MINUTES + drift;
};

const getPrayerTimes = async (date, location = {}) => {
  const d = date instanceof Date ? date : new Date(date);

  return {
    fajr: toHHMM(getFajrMinutes(d)),
    dhuhr: toHHMM(DHUHR_MINUTES),
    asr: toHHMM(ASR_MINUTES),
    maghrib: toHHMM(MAGHRIB_MINUTES),
    isha: toHHMM(ISHA_MINUTES)
  };
};

module.exports = {
  getPrayerTimes,
  getFajrMinutes
};