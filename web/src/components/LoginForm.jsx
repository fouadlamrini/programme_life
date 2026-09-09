import { useState } from 'react'

const initialForm = {
  email: '',
  password: '',
}

function LoginForm({ onSubmit, isSubmitting }) {
  const [form, setForm] = useState(initialForm)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit(form)
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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

      <button
        className="w-full rounded-xl bg-[#174d3d] px-5 py-3.5 font-semibold text-[#fffdf7] transition hover:bg-[#b8731b] focus:outline-none focus:ring-4 focus:ring-[#f7e4b4] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
      </button>
    </form>
  )
}

export default LoginForm