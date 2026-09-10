// ==========================================
// TIME BLOCK SERVICE
// ==========================================
// إدارة الفقرات الزمنية الفعلية (TimeBlocks) المدمجة داخل DailySchedule.
//
//   TimeBlock (مضمّن)  →  DailySchedule  →  المستخدم + "برنامج اليوم" (فجر → فجر الموالي)
//
// القواعد:
//   - كل العمليات مرتبطة بـ req.userId (لا نثق في أي userId من الطلب).
//   - النشاط (Activity) يجب أن يملكه نفس المستخدم؛ العنوان والأولوية مشتقة من النشاط لا من الـ body.
//   - مدة الفقرة يجب أن تطابق مدة النشاط بالضبط.
//   - الفقرة يجب أن تبقى داخل "برنامج اليوم" (فجر الفقرة → فجر اليوم الموالي) — وليس 00:00→23:59.
//   - لا تداخل بين الفقرات: فترات نصف مفتوحة [start, end).
//   - عبور منتصف الليل معياري (21:05 → 05:17 = 8h12 وليس -15h48).
//   - فترة النوم المحمية (من SleepService عبر getDayContext) لا يجوز تخطيها.
// ==========================================

const Activity = require('../models/Activity');
const DailySchedule = require('../models/DailySchedule');
const programmeDayService = require('./programmeDayService');
const programmeValidationService = require('./programmeValidationService');
const {
  isValidHHMM,
  toMinuteOfDay,
  toInterval,
  intervalDuration,
  intervalsOverlap,
  createHttpError
} = require('../utils/time');

const REQUIRED_PRIORITY = 'NON_NEGOTIABLE';

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
// جلب DailySchedule للمستخدم ونفس اليوم (بدون إنشاء)
// ==========================================
const findSchedule = async (userId, programmeDate) => {
  const schedules = await DailySchedule.find({
    userId,
    date: {
      $gte: startOfLocalDay(programmeDate),
      $lt: startOfLocalDay(addDaysKey(programmeDate, 1))
    }
  });
  return schedules[0] || null;
};

// ==========================================
// إنشاء DailySchedule إن لم يوجد (بدون تكرار — فهرس فريد userId+date)
// ==========================================
const ensureSchedule = async (userId, programmeDate) => {
  let schedule = await findSchedule(userId, programmeDate);
  if (schedule) return schedule;

  try {
    schedule = await DailySchedule.create({
      userId,
      date: startOfLocalDay(programmeDate),
      mode: 'NORMAL',
      timeBlocks: []
    });
  } catch (error) {
    // سباق الإنشاء (فهرس فريد): إعادة القراءة عوض رمي خطأ مكرر
    if (error && error.code === 11000) {
      schedule = await findSchedule(userId, programmeDate);
      if (schedule) return schedule;
    }
    throw error;
  }

  return schedule;
};

// ==========================================
// الفاصل الزمني المعياري للفقرة + فحص حدود "برنامج اليوم"
// ==========================================
const buildInterval = ({ ctx, startTime, endTime }) => {
  const { fajrMinute, capacityMinutes } = ctx;

  // بداية الفقرة يجب أن تكون داخل برنامج اليوم (بعد فجر البداية)
  // التوقيت قبل الفجر في نفس اليوم التقويمي لا ينتمي لبرنامج اليوم هذا.
  if (toMinuteOfDay(startTime) < fajrMinute) {
    throw createHttpError(400, 'الفقرة تقع خارج حدود برنامج اليوم (قبل فجر بدايته)');
  }

  const interval = toInterval(startTime, endTime, fajrMinute, capacityMinutes);

  // نهاية الفقرة (بعد التطبيع مع عبور منتصف الليل) يجب ألا تتجاوز فجر اليوم الموالي
  if (interval.end > capacityMinutes) {
    throw createHttpError(400, 'الفقرة تقع خارج حدود برنامج اليوم (بعد فجر اليوم الموالي)');
  }

  return interval;
};

// ==========================================
// حل النشاط: ملكية + مدة (مصدر العنوان والأولوية)
// ==========================================
const resolveActivity = async (userId, activityId) => {
  if (!activityId) return null;

  const activity = await Activity.findOne({ _id: activityId, userId });
  if (!activity) {
    throw createHttpError(404, 'النشاط غير موجود أو لا يملكه هذا المستخدم');
  }
  return activity;
};

// ==========================================
// فحص تداخل الفقرة مع الفقرات الأخرى (مع استثناء الذات عند التحديث)
// ==========================================
const assertNoOverlap = ({ blocks, candidate, excludeId, ctx }) => {
  for (const block of blocks) {
    if (excludeId && String(block._id) === String(excludeId)) continue;

    const existing = toInterval(block.startTime, block.endTime, ctx.fajrMinute, ctx.capacityMinutes);
    if (intervalsOverlap(candidate, existing)) {
      throw createHttpError(409, `الفقرة «${block.title}» تتداخل مع الفقرة المطلوبة — اختيار وقت آخر أو تعديل الفقرة الحالية`);
    }
  }
};

// ==========================================
// فحص تداخل الفقرة مع فترة النوم المحمية (إعادة استعمال منطق النوم الموجود)
// ==========================================
const assertNotInsideSleep = ({ ctx, candidate }) => {
  if (intervalsOverlap(candidate, ctx.sleepInterval)) {
    throw createHttpError(409, 'الفقرة تداخل مع فترة النوم المحمية — لا يمكن جدولة أنشطة داخل وقت النوم');
  }
};

// ==========================================
// التحقق من المدة مقابل النشاط + عدم التطابق الصفري
// ==========================================
const assertValidDuration = ({ activity, interval, startTime, endTime }) => {
  if (startTime === endTime) {
    throw createHttpError(400, 'وقت البداية يساوي وقت النهاية — مدة الفقرة يجب أن تكون أكبر من صفر');
  }

  const duration = intervalDuration(interval);
  if (activity && duration !== activity.durationMinutes) {
    throw createHttpError(
      400,
      `مدة الفقرة (${duration} دقيقة) لا تطابق مدة النشاط (${activity.durationMinutes} دقيقة)`
    );
  }
};

// ==========================================
// إنشاء فقرة زمنية (عند غياب DailySchedule: إنشاؤه تلقائياً)
// ==========================================
const createTimeBlock = async ({ userId, programmeDate, body }) => {
  if (!programmeDate) {
    throw createHttpError(400, 'التاريخ مطلوب');
  }

  if (!isValidHHMM(body.startTime) || !isValidHHMM(body.endTime)) {
    throw createHttpError(400, 'التوقيت يجب أن يكون بصيغة HH:mm');
  }

  const ctx = await programmeValidationService.getDayContext({ userId, programmeDate });

  const activityId = body.activityId || null;
  const activity = await resolveActivity(userId, activityId);

  const startTime = body.startTime;
  const endTime = body.endTime;

  const interval = buildInterval({ ctx, startTime, endTime });
  assertValidDuration({ activity, interval, startTime, endTime });

  const schedule = await ensureSchedule(userId, programmeDate);
  const blocks = schedule.timeBlocks || [];

  assertNotInsideSleep({ ctx, candidate: interval });
  assertNoOverlap({ blocks, candidate: interval, excludeId: null, ctx });

  const priority =
    body.priority !== undefined && !activity ? body.priority : undefined;

  schedule.timeBlocks.push({
    activityId: activity ? activity._id : undefined,
    title: activity ? activity.title : body.title,
    startTime,
    endTime,
    priority: activity ? activity.priority : priority,
    status: body.status || 'PENDING'
  });

  await schedule.save();

  const created = schedule.timeBlocks[schedule.timeBlocks.length - 1];

  return {
    message: 'تم إنشاء الفقرة الزمنية بنجاح',
    scheduleId: schedule._id,
    scheduleDate: programmeDate,
    timeBlock: {
      _id: created._id,
      activityId: created.activityId || null,
      title: created.title,
      startTime: created.startTime,
      endTime: created.endTime,
      priority: created.priority || null,
      status: created.status
    }
  };
};

// ==========================================
// جلب فقرات يوم محدد (بدون إنشاء الجدولة عند غيابها)
// ==========================================
const listTimeBlocks = async ({ userId, programmeDate }) => {
  const ctx = await programmeValidationService.getDayContext({ userId, programmeDate });
  const schedule = await findSchedule(userId, programmeDate);

  if (!schedule || !Array.isArray(schedule.timeBlocks) || schedule.timeBlocks.length === 0) {
    return { scheduleExists: false, programmeDate, timeBlocks: [] };
  }

  const blocks = [...schedule.timeBlocks].sort((a, b) => {
    const aStart = toInterval(a.startTime, a.endTime, ctx.fajrMinute, ctx.capacityMinutes).start;
    const bStart = toInterval(b.startTime, b.endTime, ctx.fajrMinute, ctx.capacityMinutes).start;
    return aStart - bStart;
  });

  return {
    scheduleExists: true,
    programmeDate,
    fajr: ctx.fajr,
    timeBlocks: blocks.map((block) => ({
      _id: block._id,
      activityId: block.activityId || null,
      title: block.title,
      startTime: block.startTime,
      endTime: block.endTime,
      priority: block.priority || null,
      status: block.status
    }))
  };
};

// ==========================================
// جلب فقرة واحدة (مملوكة للمستخدم)
// ==========================================
const getTimeBlock = async ({ userId, programmeDate, blockId }) => {
  const schedule = await findSchedule(userId, programmeDate);
  if (!schedule) {
    throw createHttpError(404, 'الجدولة اليومية غير موجودة لهذا المستخدم');
  }

  const block = schedule.timeBlocks.id(blockId);
  if (!block) {
    throw createHttpError(404, 'الفقرة الزمنية غير موجودة');
  }

  return {
    _id: block._id,
    activityId: block.activityId || null,
    title: block.title,
    startTime: block.startTime,
    endTime: block.endTime,
    priority: block.priority || null,
    status: block.status
  };
};

// ==========================================
// تحديث فقرة (تغيير نشاط/وقت/حالة) — مع استثناء الذات من فحص التداخل
// ==========================================
const updateTimeBlock = async ({ userId, programmeDate, blockId, body }) => {
  if (body.startTime !== undefined && !isValidHHMM(body.startTime)) {
    throw createHttpError(400, 'التوقيت يجب أن يكون بصيغة HH:mm');
  }
  if (body.endTime !== undefined && !isValidHHMM(body.endTime)) {
    throw createHttpError(400, 'التوقيت يجب أن يكون بصيغة HH:mm');
  }

  const ctx = await programmeValidationService.getDayContext({ userId, programmeDate });
  const schedule = await findSchedule(userId, programmeDate);
  if (!schedule) {
    throw createHttpError(404, 'الجدولة اليومية غير موجودة لهذا المستخدم');
  }

  const block = schedule.timeBlocks.id(blockId);
  if (!block) {
    throw createHttpError(404, 'الفقرة الزمنية غير موجودة');
  }

  // تغيير النشاط (أو الإبقاء على النشاط الحالي إن لم يتغير)
  const activityIdChanged = body.activityId !== undefined;
  const activityId = activityIdChanged ? body.activityId : (block.activityId || null);
  const activity = activityId ? await resolveActivity(userId, activityId) : null;

  const startTime = body.startTime !== undefined ? body.startTime : block.startTime;
  const endTime = body.endTime !== undefined ? body.endTime : block.endTime;

  const interval = buildInterval({ ctx, startTime, endTime });
  assertValidDuration({ activity, interval, startTime, endTime });

  const otherBlocks = schedule.timeBlocks.filter((b) => String(b._id) !== String(blockId));

  assertNotInsideSleep({ ctx, candidate: interval });
  assertNoOverlap({ blocks: otherBlocks, candidate: interval, excludeId: blockId, ctx });

  // العنوان والأولوية مشتقة من النشاط (لا نثق في ما يرسله العميل) — أو من الحقول المسموحة يدوياً
  block.activityId = activity ? activity._id : undefined;
  block.title = activity ? activity.title : (body.title !== undefined ? body.title : block.title);
  block.startTime = startTime;
  block.endTime = endTime;
  block.priority = activity ? activity.priority : (body.priority !== undefined ? body.priority : block.priority);
  if (body.status !== undefined) block.status = body.status;

  await schedule.save();

  return {
    message: 'تم تحديث الفقرة الزمنية بنجاح',
    timeBlock: {
      _id: block._id,
      activityId: block.activityId || null,
      title: block.title,
      startTime: block.startTime,
      endTime: block.endTime,
      priority: block.priority || null,
      status: block.status
    }
  };
};

// ==========================================
// حذف فقرة (دون حذف النشاط أو الجدولة اليومية)
// ==========================================
const deleteTimeBlock = async ({ userId, programmeDate, blockId }) => {
  const scheduled = await findSchedule(userId, programmeDate);
  if (!scheduled) {
    throw createHttpError(404, 'الجدولة اليومية غير موجودة لهذا المستخدم');
  }

  const block = scheduled.timeBlocks.id(blockId);
  if (!block) {
    throw createHttpError(404, 'الفقرة الزمنية غير موجودة');
  }

  scheduled.timeBlocks.pull(blockId);
  await scheduled.save();

  return {
    message: 'تم حذف الفقرة الزمنية بنجاح',
    scheduleId: scheduled._id,
    programmeDate
  };
};

module.exports = {
  createTimeBlock,
  listTimeBlocks,
  getTimeBlock,
  updateTimeBlock,
  deleteTimeBlock,
  findSchedule,
  ensureSchedule,
  REQUIRED_PRIORITY
};