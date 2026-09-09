import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ChangePasswordForm from '../components/ChangePasswordForm'
import { changePasswordApi } from '../services/authService'

function ChangePassword() {
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleChangePassword = async (formData) => {
    setStatus({ type: '', message: '' })
    setIsSubmitting(true)

    try {
      const data = await changePasswordApi(formData)
      setStatus({ type: 'success', message: data.message || 'تم تغيير كلمة المرور بنجاح.' })
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login')
      } else {
        setStatus({ type: 'error', message: error.message || 'تعذر تغيير كلمة المرور.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

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
              <h1 className="text-2xl font-semibold tracking-tight">تغيير كلمة السر</h1>
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
          <h2 className="text-xl font-semibold">تغيير كلمة المرور</h2>
          <p className="mt-2 text-[#68776b]">اختر كلمة مرور قوية لا تستخدمها في مكان آخر.</p>

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

          <ChangePasswordForm isSubmitting={isSubmitting} onSubmit={handleChangePassword} />
        </section>
      </div>
    </main>
  )
}

export default ChangePassword