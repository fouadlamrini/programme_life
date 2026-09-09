import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoginForm from '../components/LoginForm'
import { loginApi } from '../services/authService'

function Login() {
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (formData) => {
    setStatus({ type: '', message: '' })
    setIsSubmitting(true)

    try {
      const data = await loginApi(formData)

      // حفظ Access Token فـ LocalStorage
      localStorage.setItem('accessToken', data.accessToken)
      setStatus({ type: 'success', message: data.message || 'تم تسجيل الدخول بنجاح.' })

      // توجيه المستخدم لصفحة الـ Dashboard
      navigate('/dashboard')
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'تعذر الاتصال بالخادم.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f5f1e4] px-5 py-10 text-right text-[#123d32] sm:px-8 lg:px-12">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="hidden lg:block">
          <p className="mb-6 text-sm font-bold tracking-[0.12em] text-[#b87a17]">برنامج الحياة</p>
          <h1 className="max-w-lg text-6xl font-semibold leading-[1.1] tracking-tight text-[#123d32]">
            اصنع إيقاعاً صحياً ليومك، يوماً بعد يوم.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-[#53665b]">
            سجّل دخولك وتابع برنامج حياتك اليومي في مكان واحد وهادئ.
          </p>
          <div className="mt-12 flex gap-3 text-sm text-slate-500">
            <span className="rounded-full bg-[#dcebdd] px-4 py-2 text-[#236247]">بسيط</span>
            <span className="rounded-full bg-[#f7e4b4] px-4 py-2 text-[#9a6512]">شخصي</span>
            <span className="rounded-full bg-[#f5d9bd] px-4 py-2 text-[#a44e20]">خاص</span>
          </div>
        </section>

        <section className="mx-auto w-full max-w-xl rounded-3xl border border-[#dfd2b7] bg-[#fffdf7] p-6 shadow-xl shadow-[#123d32]/10 sm:p-10">
          <div>
            <img
              alt="شعار برنامج الحياة"
              className="h-20 w-20 rounded-2xl object-cover shadow-md shadow-emerald-900/15"
              src="/logo.png"
            />
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-[#123d32]">تسجيل الدخول</h2>
            <p className="mt-2 text-[#68776b]">أهلاً بعودتك، سجّل دخولك للمتابعة.</p>
          </div>

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

          <LoginForm isSubmitting={isSubmitting} onSubmit={handleLogin} />

          <p className="mt-6 text-center text-sm text-[#68776b]">
            ليس لديك حساب؟{' '}
            <Link to="/register" className="font-semibold text-[#b8731b] hover:text-[#174d3d]">
              أنشئ حسابك
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}

export default Login