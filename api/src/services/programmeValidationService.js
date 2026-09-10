// ==========================================
// PROGRAMME VALIDATION SERVICE
// ==========================================
// يُتحقق مما إذا كان برنامج يوم محدد (Programme Day) ممكناً:
//
//   1. المدة النظرية (Anشطة + نوم) لا تتجاوز سعة برنامج اليوم (فجر → فجر الموالي).
//   2. الأنشطة المجدولة (TimeBlocks فعليون) لا تتداخل مع فترة النوم.
//   3. الأنشطة المجدولة لا تتداخل فيما بينها.
//
// ملاحظة هامة (المعمارية):
//   Activity   = WHAT  → يُستعمل لتجميع المدة النظرية (قدرة 24 ساعة).
//   TimeBlock  = WHEN  → يُستعمل لفحص التداخلات الفعلية.
//
// النتائج تُحسب ديناميكياً ولا تُخزن في قاعدة البيانات.
// ==========================================

const prayerTimeService = require('./prayerTimeService');
const programmeDayService = require('./programmeDayService');
const sleepService = require('./sleepService');
const Activity = require('../models/Activity');
const DailySchedule = require('../models/DailySchedule');

// تحويل "HH:MM" إلى دقائق من اليوم
const toMinuteOfDay = (hhmm) => {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
};

// ترقيم الأسبوع : 1 = الاثنين ... 7 = الأحد (نفس تعريف repeatDays)
const weekdayNumber = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const jsDay = new Date(year, month - 1, day).getDay(); // 0=الأحد ... 6=السبت
  return ((jsDay + 6) % 7) + 1;
};

// تاريخ مفتاح محلي: "YYYY-MM-DD" → بداية اليوم المحلية
const startOfLocalDay = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// إضافة أيام على مفتاح تاريخ
const addDaysKey = (dateKey, days) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// تحويل توقيت "HH:MM" إلى دقائق نسبية من بداية برنامج اليوم (فجر).
// مرة واحدة من [00:00-23:59] قرب منتصف الليل (قبل الفجر) تُنسب لصباح اليوم الموالي.
const toRelativeMinutes = (hhmm, fajrMinute) => {
  const minutes = toMinuteOfDay(hhmm);
  return ((minutes - fajrMinute) % 1440 + 1440) % 1440;
};

// تداخل نطاقين [start, end) — نقطة الالتقاء تماماً لا تُعد تداخلاً
const intervalsOverlap = (a, b) => a.start < b.end && b.start < a.end;

// ==========================================
// التحقق من برنامج يوم محدد
// ==========================================
// user          : وثيقة/كائن المستخدم (يجب أن يحتوي _id, country, city, sleepTargetMinutes)
// programmeDate : "YYYY-MM-DD" تاريخ بداية برنامج اليوم (فجر)
// ==========================================
const validateProgrammeDay = async ({ user, programmeDate }) => {
  const location = { country: user.country, city: user.city };
  const sleepTargetMinutes = user.sleepTargetMinutes != null ? user.sleepTargetMinutes : 480;

  // 1. برنامج اليوم: الفجر(programmeDate) → فجر اليوم الموالي
  const fajrTimes = await prayerTimeService.getPrayerTimes(
    startOfLocalDay(programmeDate),
    location
  );
  const fajr = fajrTimes.fajr;

  const programmeDay = await programmeDayService.getCurrentProgrammeDay({
    now: new Date(`${programmeDate}T${fajr}`),
    location
  });

  const capacityMinutes = Math.round(
    (new Date(programmeDay.end).getTime() - new Date(programmeDay.start).getTime()) / 60000
  );

  // 2. فترة النوم المرتبطة بهذا البرنامج اليوم (الاستيقاظ عند فجر اليوم الموالي)
  const nextDayFajr = new Date(`${addDaysKey(programmeDate, 1)}T${fajr}`);
  const sleep = await sleepService.getSleepSchedule({
    now: nextDayFajr,
    location,
    sleepTargetMinutes
  });

  // النوم ينتهي عند نهاية سعة البرنامج اليوم (فجر الموالي) — تُحسب بالنِسب المطلقة لتجنب لبس اعبر منتصف الليل
  const sleepInterval = {
    start: capacityMinutes - sleep.sleepDurationMinutes,
    end: capacityMinutes
  };

  // 3. الأنشطة المطبقة في ذلك اليوم فقط (repeatDays يتضمن يوم الأسبوع لبرنامج اليوم)
  const weekday = weekdayNumber(programmeDate);

  const allActivities = await Activity.find({ userId: user._id });
  const applicableActivities = allActivities.filter((activity) =>
    Array.isArray(activity.repeatDays) && activity.repeatDays.includes(weekday)
  );
  const activityMinutes = applicableActivities.reduce(
    (sum, activity) => sum + (activity.durationMinutes || 0),
    0
  );

  const totalMinutes = activityMinutes + sleep.sleepDurationMinutes;
  const remainingMinutes = capacityMinutes - totalMinutes;

  const violations = [];

  // 4. قدرة 24 ساعة (المدة النظرية للأنشطة + الحاجة إلى النوم)
  if (totalMinutes > capacityMinutes) {
    violations.push({
      type: 'TOTAL_TIME_EXCEEDED',
      excessMinutes: totalMinutes - capacityMinutes,
      message: `المدة الإجمالية المجدولة تتجاوز سعة برنامج اليوم ب${totalMinutes - capacityMinutes} دقيقة.`
    });
  }

  // 5. الجدولة الفعلية إن وجدت (TimeBlocks)
  const schedules = await DailySchedule.find({
    userId: user._id,
    date: {
      $gte: startOfLocalDay(programmeDate),
      $lt: startOfLocalDay(addDaysKey(programmeDate, 1))
    }
  });
  const schedule = schedules[0] || null;

  if (schedule && Array.isArray(schedule.timeBlocks) && schedule.timeBlocks.length > 0) {
    const fajrMinute = toMinuteOfDay(fajr);

    const blocks = schedule.timeBlocks.map((block) => ({
      id: block._id ? String(block._id) : null,
      activityId: block.activityId ? String(block.activityId) : null,
      title: block.title,
      start: toRelativeMinutes(block.startTime, fajrMinute),
      end: toRelativeMinutes(block.endTime, fajrMinute)
    }));

    // 5.1 الأنشطة المجدولة يجب ألا تشغل فترة النوم
    for (const block of blocks) {
      if (intervalsOverlap(block, sleepInterval)) {
        violations.push({
          type: 'SLEEP_CONFLICT',
          title: block.title,
          startTime: block.start,
          endTime: block.end,
          message: `-${block.title}- يتعارض مع فترة النوم.`
        });
      }
    }

    // 5.2 الأنشطة المجدولة يجب ألا تتداخل فيما بينها
    for (let i = 0; i < blocks.length; i += 1) {
      for (let j = i + 1; j < blocks.length; j += 1) {
        if (intervalsOverlap(blocks[i], blocks[j])) {
          violations.push({
            type: 'ACTIVITY_OVERLAP',
            activities: [blocks[i].title, blocks[j].title],
            message: `-${blocks[i].title}- و -${blocks[j].title}- يتعارضان في التوقيت.`
          });
        }
      }
    }
  }

  return {
    valid: violations.length === 0,
    programmeDate,
    scheduleExists: Boolean(schedule),
    programmeDay: {
      start: programmeDay.start,
      end: programmeDay.end,
      fajr
    },
    summary: {
      activityMinutes,
      sleepMinutes: sleep.sleepDurationMinutes,
      totalMinutes,
      capacityMinutes,
      remainingMinutes
    },
    violations
  };
};

module.exports = {
  validateProgrammeDay,
  weekdayNumber,
  toRelativeMinutes,
  intervalsOverlap
};