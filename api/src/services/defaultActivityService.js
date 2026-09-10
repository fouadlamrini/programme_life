const Activity = require('../models/Activity');
const User = require('../models/user');

// ==========================================
// DEFAULT ACTIVITIES SERVICE
// ==========================================

const ALL_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];
const FRIDAY = [5];
const NON_NEGOTIABLE = 'NON_NEGOTIABLE';
const HIGH = 'HIGH';
const MEDIUM = 'MEDIUM';
const AT_PRAYER_TIME = 'AT_PRAYER_TIME';
const POST_FAJR = 'POST_FAJR';
const POST_MAGHRIB = 'POST_MAGHRIB';
const BEFORE_SLEEP = 'BEFORE_SLEEP';
const ANYTIME = 'ANYTIME';

// الأنشطة الافتراضية لي كيتزادو لـ كل مستخدم جديد في أول تسجيل
const defaultActivityList = [
  { title: 'صلاة الفجر', type: 'PRAYER', durationMinutes: 10, preferredTimeSlot: AT_PRAYER_TIME, priority: NON_NEGOTIABLE, repeatDays: ALL_WEEKDAYS },
  { title: 'صلاة الظهر', type: 'PRAYER', durationMinutes: 10, preferredTimeSlot: AT_PRAYER_TIME, priority: NON_NEGOTIABLE, repeatDays: ALL_WEEKDAYS },
  { title: 'صلاة العصر', type: 'PRAYER', durationMinutes: 10, preferredTimeSlot: AT_PRAYER_TIME, priority: NON_NEGOTIABLE, repeatDays: ALL_WEEKDAYS },
  { title: 'صلاة المغرب', type: 'PRAYER', durationMinutes: 10, preferredTimeSlot: AT_PRAYER_TIME, priority: NON_NEGOTIABLE, repeatDays: ALL_WEEKDAYS },
  { title: 'صلاة العشاء', type: 'PRAYER', durationMinutes: 10, preferredTimeSlot: AT_PRAYER_TIME, priority: NON_NEGOTIABLE, repeatDays: ALL_WEEKDAYS },
  { title: 'قراءة القرآن', type: 'QURAN', durationMinutes: 30, preferredTimeSlot: POST_FAJR, priority: HIGH, repeatDays: ALL_WEEKDAYS },
  { title: 'أذكار الصباح', type: 'ADHKAR', durationMinutes: 15, preferredTimeSlot: POST_FAJR, priority: HIGH, repeatDays: ALL_WEEKDAYS },
  { title: 'أذكار المساء', type: 'ADHKAR', durationMinutes: 15, preferredTimeSlot: POST_MAGHRIB, priority: HIGH, repeatDays: ALL_WEEKDAYS },
  { title: 'الدعاء', type: 'DUA', durationMinutes: 10, preferredTimeSlot: BEFORE_SLEEP, priority: HIGH, repeatDays: ALL_WEEKDAYS },
  { title: 'صلاة الجمعة', type: 'PRAYER', durationMinutes: 30, preferredTimeSlot: AT_PRAYER_TIME, priority: NON_NEGOTIABLE, repeatDays: FRIDAY },
  { title: 'سورة الكهف', type: 'QURAN', durationMinutes: 30, preferredTimeSlot: ANYTIME, priority: HIGH, repeatDays: FRIDAY },
  { title: 'النوم', type: 'SLEEP', durationMinutes: 480, preferredTimeSlot: BEFORE_SLEEP, priority: NON_NEGOTIABLE, repeatDays: ALL_WEEKDAYS },
  { title: 'الفطور', type: 'MEAL', durationMinutes: 30, preferredTimeSlot: ANYTIME, priority: NON_NEGOTIABLE, repeatDays: ALL_WEEKDAYS },
  { title: 'الغداء', type: 'MEAL', durationMinutes: 30, preferredTimeSlot: ANYTIME, priority: NON_NEGOTIABLE, repeatDays: ALL_WEEKDAYS },
  { title: 'العشاء', type: 'MEAL', durationMinutes: 30, preferredTimeSlot: ANYTIME, priority: NON_NEGOTIABLE, repeatDays: ALL_WEEKDAYS }
];

// خلق الأنشطة الافتراضية ديال المستخدم (آمن ضد التكرار)
const createDefaultActivities = async (userId) => {
  const existingCount = await Activity.countDocuments({ userId });
  if (existingCount > 0) {
    return { created: 0, skipped: true };
  }

  const activities = defaultActivityList.map((activity) => ({
    ...activity,
    userId
  }));

  const created = await Activity.insertMany(activities);

  // علم الـ onboarding كـ مكمل
  await User.updateOne({ _id: userId }, { onboardingCompleted: true });

  return { created: created.length, skipped: false };
};

module.exports = {
  createDefaultActivities,
  defaultActivityList
};