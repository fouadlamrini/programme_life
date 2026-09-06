import { useState } from 'react'

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  sex: '',
  country: 'Morocco',
  city: 'Nador',
}

function RegisterForm({ onSubmit, isSubmitting }) {
  const [form, setForm] = useState(initialForm)
  const [passwordError, setPasswordError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordError('')
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (form.password !== form.confirmPassword) {
      setPasswordError('كلمتا المرور غير متطابقتين.')
      return
    }

    const registrationData = { ...form }
    delete registrationData.confirmPassword
    onSubmit(registrationData)
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#40584b]">الاسم الأول</span>
          <input
            className="w-full rounded-xl border border-[#dfd2b7] bg-white px-4 py-3 text-[#123d32] outline-none transition placeholder:text-[#9aa496] focus:border-[#c38a24] focus:ring-4 focus:ring-[#f7e4b4]"
            name="firstName"
            onChange={handleChange}
            placeholder="أدخل اسمك الأول"
            required
            type="text"
            value={form.firstName}
          />
        </label>

        <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#40584b]">اسم العائلة</span>
          <input
            className="w-full rounded-xl border border-[#dfd2b7] bg-white px-4 py-3 text-[#123d32] outline-none transition placeholder:text-[#9aa496] focus:border-[#c38a24] focus:ring-4 focus:ring-[#f7e4b4]"
            name="lastName"
            onChange={handleChange}
            placeholder="أدخل اسم العائلة"
            required
            type="text"
            value={form.lastName}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-[#40584b]">البريد الإلكتروني</span>
        <input
          className="w-full rounded-xl border border-[#dfd2b7] bg-white px-4 py-3 text-[#123d32] outline-none transition placeholder:text-[#9aa496] focus:border-[#c38a24] focus:ring-4 focus:ring-[#f7e4b4]"
          name="email"
          onChange={handleChange}
          placeholder="name@example.com"
          required
          type="email"
          value={form.email}
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#40584b]">كلمة المرور</span>
          <input
            className="w-full rounded-xl border border-[#dfd2b7] bg-white px-4 py-3 text-[#123d32] outline-none transition placeholder:text-[#9aa496] focus:border-[#c38a24] focus:ring-4 focus:ring-[#f7e4b4]"
            minLength={6}
            name="password"
            onChange={handleChange}
            placeholder="ستة أحرف على الأقل"
            required
            type="password"
            value={form.password}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#40584b]">تأكيد كلمة المرور</span>
          <input
            className={`w-full rounded-xl border bg-white px-4 py-3 text-[#123d32] outline-none transition placeholder:text-[#9aa496] focus:ring-4 focus:ring-[#f7e4b4] ${passwordError ? 'border-[#b94b32]' : 'border-[#dfd2b7] focus:border-[#c38a24]'}`}
            minLength={6}
            name="confirmPassword"
            onChange={handleChange}
            placeholder="أعد كتابة كلمة المرور"
            required
            type="password"
            value={form.confirmPassword}
          />
          {passwordError && <span className="mt-2 block text-sm text-[#b94b32]">{passwordError}</span>}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#40584b]">الجنس</span>
          <select
            className="w-full rounded-xl border border-[#dfd2b7] bg-white px-4 py-3 text-[#123d32] outline-none transition focus:border-[#c38a24] focus:ring-4 focus:ring-[#f7e4b4]"
            name="sex"
            onChange={handleChange}
            required
            value={form.sex}
          >
            <option disabled value="">اختر الجنس</option>
            <option value="homme">ذكر</option>
            <option value="femme">أنثى</option>
          </select>
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#40584b]">البلد</span>
          <input
            className="w-full rounded-xl border border-[#dfd2b7] bg-white px-4 py-3 text-[#123d32] outline-none transition placeholder:text-[#9aa496] focus:border-[#c38a24] focus:ring-4 focus:ring-[#f7e4b4]"
            name="country"
            onChange={handleChange}
            type="text"
            value={form.country}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#40584b]">المدينة</span>
          <input
            className="w-full rounded-xl border border-[#dfd2b7] bg-white px-4 py-3 text-[#123d32] outline-none transition placeholder:text-[#9aa496] focus:border-[#c38a24] focus:ring-4 focus:ring-[#f7e4b4]"
            name="city"
            onChange={handleChange}
            type="text"
            value={form.city}
          />
        </label>
      </div>

      <button
        className="w-full rounded-xl bg-[#174d3d] px-5 py-3.5 font-semibold text-[#fffdf7] transition hover:bg-[#b8731b] focus:outline-none focus:ring-4 focus:ring-[#f7e4b4] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}
      </button>
    </form>
  )
}

export default RegisterForm
