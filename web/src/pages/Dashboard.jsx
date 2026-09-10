import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getActivitiesApi } from '../services/activityService'
import { getProgrammeDayApi } from '../services/programmeDayService'
import { TYPE_LABELS, PRIORITY_LABELS, PRIORITY_COLORS, formatRepeatDays } from '../constants/activityLabels'

const PRAYER_LABELS = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
}

const timeOnly = (iso) => iso?.split('T')[1]?.slice(0, 5) || '—'

const formatProgrammeDate = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('ar-MA', { weekday: 'long', day: 'numeric', month: 'long' })
}

function Dashboard() {
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [programmeDay, setProgrammeDay] = useState(null)
  const [pdLoading, setPdLoading] = useState(true)
  const [pdError, setPdError] = useState('')

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

  useEffect(() => {
    let cancelled = false
    getProgrammeDayApi()
      .then((data) => {
        if (!cancelled) setProgrammeDay(data.programmeDay || null)
      })
      .catch((err) => {
        if (cancelled) return
        if (err.cause?.response?.status === 401) {
          handleLogout()
          return
        }
        setPdError(err.message || 'تعذر جلب برنامج اليوم.')
      })
      .finally(() => {
        if (!cancelled) setPdLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [handleLogout])

  return (
    <main dir="rtl" className="min-h-screen bg-[#f5f1e4] px-6 py-10 text-right text-[#123d32]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img alt="شعار برنامج الحياة" className="h-14 w-14 rounded-2xl object-cover shadow-md shadow-emerald-900/15" src="/logo.png" />
            <div>
              <p className="text-sm font-bold tracking-[0.12em] text-[#b87a17]">برنامج الحياة</p>
              <h1 className="text-2xl font-semibold tracking-tight">لوحة التحكم</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              className="rounded-xl border border-[#dfd2b7] bg-[#fffdf7] px-5 py-2.5 font-semibold text-[#174d3d] transition hover:bg-[#f7e4b4]"
              to="/activities"
            >
              الأنشطة
            </Link>
            <Link
              className="rounded-xl border border-[#dfd2b7] bg-[#fffdf7] px-5 py-2.5 font-semibold text-[#174d3d] transition hover:bg-[#f7e4b4]"
              to="/validation"
            >
              التحقق
            </Link>
            <Link
              className="rounded-xl border border-[#dfd2b7] bg-[#fffdf7] px-5 py-2.5 font-semibold text-[#174d3d] transition hover:bg-[#f7e4b4]"
              to="/timeline"
            >
              الجدول الزمني
            </Link>
            <Link
              className="rounded-xl border border-[#dfd2b7] bg-[#fffdf7] px-5 py-2.5 font-semibold text-[#174d3d] transition hover:bg-[#f7e4b4]"
              to="/settings"
            >
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

        <section className="rounded-3xl border border-[#dfd2b7] bg-[#fffdf7] p-8 shadow-xl shadow-[#123d32]/10">
          <h2 className="text-xl font-semibold">أهلاً بك في لوحة التحكم</h2>
          <p className="mt-2 text-[#68776b]">هذه أنشطتك الافتراضية، يمكنك تنظيم برنامجك اليومي منها قريباً.</p>
        </section>

        <section className="rounded-3xl border border-[#dfd2b7] bg-[#fffdf7] p-8 shadow-xl shadow-[#123d32]/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">برنامج اليوم</h2>
              <p className="mt-1 text-sm text-[#68776b]">يمتد من فجر هذا اليوم إلى فجر اليوم الموالي.</p>
            </div>
            <span className="rounded-full bg-[#dcebdd] px-3 py-1 text-xs font-semibold text-[#236247]">الفجر ← الفجر</span>
          </div>

          {pdLoading && <p className="mt-6 text-[#68776b]">جاري تحديد برنامج اليوم...</p>}

          {!pdLoading && pdError && (
            <div className="mt-6 rounded-xl bg-[#fbe5dc] px-4 py-3 text-sm text-[#a44e20]" role="alert">
              <p>{pdError}</p>
              <button
                className="mt-2 rounded-lg bg-[#a44e20] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#c05f27]"
                onClick={() => { setPdLoading(true); setPdError(''); getProgrammeDayApi().then((d) => setProgrammeDay(d.programmeDay || null)).catch((e) => setPdError(e.message)).finally(() => setPdLoading(false)) }}
                type="button"
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {!pdLoading && !pdError && programmeDay && (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#e5dbc4] bg-[#fbf8ef] p-4">
                  <p className="text-sm text-[#68776b]">برنامج اليوم</p>
                  <p className="mt-1 font-semibold text-[#174d3d]">{formatProgrammeDate(programmeDay.programmeDate)}</p>
                </div>
                <div className="rounded-2xl border border-[#e5dbc4] bg-[#fbf8ef] p-4">
                  <p className="text-sm text-[#68776b]">البداية (فجر)</p>
                  <p className="mt-1 font-semibold text-[#174d3d]">{timeOnly(programmeDay.start)}</p>
                </div>
                <div className="rounded-2xl border border-[#e5dbc4] bg-[#fbf8ef] p-4">
                  <p className="text-sm text-[#68776b]">النهاية (فجر الغد)</p>
                  <p className="mt-1 font-semibold text-[#174d3d]">{timeOnly(programmeDay.end)}</p>
                </div>
              </div>

              {!programmeDay.isAfterFajr && (
                <p className="mt-4 rounded-xl bg-[#f7e4b4] px-4 py-3 text-sm text-[#9a6512]">
                  الفجر لم يحن بعد — ما زلت داخل برنامج يوم أمس.
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-1.5">
                {Object.entries(programmeDay.prayerTimes).map(([key, value]) => (
                  <span key={key} className="rounded-full bg-[#fbf8ef] px-3 py-1 text-xs font-semibold text-[#53665b]">
                    {PRAYER_LABELS[key] || key}: {value}
                  </span>
                ))}
              </div>
            </>
          )}
        </section>

        {loading && (
          <section className="flex items-center justify-center rounded-3xl border border-[#dfd2b7] bg-[#fffdf7] p-10 shadow-xl shadow-[#123d32]/10">
            <p className="text-[#68776b]">جاري تحميل الأنشطة...</p>
          </section>
        )}

        {!loading && error && (
          <section className="rounded-3xl border border-[#f5c9b8] bg-[#fbe5dc] p-8 text-[#a44e20]" role="alert">
            <p className="font-semibold">{error}</p>
            <button className="mt-4 rounded-xl bg-[#a44e20] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c05f27]" onClick={() => { setLoading(true); fetchActivities() }} type="button">
              إعادة المحاولة
            </button>
          </section>
        )}

        {!loading && !error && activities.length === 0 && (
          <section className="rounded-3xl border border-[#dfd2b7] bg-[#fffdf7] p-10 text-center shadow-xl shadow-[#123d32]/10">
            <p className="text-lg font-semibold">لا توجد أنشطة بعد</p>
            <p className="mt-2 text-[#68776b]">ستظهر أنشطتك الافتراضية هنا عند إنشاء برنامجك.</p>
          </section>
        )}

        {!loading && !error && activities.length > 0 && (
          <section className="rounded-3xl border border-[#dfd2b7] bg-[#fffdf7] p-8 shadow-xl shadow-[#123d32]/10">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">الأنشطة ({activities.length})</h2>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activities.map((activity) => (
                <li key={activity._id} className="flex flex-col gap-3 rounded-2xl border border-[#e5dbc4] bg-[#fbf8ef] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-[#174d3d]">{activity.title}</h3>
                    <span className="rounded-full bg-[#dcebdd] px-3 py-1 text-xs font-semibold text-[#236247]">
                      {TYPE_LABELS[activity.type] || activity.type}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-sm text-[#53665b]">
                    <span>المدة: {activity.durationMinutes} دقيقة</span>
                    <span>التكرار: {formatRepeatDays(activity.repeatDays)}</span>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_COLORS[activity.priority] || PRIORITY_COLORS.OTHER}`}>
                    الأولوية: {PRIORITY_LABELS[activity.priority] || activity.priority}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}

export default Dashboard