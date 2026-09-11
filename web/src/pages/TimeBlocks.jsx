import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getActivitiesApi } from '../services/activityService'
import { getProgrammeDayApi } from '../services/programmeDayService'
import {
  getTimeBlocksApi,
  createTimeBlockApi,
  updateTimeBlockApi,
  deleteTimeBlockApi,
} from '../services/timeBlockService'
import {
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  STATUS_LABELS,
  TIME_SLOT_LABELS,
} from '../constants/activityLabels'

const toMinuteOfDay = (hhmm) => {
  const [hours, minutes] = String(hhmm || '').split(':').map(Number)
  return Number.isInteger(hours) && Number.isInteger(minutes) ? hours * 60 + minutes : NaN
}

const formatDuration = (startTime, endTime) => {
  const start = toMinuteOfDay(startTime)
  const end = toMinuteOfDay(endTime)
  if (!Number.isInteger(start) || !Number.isInteger(end)) return '—'
  const minutes = end > start ? end - start : end + 1440 - start
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (!hours) return `${remainder} د`
  return remainder ? `${hours}س ${remainder}د` : `${hours}س`
}

const emptyForm = { activityId: '', title: '', priority: 'MEDIUM', startTime: '', endTime: '', status: 'PENDING' }

const isPrayerActivity = (activity) => {
  return activity && activity.type === 'PRAYER' && activity.preferredTimeSlot === 'AT_PRAYER_TIME'
}

const isPrayerBlock = (block, activitiesList) => {
  if (!block.activityId) return false
  const activity = activitiesList.find((a) => a._id === block.activityId)
  return isPrayerActivity(activity)
}

function TimeBlocks() {
  const navigate = useNavigate()
  const [date, setDate] = useState('')
  const [blocks, setBlocks] = useState([])
  const [scheduleExists, setScheduleExists] = useState(false)
  const [fajr, setFajr] = useState('')
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const handleLogout = useCallback(() => {
    localStorage.removeItem('accessToken')
    navigate('/login')
  }, [navigate])

  const refreshBlocks = useCallback(async (selectedDate) => {
    const data = await getTimeBlocksApi(selectedDate)
    setBlocks(data.timeBlocks || [])
    setScheduleExists(data.scheduleExists)
    setFajr(data.fajr || '')
    return data
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([getProgrammeDayApi(), getActivitiesApi()])
      .then(([pd, acts]) => {
        if (cancelled) return
        const defaultDate = pd?.programmeDay?.programmeDate || new Date().toISOString().slice(0, 10)
        setDate(defaultDate)
        setActivities(acts.activities || [])
        return refreshBlocks(defaultDate)
      })
      .catch((err) => {
        if (cancelled) return
        if (err.cause?.response?.status === 401) {
          handleLogout()
          return
        }
        setError(err.message || 'تعذر تحميل الصفحة.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDateChange = (value) => {
    setDate(value)
    setLoading(true)
    setError('')
    refreshBlocks(value)
      .catch((err) => {
        if (err.cause?.response?.status === 401) {
          handleLogout()
          return
        }
        setError(err.message || 'تعذر جلب الفقرات الزمنية.')
      })
      .finally(() => setLoading(false))
  }

  const selectedActivity = useMemo(
    () => activities.find((a) => a._id === modal?.activityId) || null,
    [activities, modal]
  )

  const openCreateModal = () => {
    setFormError('')
    setModal({ ...emptyForm })
  }

  const openEditModal = (block) => {
    setFormError('')
    setModal({
      activityId: block.activityId || '',
      title: block.title,
      priority: block.priority || 'MEDIUM',
      startTime: block.startTime,
      endTime: block.endTime,
      status: block.status,
      _id: block._id,
      blockHadActivity: Boolean(block.activityId),
    })
  }

  const closeModal = () => {
    setModal(null)
    setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFormError('')
    try {
      const payload = {
        startTime: modal.startTime,
        endTime: modal.endTime,
      }
      if (modal.activityId) payload.activityId = modal.activityId
      else {
        payload.title = modal.title
        payload.priority = modal.priority
      }
      if (modal._id) payload.status = modal.status

      if (modal._id) {
        const res = await updateTimeBlockApi(date, modal._id, payload)
        setBlocks((list) => list.map((b) => (b._id === modal._id ? res.timeBlock : b)))
      } else {
        const res = await createTimeBlockApi(date, payload)
        setBlocks((list) => [...list, res.timeBlock])
        setScheduleExists(true)
      }
      closeModal()
    } catch (err) {
      setFormError(err.message || 'تعذر حفظ الفقرة الزمنية.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleActivityChange = (value) => {
    // فقرة مرتبطة بنشاط لا يمكن فصلها — منع التحويل إلى "بدون نشاط"
    if (modal._id && modal.blockHadActivity && value === '') {
      window.alert('لا يمكن فصل الفقرة عن نشاطها.')
      return
    }
    setModal({ ...modal, activityId: value })
  }

  const handleUpdate = async (block, payload) => {
    try {
      const res = await updateTimeBlockApi(date, block._id, payload)
      setBlocks((list) => list.map((b) => (b._id === block._id ? res.timeBlock : b)))
    } catch (err) {
      setError(err.message || 'تعذر تحديث الفقرة الزمنية.')
    }
  }

  const handleStatusChange = (block, status) => {
    handleUpdate(block, { status })
  }

  const handleDelete = async (block) => {
    const confirmed = window.confirm(`هل تريد حذف «${block.title}»؟`)
    if (!confirmed) return
    try {
      await deleteTimeBlockApi(date, block._id)
      setBlocks((list) => list.filter((b) => b._id !== block._id))
    } catch (err) {
      setError(err.message || 'تعذر حذف الفقرة الزمنية.')
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f5f1e4] px-6 py-10 text-right text-[#123d32]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img alt="شعار برنامج الحياة" className="h-14 w-14 rounded-2xl object-cover shadow-md shadow-emerald-900/15" src="/logo.png" />
            <div>
              <p className="text-sm font-bold tracking-[0.12em] text-[#b87a17]">برنامج الحياة</p>
              <h1 className="text-2xl font-semibold tracking-tight">الجدولة اليومية</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link className="rounded-xl border border-[#dfd2b7] bg-[#fffdf7] px-5 py-2.5 font-semibold text-[#174d3d] transition hover:bg-[#f7e4b4]" to="/dashboard">
              لوحة التحكم
            </Link>
            <Link className="rounded-xl border border-[#dfd2b7] bg-[#fffdf7] px-5 py-2.5 font-semibold text-[#174d3d] transition hover:bg-[#f7e4b4]" to="/validation">
              التحقق
            </Link>
            <button
              className="rounded-xl bg-[#174d3d] px-5 py-2.5 font-semibold text-[#fffdf7] transition hover:bg-[#b8731b] focus:outline-none focus:ring-4 focus:ring-[#f7e4b4]"
              onClick={handleLogout}
              type="button"
            >
              تسجيل الخروج
            </button>
          </div>
        </header>

        <section className="rounded-3xl border border-[#dfd2b7] bg-[#fffdf7] p-8 shadow-xl shadow-[#123d32]/10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">إدارة الفقرات الزمنية</h2>
              <p className="mt-2 text-[#68776b]">يمتد اليوم من فجر التاريخ المحدد إلى فجر اليوم الموالي. استعمل فقراتك لجدولة أنشطتك فعلياً.</p>
            </div>
            <div className="flex items-end gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-[#53665b]">برنامج اليوم</span>
                <input
                  className="rounded-xl border border-[#dfd2b7] bg-[#fbf8ef] px-4 py-2.5 font-semibold text-[#174d3d] focus:outline-none focus:ring-4 focus:ring-[#f7e4b4]"
                  onChange={(event) => handleDateChange(event.target.value)}
                  type="date"
                  value={date}
                />
              </label>
              <button
                className="rounded-xl bg-[#174d3d] px-5 py-2.5 font-semibold text-[#fffdf7] transition hover:bg-[#b8731b] focus:outline-none focus:ring-4 focus:ring-[#f7e4b4]"
                onClick={openCreateModal}
                type="button"
              >
                + إضافة فقرة
              </button>
            </div>
          </div>
          {fajr && (
            <p className="mt-3 text-sm text-[#68776b]">
              فجر البرنامج: <span className="font-semibold text-[#174d3d]">{fajr}</span> — الفقرات الممتدة عبر منتصف الليل تُحسب ضمن هذا اليوم.
            </p>
          )}
        </section>

        {!loading && error && (
          <section className="rounded-3xl border border-[#f5c9b8] bg-[#fbe5dc] p-8 text-[#a44e20]" role="alert">
            <p className="font-semibold">{error}</p>
          </section>
        )}

        {loading && (
          <section className="flex items-center justify-center rounded-3xl border border-[#dfd2b7] bg-[#fffdf7] p-10 shadow-xl shadow-[#123d32]/10">
            <p className="text-[#68776b]">جاري تحميل الفقرات...</p>
          </section>
        )}

        {!loading && !error && blocks.length === 0 && (
          <section className="rounded-3xl border border-[#dfd2b7] bg-[#fffdf7] p-10 text-center shadow-xl shadow-[#123d32]/10">
            <p className="text-lg font-semibold">لا توجد فقرات لهذا اليوم</p>
            <p className="mt-2 text-[#68776b]">أضف أول فقرة زمنية لجدولة نشاط فعلي في هذا اليوم.</p>
          </section>
        )}

        {!loading && !error && blocks.length > 0 && (
          <section className="rounded-3xl border border-[#dfd2b7] bg-[#fffdf7] p-8 shadow-xl shadow-[#123d32]/10">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">فقرات اليوم ({blocks.length})</h2>
              {scheduleExists && <span className="rounded-full bg-[#dcebdd] px-3 py-1 text-xs font-semibold text-[#236247]">جدولة محفوظة</span>}
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {blocks.map((block) => (
                <li key={block._id} className="flex flex-col justify-between gap-3 rounded-2xl border border-[#e5dbc4] bg-[#fbf8ef] p-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-[#174d3d]">{block.title}</h3>
                      <div className="flex shrink-0 gap-1">
                        {isPrayerBlock(block, activities) && (
                          <span className="rounded-full bg-[#e8eef4] px-3 py-1 text-xs font-semibold text-[#3d5a80]">
                            صلاة
                          </span>
                        )}
                        <span className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_COLORS[block.priority] || PRIORITY_COLORS.OTHER}`}>
                          {PRIORITY_LABELS[block.priority] || block.priority}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#53665b]">
                      <span className="font-semibold text-[#123d32]">
                        {block.startTime} ← {block.endTime}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-[#3d5a80]">
                        {formatDuration(block.startTime, block.endTime)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#68776b]">الحالة:</span>
                      <select
                        className="rounded-lg border border-[#dfd2b7] bg-white px-2 py-1.5 text-sm font-semibold text-[#174d3d] focus:outline-none"
                        onChange={(event) => handleStatusChange(block, event.target.value)}
                        value={block.status}
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </label>
                    <div className="flex gap-2">
                      {!isPrayerBlock(block, activities) && (
                        <>
                          <button
                            className="rounded-lg border border-[#dfd2b7] bg-white px-3 py-1.5 text-sm font-semibold text-[#174d3d] transition hover:bg-[#f7e4b4]"
                            onClick={() => openEditModal(block)}
                            type="button"
                          >
                            تعديل
                          </button>
                          <button
                            className="rounded-lg bg-[#a44e20] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#c05f27]"
                            onClick={() => handleDelete(block)}
                            type="button"
                          >
                            حذف
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#dfd2b7] bg-[#fffdf7] p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#123d32]">{modal._id ? 'تعديل الفقرة الزمنية' : 'إضافة فقرة زمنية'}</h2>
              <button
                aria-label="إغلاق"
                className="rounded-xl bg-[#f5f1e4] px-3 py-1.5 text-[#68776b] transition hover:bg-[#f7e4b4]"
                onClick={closeModal}
                type="button"
              >
                ✕
              </button>
            </div>

            <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
                {formError && (
                  <p className="rounded-xl bg-[#fbe5dc] px-4 py-3 text-sm font-semibold text-[#a44e20]" role="alert">{formError}</p>
                )}

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-[#53665b]">النشاط (مصدر المدة والأولوية)</span>
                  <select
                    className="rounded-xl border border-[#dfd2b7] bg-[#fbf8ef] px-4 py-2.5 font-semibold text-[#174d3d] focus:outline-none focus:ring-4 focus:ring-[#f7e4b4]"
                    onChange={(event) => handleActivityChange(event.target.value)}
                    value={modal.activityId}
                  >
                    <option value="">بدون نشاط (فقرة حرة)</option>
                    {activities.filter((a) => !isPrayerActivity(a)).map((activity) => (
                      <option key={activity._id} value={activity._id}>
                        {activity.title} ({activity.durationMinutes} د)
                      </option>
                    ))}
                  </select>
                </label>

                {selectedActivity && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-[#dcebdd] px-3 py-1 font-semibold text-[#236247]">المدة: {selectedActivity.durationMinutes} دقيقة</span>
                    <span className="rounded-full bg-[#e8eef4] px-3 py-1 font-semibold text-[#3d5a80]">الأولوية: {PRIORITY_LABELS[selectedActivity.priority] || selectedActivity.priority}</span>
                    <span className="rounded-full bg-[#f7e4b4] px-3 py-1 font-semibold text-[#9a6512]">الخانة: {TIME_SLOT_LABELS[selectedActivity.preferredTimeSlot] || selectedActivity.preferredTimeSlot}</span>
                  </div>
                )}

                {!selectedActivity && (
                  <>
                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-[#53665b]">عنوان الفقرة</span>
                      <input
                        className="rounded-xl border border-[#dfd2b7] bg-[#fbf8ef] px-4 py-2.5 font-semibold text-[#174d3d] focus:outline-none focus:ring-4 focus:ring-[#f7e4b4]"
                        onChange={(event) => setModal({ ...modal, title: event.target.value })}
                        placeholder="مثال: مراجعة يومية"
                        value={modal.title}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-[#53665b]">الأولوية</span>
                      <select
                        className="rounded-xl border border-[#dfd2b7] bg-[#fbf8ef] px-4 py-2.5 font-semibold text-[#174d3d] focus:outline-none focus:ring-4 focus:ring-[#f7e4b4]"
                        onChange={(event) => setModal({ ...modal, priority: event.target.value })}
                        value={modal.priority}
                      >
                        {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </label>
                  </>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-[#53665b]">وقت البداية</span>
                    <input
                      className="rounded-xl border border-[#dfd2b7] bg-[#fbf8ef] px-4 py-2.5 font-semibold text-[#174d3d] focus:outline-none focus:ring-4 focus:ring-[#f7e4b4]"
                      onChange={(event) => setModal({ ...modal, startTime: event.target.value })}
                      type="time"
                      value={modal.startTime}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-[#53665b]">وقت النهاية</span>
                    <input
                      className="rounded-xl border border-[#dfd2b7] bg-[#fbf8ef] px-4 py-2.5 font-semibold text-[#174d3d] focus:outline-none focus:ring-4 focus:ring-[#f7e4b4]"
                      onChange={(event) => setModal({ ...modal, endTime: event.target.value })}
                      type="time"
                      value={modal.endTime}
                    />
                  </label>
                </div>

                {modal._id && (
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-[#53665b]">الحالة</span>
                    <select
                      className="rounded-xl border border-[#dfd2b7] bg-[#fbf8ef] px-4 py-2.5 font-semibold text-[#174d3d] focus:outline-none focus:ring-4 focus:ring-[#f7e4b4]"
                      onChange={(event) => setModal({ ...modal, status: event.target.value })}
                      value={modal.status}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                )}

                <p className="text-xs text-[#68776b]">
                  ملاحظة: في حالة النشاط المختار، يجب أن تطابق مدة الفقرة (البداية ← النهاية) مدة النشاط بالضبط — المدة والأولوية يُحددان من النشاط وليس من النموذج. الفقرات لا يمكن أن تتداخل فيما بينها أو مع فترة النوم المحمية.
                </p>

                <div className="flex gap-3">
                  <button
                    className="flex-1 rounded-xl bg-[#a44e20] px-4 py-2.5 font-semibold text-white transition hover:bg-[#c05f27]"
                    onClick={closeModal}
                    type="button"
                  >
                    إلغاء
                  </button>
                  <button
                    className="flex-1 rounded-xl bg-[#174d3d] px-4 py-2.5 font-semibold text-[#fffdf7] transition hover:bg-[#b8731b] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? 'جاري الحفظ...' : modal._id ? 'حفظ التعديلات' : 'حفظ الفقرة'}
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default TimeBlocks