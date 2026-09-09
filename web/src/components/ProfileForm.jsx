import { useState } from 'react'

function ProfileForm({ user, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    city: user?.city || '',
    country: user?.country || '',
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit(form)
  }

  return (
    <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#40584b]">الاسم الأول</span>
          <input
            className="w-full rounded-xl border border-[#dfd2b7] bg-white px-4 py-3 text-[#123d32] outline-none transition placeholder:text-[#9aa496] focus:border-[#c38a24] focus:ring-4 focus:ring-[#f7e4b4]"
            name="firstName"
            onChange={handleChange}
            placeholder="الاسم الأول"
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
            placeholder="اسم العائلة"
            required
            type="text"
            value={form.lastName}
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#40584b]">البلد</span>
          <input
            className="w-full rounded-xl border border-[#dfd2b7] bg-white px-4 py-3 text-[#123d32] outline-none transition placeholder:text-[#9aa496] focus:border-[#c38a24] focus:ring-4 focus:ring-[#f7e4b4]"
            name="country"
            onChange={handleChange}
            placeholder="البلد"
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
            placeholder="المدينة"
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
        {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
      </button>
    </form>
  )
}

export default ProfileForm