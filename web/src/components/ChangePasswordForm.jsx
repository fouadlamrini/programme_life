import { useState } from 'react'

const initialForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

function ChangePasswordForm({ onSubmit, isSubmitting }) {
  const [form, setForm] = useState(initialForm)
  const [passwordError, setPasswordError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))

    if (name === 'newPassword' || name === 'confirmPassword') {
      setPasswordError('')
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      setPasswordError('كلمتا المرور غير متطابقتين.')
      return
    }
    onSubmit(form)
  }

  return (
    <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-[#40584b]">كلمة المرور الحالية</span>
        <input
          className="w-full rounded-xl border border-[#dfd2b7] bg-white px-4 py-3 text-[#123d32] outline-none transition placeholder:text-[#9aa496] focus:border-[#c38a24] focus:ring-4 focus:ring-[#f7e4b4]"
          name="currentPassword"
          onChange={handleChange}
          placeholder="أدخل كلمة المرور الحالية"
          required
          type="password"
          value={form.currentPassword}
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#40584b]">كلمة المرور الجديدة</span>
          <input
            className="w-full rounded-xl border border-[#dfd2b7] bg-white px-4 py-3 text-[#123d32] outline-none transition placeholder:text-[#9aa496] focus:border-[#c38a24] focus:ring-4 focus:ring-[#f7e4b4]"
            minLength={6}
            name="newPassword"
            onChange={handleChange}
            placeholder="ستة أحرف على الأقل"
            required
            type="password"
            value={form.newPassword}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#40584b]">تأكيد كلمة المرور</span>
          <input
            className={`w-full rounded-xl border bg-white px-4 py-3 text-[#123d32] outline-none transition placeholder:text-[#9aa496] focus:ring-4 focus:ring-[#f7e4b4] ${
              passwordError ? 'border-[#b94b32]' : 'border-[#dfd2b7] focus:border-[#c38a24]'
            }`}
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
      </div>

      <button
        className="w-full rounded-xl bg-[#b8731b] px-5 py-3.5 font-semibold text-[#fffdf7] transition hover:bg-[#174d3d] focus:outline-none focus:ring-4 focus:ring-[#f7e4b4] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'جارٍ التغيير...' : 'تغيير كلمة المرور'}
      </button>
    </form>
  )
}

export default ChangePasswordForm