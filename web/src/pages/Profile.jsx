import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProfileForm from '../components/ProfileForm'
import ChangePasswordForm from '../components/ChangePasswordForm'
import { getMeApi, updateProfileApi, changePasswordApi } from '../services/authService'

function Profile() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [profileStatus, setProfileStatus] = useState({ type: '', message: '' })
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' })
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const navigate = useNavigate()

  // جلب بيانات المستخدم الحالي
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getMeApi()
        setUser(data.user)
      } catch (error) {
        if (error.response?.status === 401) {
          navigate('/login')
        } else {
          setProfileStatus({ type: 'error', message: error.message })
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [navigate])

  const handleUpdateProfile = async (formData) => {
    setProfileStatus({ type: '', message: '' })
    setIsSavingProfile(true)

    try {
      const data = await updateProfileApi(formData)
      setUser(data.user)
      setProfileStatus({ type: 'success', message: data.message || 'تم تحديث الملف الشخصي بنجاح.' })
    } catch (error) {
      setProfileStatus({ type: 'error', message: error.message || 'تعذر تحديث الملف الشخصي.' })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (formData) => {
    setPasswordStatus({ type: '', message: '' })
    setIsSavingPassword(true)

    try {
      const data = await changePasswordApi(formData)
      setPasswordStatus({ type: 'success', message: data.message || 'تم تغيير كلمة المرور بنجاح.' })
    } catch (error) {
      setPasswordStatus({ type: 'error', message: error.message || 'تعذر تغيير كلمة المرور.' })
    } finally {
      setIsSavingPassword(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    navigate('/login')
  }

  if (isLoading) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#f5f1e4] text-[#123d32]">
        <p className="text-lg">جارٍ التحميل...</p>
      </main>
    )
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f5f1e4] px-6 py-10 text-right text-[#123d32]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img alt="شعار برنامج الحياة" className="h-14 w-14 rounded-2xl object-cover shadow-md shadow-emerald-900/15" src="/logo.png" />
            <div>
              <p className="text-sm font-bold tracking-[0.12em] text-[#b87a17]">برنامج الحياة</p>
              <h1 className="text-2xl font-semibold tracking-tight">ملفي الشخصي</h1>
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

        <div className="grid gap-6 lg:grid-cols-2">
          {/* قسم تحديث البيانات */}
          <section className="rounded-3xl border border-[#dfd2b7] bg-[#fffdf7] p-8 shadow-xl shadow-[#123d32]/10">
            <h2 className="text-xl font-semibold">البيانات الشخصية</h2>
            <p className="mt-2 text-[#68776b]">{user?.email}</p>

            {profileStatus.message && (
              <div
                className={`mt-6 rounded-xl px-4 py-3 text-sm ${
                  profileStatus.type === 'success' ? 'bg-[#e0f0e3] text-[#236247]' : 'bg-[#fbe5dc] text-[#a44e20]'
                }`}
                role="alert"
              >
                {profileStatus.message}
              </div>
            )}

            <ProfileForm isSubmitting={isSavingProfile} onSubmit={handleUpdateProfile} user={user} />
          </section>

          {/* قسم تغيير كلمة المرور */}
          <section className="rounded-3xl border border-[#dfd2b7] bg-[#fffdf7] p-8 shadow-xl shadow-[#123d32]/10">
            <h2 className="text-xl font-semibold">تغيير كلمة المرور</h2>
            <p className="mt-2 text-[#68776b]">اختر كلمة مرور قوية لا تستخدمها في مكان آخر.</p>

            {passwordStatus.message && (
              <div
                className={`mt-6 rounded-xl px-4 py-3 text-sm ${
                  passwordStatus.type === 'success' ? 'bg-[#e0f0e3] text-[#236247]' : 'bg-[#fbe5dc] text-[#a44e20]'
                }`}
                role="alert"
              >
                {passwordStatus.message}
              </div>
            )}

            <ChangePasswordForm isSubmitting={isSavingPassword} onSubmit={handleChangePassword} />
          </section>
        </div>
      </div>
    </main>
  )
}

export default Profile