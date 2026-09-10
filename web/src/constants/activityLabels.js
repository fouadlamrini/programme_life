export const DAY_LABELS = {
  1: 'الاثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
  7: 'الأحد',
}

export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 7]

export const TYPE_LABELS = {
  PRAYER: 'صلاة',
  QURAN: 'قرآن',
  ADHKAR: 'أذكار',
  DUA: 'دعاء',
  SLEEP: 'نوم',
  MEAL: 'وجبة',
  STUDY: 'دراسة',
  WORK: 'عمل',
  SPORT: 'رياضة',
  CHESS: 'شطرنج',
  PERSONAL: 'شخصي',
  OTHER: 'أخرى',
}

export const TIME_SLOT_LABELS = {
  AT_PRAYER_TIME: 'في وقت الصلاة',
  POST_FAJR: 'بعد الفجر',
  POST_DHUHR: 'بعد الظهر',
  POST_ASR: 'بعد العصر',
  POST_MAGHRIB: 'بعد المغرب',
  POST_ISHA: 'بعد العشاء',
  BEFORE_SLEEP: 'قبل النوم',
  ANYTIME: 'في أي وقت',
}

export const PRIORITY_LABELS = {
  NON_NEGOTIABLE: 'غير قابل للتفاوض',
  HIGH: 'عالي',
  MEDIUM: 'متوسط',
  LOW: 'منخفض',
}

export const PRIORITY_COLORS = {
  NON_NEGOTIABLE: 'bg-[#fbe5dc] text-[#a44e20]',
  HIGH: 'bg-[#f7e4b4] text-[#9a6512]',
  MEDIUM: 'bg-[#e8eef4] text-[#3d5a80]',
  LOW: 'bg-[#e3e8e4] text-[#68776b]',
  OTHER: 'bg-[#e3e8e4] text-[#68776b]',
}

export const formatRepeatDays = (repeatDays) => {
  if (!repeatDays || repeatDays.length === 0) return 'بدون تكرار'
  if (repeatDays.length === 7) return 'يومياً'
  return repeatDays.map((day) => DAY_LABELS[day] || day).join('، ')
}