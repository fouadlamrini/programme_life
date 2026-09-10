import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getProgrammeDayApi } from '../services/programmeDayService'
import { getPrayerTimelineApi } from '../services/prayerTimelineService'

const PRAYER_LABELS = {
  FAJR: 'الفجر',
  DHUHR: 'الظهر',
  ASR: 'العصر',
  MAGHRIB: 'المغرب',
  ISHA: 'العشاء',
}

const ZONE_LABELS = {
  POST_FAJR: 'بعد الفجر',
  POST_DHUHR: 'بعد الظهر',
  POST_ASR: 'بعد العصر',
  POST_MAGHRIB: 'بعد المغرب',
  POST_ISHA: 'بعد العشاء',
  BEFORE_SLEEP: 'قبل النوم',
}

const todayKey = () => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

const formatDuration = (minutes) => {
  const total = Math.round(minutes || 0)
  const hours = Math.floor(total / 60)
  const remainder = total % 60
  if (!hours) return `${remainder} د`
  return remainder ? `${hours}س ${remainder}د` : `${hours}س`
}

const formatProgrammeDate = (dateKey) => {
  if (!dateKey) return '—'
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('ar-MA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function Timeline() {
  const navigate = useNavigate()
  const [date, setDate] = useState(todayKey())
  const [timeline, setTimeline] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTimeline = (targetDate, showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setError('')
    getPrayerTimelineApi(targetDate)
      .then((data) => setTimeline(data.timeline || null))
      .catch((err) => {
        if (err.cause?.response?.status === 401) {
          navigate('/login')
          return
        }
        setError(err.message || 'تعذر جلب الجدول الزمني.')
      })
      .finally(() => {
        if (showLoading) setIsLoading(false)
      })
  }

  useEffect(() => {
    let cancelled = false
    getProgrammeDayApi()
      .then((data) => {
        if (cancelled) return
        const programmeDate = data?.programmeDay?.programmeDate || todayKey()
        setDate(programmeDate)
        return getPrayerTimelineApi(programmeDate)
      })
      .then((data) => {
        if (cancelled) return
        setTimeline(data?.timeline || null)
      })
      .catch((err) => {
        if (cancelled) return
        if (err.cause?.response?.status === 401) {
          navigate('/login')
          return
        }
        setError(err.message || 'تعذر جلب الجدول الزمني.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    navigate('/login')
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f5f1e4] px-6 py-10 text-right text-[#123d32]">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img alt="شعار برنامج الحياة" className="h-14 w-14 rounded-2xl object-cover shadow-md shadow-emerald-900/15" src="/logo.png" />
            <div>
              <p className="text-sm font-bold tracking-[0.12em] text-[#b87a17]">برنامج الحياة</p>
              <h1 className="text-2xl font-semibold tracking-tight">الجدول الزمني حسب الصلاة</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              className="rounded-xl border border-[#dfd2b7] bg-[#fffdf7] px-5 py-2.5 font-semibold text-[#174d3d] transition hover:bg-[#f7e4b4]"
              to="/dashboard"
            >
              لوحة التحكم
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

        <section className="mx-auto w-full max-w-2xl rounded-3xl border border-[#dfd2b7] bg-[#fffdf7] p-8 shadow-xl shadow-[#123d32]/10">
          <h2 className="text-xl font-semibold">حدود النهار حسب الصلاة</h2>
          <p className="mt-2 text-sm text-[#68776b]">
            يمتد برنامج اليوم من فجر التاريخ المختار إلى فجر اليوم الموالي. اختر تاريخ البداية لعرض مراسي الصلاة ومناطق
            التخطيط.
          </p>

          <div className="mt-6 flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-semibold text-[#53665b]" htmlFor="timeline-date">
                التاريخ (بداية برنامج اليوم)
              </label>
              <input
                className="w-full rounded-xl border border-[#dfd2b7] bg-[#fbf8ef] px-4 py-3 text-[#123d32] focus:outline-none focus:ring-4 focus:ring-[#f7e4b4]"
                id="timeline-date"
                onChange={(event) => setDate(event.target.value)}
                type="date"
                value={date}
              />
            </div>
            <button
              className="rounded-xl bg-[#174d3d] px-6 py-3 font-semibold text-[#fffdf7] transition hover:bg-[#b8731b] focus:outline-none focus:ring-4 focus:ring-[#f7e4b4]"
              disabled={isLoading}
              onClick={() => loadTimeline(date)}
              type="button"
            >
              عرض
            </button>
          </div>

          {error && (
            <div className="mt-6 rounded-xl bg-[#fbe5dc] px-4 py-3 text-sm text-[#a44e20]" role="alert">
              {error}
            </div>
          )}

          {isLoading && <p className="mt-8 text-[#68776b]">جارٍ بناء الجدول الزمني...</p>}

          {!isLoading && timeline && (
            <div className="mt-8 space-y-6">
              <div className="rounded-2xl border border-[#e5dbc4] bg-[#fbf8ef] px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#68776b]">برنامج اليوم</span>
                  <span className="font-semibold text-[#174d3d]">{formatProgrammeDate(timeline.programmeDate)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-[#68776b]">الحدود</span>
                  <span className="font-semibold text-[#174d3d]">
                    {timeline.programmeDay.fajr} ← {timeline.programmeDay.end.split('T')[1]?.slice(0, 5)}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-bold text-[#53665b]">مراسي الصلاة</h3>
                <div className="grid grid-cols-5 gap-2">
                  {timeline.prayers.map((prayer) => (
                    <div key={prayer.name} className="rounded-2xl border border-[#dfd2b7] bg-[#fbf8ef] p-3 text-center">
                      <p className="text-xs font-semibold text-[#68776b]">{PRAYER_LABELS[prayer.name] || prayer.name}</p>
                      <p className="mt-1 text-lg font-bold text-[#b8731b]">{prayer.time}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-bold text-[#53665b]">مناطق التخطيط</h3>
                <ul className="space-y-2">
                  {timeline.zones.map((zone) => (
                    <li
                      key={zone.type}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#e5dbc4] bg-[#fbf8ef] px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#174d3d]">{ZONE_LABELS[zone.type] || zone.type}</span>
                        {zone.overnight && (
                          <span className="rounded-full bg-[#f7e4b4] px-2.5 py-0.5 text-xs font-semibold text-[#9a6512]">
                            يمتد عبر منتصف الليل
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[#53665b]">
                        <span className="font-semibold text-[#123d32]">
                          {zone.start} ← {zone.end}
                        </span>
                        <span className="rounded-full bg-[#dcebdd] px-2.5 py-0.5 text-xs font-semibold text-[#236247]">
                          {formatDuration(zone.durationMinutes)}
                        </span>
                      </div>
                    </li>
                  ))}

                  {timeline.beforeSleep && (
                    <li className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#e5dbc4] bg-[#fbf8ef] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#174d3d]">{ZONE_LABELS[timeline.beforeSleep.type]}</span>
                        <span className="rounded-full bg-[#f7e4b4] px-2.5 py-0.5 text-xs font-semibold text-[#9a6512]">
                          يمتد عبر منتصف الليل
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[#53665b]">
                        <span className="font-semibold text-[#123d32]">
                          {timeline.beforeSleep.start} ← {timeline.beforeSleep.end}
                        </span>
                        <span className="rounded-full bg-[#dcebdd] px-2.5 py-0.5 text-xs font-semibold text-[#236247]">
                          {formatDuration(timeline.beforeSleep.durationMinutes)}
                        </span>
                      </div>
                    </li>
                  )}
                </ul>
              </div>

              <div className="rounded-2xl border border-[#dfd2b7] bg-[#fbf8ef] px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#53665b]">النوم</span>
                    {timeline.sleep.overnight && (
                      <span className="rounded-full bg-[#f7e4b4] px-2.5 py-0.5 text-xs font-semibold text-[#9a6512]">
                        يمتد عبر منتصف الليل
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#53665b]">
                    <span className="font-semibold text-[#123d32]">
                      {timeline.sleep.start} ← {timeline.sleep.end}
                    </span>
                    <span className="rounded-full bg-[#dcebdd] px-2.5 py-0.5 text-xs font-semibold text-[#236247]">
                      {formatDuration(timeline.sleep.durationMinutes)}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-[#68776b]">
                  حد النوم محسوب من إعدادات النوم الخاصة بك (ينتهي عند فجر اليوم الموالي).
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default Timeline