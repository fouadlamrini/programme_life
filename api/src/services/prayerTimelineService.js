// ==========================================
// PRAYER TIME BASED TIMELINE SERVICE
// ==========================================
// Timeline ديناميكية لأحد برامج اليوم تعتمد على أوقات الصلاة الخمسة:
//
//   Fajr → POST_FAJR → Dhuhr → POST_DHUHR → Asr → POST_ASR
//        → Maghrib → POST_MAGHRIB → Isha → POST_ISHA → Fajr الموالي
//
// الخدمة تجمع:
//   ProgrammeDayService (الفجر ← فجر الموالي)
//   PrayerTimeService   (أوقات الصلاة الخمسة — مصدر الحقيقة الوحيد)
//   SleepService        (حدود النوم المحسوبة — لا تُخزن في قاعدة البيانات)
//
// فقط بنية timeline منطقية — ممنوع قرينة أي نشاط (Automatic Scheduler ليس هذا).
//
// النشاطات القادمة (Feature 7) ستستعمل:
//   AT_PRAYER_TIME → حرز الصلاة
//   POST_*         → المناطق بين الصلوات
//   BEFORE_SLEEP   → الفترة قبل بداية النوم
//   ANYTIME        → كل سعة برنامج اليوم
// ==========================================

const prayerTimeService = require('./prayerTimeService');
const programmeDayService = require('./programmeDayService');
const sleepService = require('./sleepService');

// ترتيب الصلوات الثابت واسم المنطقة المرتبطة بكل صلاة
const PRAYER_ORDER = [
  { name: 'FAJR', key: 'fajr', zone: 'POST_FAJR' },
  { name: 'DHUHR', key: 'dhuhr', zone: 'POST_DHUHR' },
  { name: 'ASR', key: 'asr', zone: 'POST_ASR' },
  { name: 'MAGHRIB', key: 'maghrib', zone: 'POST_MAGHRIB' },
  { name: 'ISHA', key: 'isha', zone: 'POST_ISHA' }
];

const toMinuteOfDay = (hhmm) => {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
};

const hhmmOfIso = (iso) => (iso && iso.includes('T') ? iso.split('T')[1].slice(0, 5) : null);

// ==========================================
// BUILDER timeline لبرنامج يوم محدد
// ==========================================
// user          : كائن المستخدم (userId/isObjectId مطلوب + country, city, sleepTargetMinutes)
// programmeDate : "YYYY-MM-DD" تاريخ بداية برنامج اليوم (فجر)
// ==========================================
const getPrayerTimeline = async ({ user, programmeDate }) => {
  const userId = user?._id || user?.userId;
  if (!userId) {
    throw new Error('معرّف المستخدم مطلوب لبناء الـ timeline');
  }
  const location = { country: user.country, city: user.city };
  const sleepTargetMinutes = user.sleepTargetMinutes != null ? user.sleepTargetMinutes : 480;

  const [year, month, day] = programmeDate.split('-').map(Number);
  const startDate = new Date(year, month - 1, day);

  // 1. أوقات الصلاة الخمسة لنفس تاريخ بداية برنامج اليوم (مصدر الحقيقة).
  const times = await prayerTimeService.getPrayerTimes(startDate, location);
  for (const prayer of PRAYER_ORDER) {
    if (!times[prayer.key] || !/^\d{2}:\d{2}$/.test(times[prayer.key])) {
      throw new Error(`وقت صلاة ${prayer.name} غير متوفر`);
    }
  }

  const fajrClock = times.fajr;

  // 2. برنامج اليوم: الفجر(programmeDate) → فجر اليوم الموالي.
  // نستعمل خدمة برنامج اليوم (مصدر الحقيقة للحدود) — لا نكرر منطق قبل/بعد الفجر.
  const programmeDay = await programmeDayService.getCurrentProgrammeDay({
    now: new Date(`${programmeDate}T${fajrClock}`),
    location
  });

  const capacityMinutes = Math.round(
    (new Date(programmeDay.end).getTime() - new Date(programmeDay.start).getTime()) / 60000
  );

  const endClock = hhmmOfIso(programmeDay.end);

  const fajrStartMinute = toMinuteOfDay(fajrClock);

  // فحص داخلي: ترتيب الصلوات وتواجدها داخل برنامج اليوم (قبل المعالجة).
  const clockMinutes = PRAYER_ORDER.map((prayer) => toMinuteOfDay(times[prayer.key]));
  for (let i = 1; i < clockMinutes.length; i += 1) {
    if (clockMinutes[i] <= clockMinutes[i - 1]) {
      throw new Error('ترتيب أوقات الصلاة غير صحيح');
    }
  }

  const relative = {};
  for (const prayer of PRAYER_ORDER) {
    relative[prayer.key] = ((toMinuteOfDay(times[prayer.key]) - fajrStartMinute) % 1440 + 1440) % 1440;
    if (relative[prayer.key] < 0 || relative[prayer.key] >= capacityMinutes) {
      throw new Error(`وقت صلاة ${prayer.name} خارج سعة برنامج اليوم`);
    }
  }

  // 3. النوم المرتبط بحد نهاية برنامج اليوم (الاستيقاظ عند فجر اليوم الموالي).
  //    نمرر userId حتى تعرف SleepService: مدة صلاة العشاء + الأنشطة المٌلزمة المجدولة (TimeBlocks) بعد العشاء.
  //    نستدعيها بنفس تاريخ برنامج اليوم (بداية الفجر) ليكون سياق العشاء والأنشطة متطابقاً مع هذا البرنامج اليوم.
  const sleep = await sleepService.getSleepSchedule({
    userId,
    now: new Date(`${programmeDate}T${fajrClock}`),
    location,
    sleepTargetMinutes
  });

  const sleepDuration = sleep.sleepDurationMinutes;
  const sleepStartRel = sleep.sleepStartRel;
  const sleepEndRel = sleep.sleepEndRel;
  if (sleepDuration <= 0 || sleepStartRel < 0 || sleepStartRel > sleepEndRel) {
    throw new Error('فترة النوم المحسوبة غير صالحة');
  }

  // 4. مراسي الصلوات الخمسة.
  const prayers = PRAYER_ORDER.map((prayer) => ({
    name: prayer.name,
    time: times[prayer.key]
  }));

  // 5. المناطق الخمسة بين الصلوات (تنسيق نسبي لدقة المدة، عرض "HH:MM").
  const zones = [];
  for (let i = 0; i < PRAYER_ORDER.length; i += 1) {
    const prayer = PRAYER_ORDER[i];
    const isLast = i === PRAYER_ORDER.length - 1;
    const startClock = times[prayer.key];
    const endClockI = isLast ? endClock : times[PRAYER_ORDER[i + 1].key];
    const durationMinutes = isLast
      ? capacityMinutes - relative[prayer.key]
      : relative[PRAYER_ORDER[i + 1].key] - relative[prayer.key];

    if (durationMinutes <= 0) {
      throw new Error(`مدة منطقة ${prayer.zone} غير صالحة`);
    }

    zones.push({
      type: prayer.zone,
      start: startClock,
      end: endClockI,
      durationMinutes,
      overnight: isLast
    });
  }

  // 6. حدود النوم داخل timeline + فترة قبل النوم.
  //    قبل النوم = الفترة من نهاية آخر قيد إلزامي إلى بداية النوم الفعلية.
  const lastConstraint = sleep.constraints && sleep.constraints.length > 0
    ? sleep.constraints[sleep.constraints.length - 1]
    : null;
  const beforeSleepStart = lastConstraint ? lastConstraint.end : times.isha;
  const beforeSleepEndRel = lastConstraint ? lastConstraint.endRel : 0;
  const beforeSleepDuration = sleepStartRel - beforeSleepEndRel;
  const beforeSleep = beforeSleepDuration > 0
    ? {
        type: 'BEFORE_SLEEP',
        start: beforeSleepStart,
        end: sleep.sleepStart,
        durationMinutes: beforeSleepDuration,
        overnight: true
      }
    : null;

  return {
    programmeDate,
    programmeDay: {
      start: programmeDay.start,
      end: programmeDay.end,
      fajr: fajrClock
    },
    prayers,
    zones,
    beforeSleep,
    sleep: {
      targetMinutes: sleep.sleepTargetMinutes,
      calculatedStart: sleep.calculatedSleepStart,
      start: sleep.sleepStart,
      end: sleep.sleepEnd,
      durationMinutes: sleepDuration,
      wakeUpTime: sleep.wakeUpTime,
      achieved: sleep.achieved,
      overnight: sleep.overnight,
      constraints: (sleep.constraints || []).map((constraint) => ({
        type: constraint.type,
        title: constraint.title,
        start: constraint.start,
        end: constraint.end
      }))
    }
  };
};

module.exports = {
  getPrayerTimeline,
  PRAYER_ORDER,
  toMinuteOfDay
};