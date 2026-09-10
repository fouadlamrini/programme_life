import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getProgrammeDayApi } from '../services/programmeDayService'
import { getProgrammeValidationApi } from '../services/programmeValidationService'

const todayKey = () => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

const formatHours = (minutes) => {
  const value = Math.round(minutes || 0)
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  const hours = Math.floor(abs / 60)
  const remainder = abs % 60
  return `${sign}${remainder ? `${hours}h${String(remainder).padStart(2, '0')}` : `${hours}h`}`
}

const VIOLATION_LABELS = {
  TOTAL_TIME_EXCEEDED: 'المدة الإجمالية تتجاوز 24 ساعة.',
  SLEEP_CONFLICT: 'نشاط مجدول يتعارض مع فترة النوم.',
  ACTIVITY_OVERLAP: 'نشاطان مجدولان يتعارضان في التوقيت.',
}

function Validation() {
  const navigate = useNavigate()
  const [date, setDate] = useState(todayKey())
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const runValidation = (targetDate) => {
    setIsLoading(true)
    setError('')
    getProgrammeValidationApi(targetDate)
      .then((data) => setResult(data))
      .catch((err) => {
        if (err.cause?.response?.status === 401) {
          navigate('/login')
          return
        }
        setError(err.message || 'تعذر التحقق من البرنامج.')
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    let cancelled = false
    getProgrammeDayApi()
      .then((data) => {
        if (cancelled) return
        const programmeDate = data?.programmeDay?.programmeDate || todayKey()
        setDate(programmeDate)
        return getProgrammeValidationApi(programmeDate)
      })
      .then((data) => {
        if (cancelled) return
        setResult(data)
      })
      .catch((err) => {
        if (cancelled) return
        if (err.cause?.response?.status === 401) {
          navigate('/login')
          return
        }
        setError(err.message || 'تعذر التحقق من البرنامج.')
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
              <h1 className="text-2xl font-semibold tracking-tight">التحقق من البرنامج</h1>
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

        <section className="mx-auto w-full max-w-xl rounded-3xl border border-[#dfd2b7] bg-[#fffdf7] p-8 shadow-xl shadow-[#123d32]/10">
          <h2 className="text-xl font-semibold">برنامج اليوم</h2>
          <p className="mt-2 text-sm text-[#68776b]">
            حدد تاريخ بداية برنامج اليوم (فجر) وستُتحقق من أن البرنامج ممكن (المدة والنوم والتداخلات).
          </p>

          <div className="mt-6 flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-semibold text-[#53665b]" htmlFor="validation-date">
                التاريخ (بداية برنامج اليوم)
              </label>
              <input
                className="w-full rounded-xl border border-[#dfd2b7] bg-[#fbf8ef] px-4 py-3 text-[#123d32] focus:outline-none focus:ring-4 focus:ring-[#f7e4b4]"
                id="validation-date"
                onChange={(event) => setDate(event.target.value)}
                type="date"
                value={date}
              />
            </div>
            <button
              className="rounded-xl bg-[#174d3d] px-6 py-3 font-semibold text-[#fffdf7] transition hover:bg-[#b8731b] focus:outline-none focus:ring-4 focus:ring-[#f7e4b4]"
              disabled={isLoading}
              onClick={() => runValidation(date)}
              type="button"
            >
              تحقق
            </button>
          </div>

          {error && (
            <div className="mt-6 rounded-xl bg-[#fbe5dc] px-4 py-3 text-sm text-[#a44e20]" role="alert">
              {error}
            </div>
          )}

          {isLoading && <p className="mt-8 text-[#68776b]">جارٍ التحقق من البرنامج...</p>}

          {!isLoading && result && (
            <div className="mt-8 space-y-6">
              <div
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
                  result.valid ? 'bg-[#e0f0e3] text-[#236247]' : 'bg-[#fbe5dc] text-[#a44e20]'
                }`}
                role="alert"
              >
                {result.valid ? 'البرنامج صالح ✓' : '⚠ هناك مشاكل في البرنامج'}
              </div>

              {!result.scheduleExists && (
                <p className="text-sm text-[#68776b]">
                  لا توجد جدولة فعلية لهذا اليوم حتى الآن — التحقق نظري مبني على مدد الأنشطة.
                </p>
              )}

              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-2xl border border-[#e5dbc4] bg-[#fbf8ef] px-4 py-3">
                  <dt className="text-sm text-[#68776b]">مدة النوم</dt>
                  <dd className="font-semibold text-[#174d3d]">{formatHours(result.summary.sleepMinutes)}</dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-[#e5dbc4] bg-[#fbf8ef] px-4 py-3">
                  <dt className="text-sm text-[#68776b]">وقت الأنشطة</dt>
                  <dd className="font-semibold text-[#174d3d]">{formatHours(result.summary.activityMinutes)}</dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-[#e5dbc4] bg-[#fbf8ef] px-4 py-3">
                  <dt className="text-sm text-[#68776b]">الإجمالي</dt>
                  <dd className="font-semibold text-[#174d3d]">{formatHours(result.summary.totalMinutes)}</dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-[#e5dbc4] bg-[#fbf8ef] px-4 py-3">
                  <dt className="text-sm text-[#68776b]">متبقي</dt>
                  <dd className="font-semibold text-[#174d3d]">{formatHours(result.summary.remainingMinutes)}</dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-[#e5dbc4] bg-[#fbf8ef] px-4 py-3 sm:col-span-2">
                  <dt className="text-sm text-[#68776b]">سعة برنامج اليوم</dt>
                  <dd className="font-semibold text-[#174d3d]">{formatHours(result.summary.capacityMinutes)}</dd>
                </div>
              </dl>

              {result.violations.length > 0 && (
                <ul className="space-y-2">
                  {result.violations.map((violation, index) => (
                    <li key={`${violation.type}-${index}`} className="rounded-xl bg-[#fbe5dc] px-4 py-3 text-sm text-[#a44e20]">
                      ❌ {violation.message || VIOLATION_LABELS[violation.type]}
                      {violation.type === 'TOTAL_TIME_EXCEEDED' && (
                        <span className="mt-1 block font-semibold">تجاوز بـ: {formatHours(violation.excessMinutes)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default Validation