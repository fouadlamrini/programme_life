import { Link, useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    navigate('/login')
  }

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
          <p className="mt-2 text-[#68776b]">هذه الصفحة جاهزة لاستقبال برنامجك اليومي قريباً.</p>
        </section>
      </div>
    </main>
  )
}

export default Dashboard