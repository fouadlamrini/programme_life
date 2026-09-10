// ==========================================
// PRAYER TIME SERVICE
// ==========================================
// الخدمة الوحيدة لي كيستعملها البرنامج للحصول على أوقات الصلاة.
// باقي الأجزاء (برنامج اليوم، الجدولة...) ما يعرفوش شي API أو حساب معين.
// ==========================================

const provider = require('./prayerTimeProvider');

// واجهة نظيفة: getPrayerTimes(date, location)
const getPrayerTimes = async (date, location) => {
  return provider.getPrayerTimes(date, location);
};

module.exports = {
  getPrayerTimes
};