import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSleepApi, updateSleepApi } from '../services/sleepService'

const SLEEP_PRESETS = [
  { value: 420, label: '7 ساعات' },
  { value: 450, label: '7 ساعات و30 دقيقة' },
  { value: 480, label: '8 ساعات' },
  { value: 510, label: '8 ساعات و30 دقيقة' },
  { value: 540, label: '9 ساعات' },
]

const formatHours = (minutes) => {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours}h${String(remainder).padStart(2, '0')}` : `${hours}h`
}

function SleepSettings() {
  const navigate = useNavigate()
  const [sleep, setSleep] = useState(null)
  const [target, setTarget] = useState(480)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })

  useEffect(() => {
    let cancelled = false
    getSleepApi()
      .then((data) => {
        if (cancelled) return
        setSleep(data)
        setTarget(data.sleepTargetMinutes)
      })
      .catch((err) => {
        if (cancelled) return
        if (err.cause?.response?.status === 401) {
          navigate('/login')
          return
        }
        setStatus({ type: 'error', message: err.message || 'تعذر جلب إعدادات النوم.' })
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [navigate])

  const handleTargetChange = (event) => {
    const value = Number(event.target.value)
    setTarget(value)
    setIsSaving(true)
    setStatus({ type: '', message: '' })

    updateSleepApi({ sleepTargetMinutes: value })
      .then((data) => {
        setSleep(data.sleep || data)
        setStatus({ type: 'success', message: 'تم تحديث إعدادات النوم بنجاح.' })
      })
      .catch((err) => {
        if (err.cause?.response?.status === 401) {
          navigate('/login')
          return
        }
        setStatus({ type: 'error', message: err.message || 'تعذر تحديث إعدادات النوم.' })
      })
      .finally(() => setIsSaving(false))
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    navigate('/login')
  }

  const options = SLEEP_PRESETS.some((p) => p.value === target)
    ? SLEEP_PRESETS
    : [{ value: target, label: formatHours(target) }, ...SLEEP_PRESETS]

  return (
    <main dir="rtl" className="min-h-screen bg-[#f5f1e4] px-6 py-10 text-right text-[#123d32]">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img alt="شعار برنامج الحياة" className="h-14 w-14 rounded-2xl object-cover shadow-md shadow-emerald-900/15" src="/logo.png" />
            <div>
              <p className="text-sm font-bold tracking-[0.12em] text-[#b87a17]">برنامج الحياة</p>
              <h1 className="text-2xl font-semibold tracking-tight">إعدادات النوم</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
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

        <section className="mx-auto w-full max-w-xl rounded-3xl border border-[#dfd2b7] bg-[#fffdf7] p-8 shadow-xl shadow-[#123d32]/10">
          <h2 className="text-xl font-semibold">النوم</h2>
          <p className="mt-2 text-sm text-[#68776b]">
            أنت تحدد فقط مدة النوم المطلوبة — وقت الاستيقاظ يُحسب تلقائياً من موعد الفجر.
          </p>

          {status.message && (
            <div
              className={`mt-6 rounded-xl px-4 py-3 text-sm ${
                status.type === 'success' ? 'bg-[#e0f0e3] text-[#236247]' : 'bg-[#fbe5dc] text-[#a44e20]'
              }`}
              role="alert"
            >
              {status.message}
            </div>
          )}

          {isLoading ? (
            <p className="mt-6 text-[#68776b]">جارٍ التحميل...</p>
          ) : (
            <>
              <div className="mt-6">
                <label className="mb-2 block text-sm font-semibold text-[#53665b]" htmlFor="sleep-target">
                  المدة المطلوبة
                </label>
                <select
                  className="w-full rounded-xl border border-[#dfd2b7] bg-[#fbf8ef] px-4 py-3 text-[#123d32] focus:outline-none focus:ring-4 focus:ring-[#f7e4b4]"
                  disabled={isSaving}
                  id="sleep-target"
                  onChange={handleTargetChange}
                  value={target}
                >
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {sleep && (
                <dl className="mt-6 grid gap-3">
                  <div className="flex items-center justify-between rounded-2xl border border-[#e5dbc4] bg-[#fbf8ef] px-4 py-3">
                    <dt className="text-sm text-[#68776b]">الفجر</dt>
                    <dd className="font-semibold text-[#174d3d]">{sleep.fajr}</dd>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-[#e5dbc4] bg-[#fbf8ef] px-4 py-3">
                    <dt className="text-sm text-[#68776b]">الاستيقاظ</dt>
                    <dd className="font-semibold text-[#174d3d]">{sleep.wakeUpTime}</dd>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-[#e5dbc4] bg-[#fbf8ef] px-4 py-3">
                    <dt className="text-sm text-[#68776b]">مدة النوم</dt>
                    <dd className="font-semibold text-[#174d3d]">{sleep.sleepStart} ← {sleep.sleepEnd}</dd>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-[#e5dbc4] bg-[#fbf8ef] px-4 py-3">
                    <dt className="text-sm text-[#68776b]">المدة المحسوبة</dt>
                    <dd className="font-semibold text-[#174d3d]">{formatHours(sleep.sleepDurationMinutes)}</dd>
                  </div>
                  <p className="pt-1 text-center text-xs text-[#68776b]">{sleep.programmeDate}</p>
                </dl>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  )
}

export default SleepSettings