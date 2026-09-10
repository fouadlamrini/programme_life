import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ActivityForm from '../components/ActivityForm'
import {
  getActivitiesApi,
  createActivityApi,
  updateActivityApi,
  deleteActivityApi,
} from '../services/activityService'
import {
  TYPE_LABELS,
  TIME_SLOT_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  formatRepeatDays,
} from '../constants/activityLabels'

function Activities() {
  const navigate = useNavigate()
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

  const fetchActivities = useCallback(async () => {
    try {
      const data = await getActivitiesApi()
      setActivities(data.activities || [])
    } catch (err) {
      if (err.cause?.response?.status === 401) {
        handleLogout()
        return
      }
      setError(err.message || 'تعذر جلب الأنشطة.')
    } finally {
      setLoading(false)
    }
  }, [handleLogout])

  useEffect(() => {
    let cancelled = false
    getActivitiesApi()
      .then((data) => {
        if (!cancelled) setActivities(data.activities || [])
      })
      .catch((err) => {
        if (cancelled) return
        if (err.cause?.response?.status === 401) {
          handleLogout()
          return
        }
        setError(err.message || 'تعذر جلب الأنشطة.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [handleLogout])

  const openCreateModal = () => {
    setFormError('')
    setModal({})
  }

  const openEditModal = (activity) => {
    setFormError('')
    setModal(activity)
  }

  const closeModal = () => {
    setModal(null)
    setFormError('')
  }

  const handleSubmit = async (data) => {
    setIsSubmitting(true)
    setFormError('')
    try {
      if (modal?._id) {
        const res = await updateActivityApi(modal._id, data)
        setActivities((list) => list.map((a) => (a._id === res.activity._id ? res.activity : a)))
      } else {
        const res = await createActivityApi(data)
        setActivities((list) => [res.activity, ...list])
      }
      closeModal()
    } catch (err) {
      setFormError(err.message || 'تعذر حفظ النشاط.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (activity) => {
    const confirmed = window.confirm(`هل تريد حذف «${activity.title}»؟`)
    if (!confirmed) return

    try {
      await deleteActivityApi(activity._id)
      setActivities((list) => list.filter((a) => a._id !== activity._id))
    } catch (err) {
      setError(err.message || 'تعذر حذف النشاط.')
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
              <h1 className="text-2xl font-semibold tracking-tight">الأنشطة</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link className="rounded-xl border border-[#dfd2b7] bg-[#fffdf7] px-5 py-2.5 font-semibold text-[#174d3d] transition hover:bg-[#f7e4b4]" to="/dashboard">
              لوحة التحكم
            </Link>
            <Link className="rounded-xl border border-[#dfd2b7] bg-[#fffdf7] px-5 py-2.5 font-semibold text-[#174d3d] transition hover:bg-[#f7e4b4]" to="/settings">
              الإعدادات
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

        <section className="flex items-center justify-between rounded-3xl border border-[#dfd2b7] bg-[#fffdf7] p-8 shadow-xl shadow-[#123d32]/10">
          <div>
            <h2 className="text-xl font-semibold">إدارة الأنشطة</h2>
            <p className="mt-2 text-[#68776b]">أنشئ عدّلك وحذف أنشطتك اليومية.</p>
          </div>
          <button
            className="rounded-xl bg-[#174d3d] px-5 py-2.5 font-semibold text-[#fffdf7] transition hover:bg-[#b8731b] focus:outline-none focus:ring-4 focus:ring-[#f7e4b4]"
            onClick={openCreateModal}
            type="button"
          >
            + إضافة نشاط
          </button>
        </section>

        {!loading && error && (
          <section className="rounded-3xl border border-[#f5c9b8] bg-[#fbe5dc] p-8 text-[#a44e20]" role="alert">
            <p className="font-semibold">{error}</p>
            <button className="mt-4 rounded-xl bg-[#a44e20] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c05f27]" onClick={() => { setLoading(true); fetchActivities() }} type="button">
              إعادة المحاولة
            </button>
          </section>
        )}

        {loading && (
          <section className="flex items-center justify-center rounded-3xl border border-[#dfd2b7] bg-[#fffdf7] p-10 shadow-xl shadow-[#123d32]/10">
            <p className="text-[#68776b]">جاري تحميل الأنشطة...</p>
          </section>
        )}

        {!loading && !error && activities.length === 0 && (
          <section className="rounded-3xl border border-[#dfd2b7] bg-[#fffdf7] p-10 text-center shadow-xl shadow-[#123d32]/10">
            <p className="text-lg font-semibold">لا توجد أنشطة بعد</p>
            <p className="mt-2 text-[#68776b]">ابدأ بإضافة نشاطك الأول.</p>
          </section>
        )}

        {!loading && !error && activities.length > 0 && (
          <section className="rounded-3xl border border-[#dfd2b7] bg-[#fffdf7] p-8 shadow-xl shadow-[#123d32]/10">
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activities.map((activity) => (
                <li key={activity._id} className="flex flex-col justify-between gap-3 rounded-2xl border border-[#e5dbc4] bg-[#fbf8ef] p-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-[#174d3d]">{activity.title}</h3>
                      <div className="flex shrink-0 items-center gap-1">
                        {activity.isSystem && (
                          <span className="rounded-full bg-[#f5d9bd] px-3 py-1 text-xs font-semibold text-[#a44e20]">نظام</span>
                        )}
                        <span className="rounded-full bg-[#dcebdd] px-3 py-1 text-xs font-semibold text-[#236247]">
                          {TYPE_LABELS[activity.type] || activity.type}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-1 text-sm text-[#53665b]">
                      <span>المدة: {activity.durationMinutes} دقيقة</span>
                      <span>التكرار: {formatRepeatDays(activity.repeatDays)}</span>
                      <span>الخانة: {TIME_SLOT_LABELS[activity.preferredTimeSlot] || activity.preferredTimeSlot}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_COLORS[activity.priority] || PRIORITY_COLORS.OTHER}`}>
                      {PRIORITY_LABELS[activity.priority] || activity.priority}
                    </span>
                    <div className="flex gap-2">
                      <button
                        className="rounded-lg border border-[#dfd2b7] bg-white px-3 py-1.5 text-sm font-semibold text-[#174d3d] transition hover:bg-[#f7e4b4]"
                        onClick={() => openEditModal(activity)}
                        type="button"
                      >
                        تعديل
                      </button>
                      {!activity.isSystem && (
                        <button
                          className="rounded-lg bg-[#a44e20] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#c05f27]"
                          onClick={() => handleDelete(activity)}
                          type="button"
                        >
                          حذف
                        </button>
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
              <h2 className="text-lg font-semibold text-[#123d32]">
                {modal._id ? 'تعديل النشاط' : 'إضافة نشاط جديد'}
              </h2>
              <button
                aria-label="إغلاق"
                className="rounded-xl bg-[#f5f1e4] px-3 py-1.5 text-[#68776b] transition hover:bg-[#f7e4b4]"
                onClick={closeModal}
                type="button"
              >
                ✕
              </button>
            </div>
            <ActivityForm
              apiError={formError}
              initialActivity={modal._id ? modal : null}
              isSubmitting={isSubmitting}
              key={modal._id || 'create'}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      )}
    </main>
  )
}

export default Activities