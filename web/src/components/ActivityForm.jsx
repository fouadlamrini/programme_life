import { useState } from 'react'
import {
  DAY_LABELS,
  DAY_ORDER,
  TYPE_LABELS,
  TIME_SLOT_LABELS,
  PRIORITY_LABELS,
} from '../constants/activityLabels'

const defaultForm = {
  title: '',
  durationMinutes: 30,
  type: 'OTHER',
  preferredTimeSlot: 'ANYTIME',
  priority: 'MEDIUM',
  repeatDays: DAY_ORDER,
}

function ActivityForm({ initialActivity = null, onSubmit, isSubmitting, apiError = '' }) {
  const [form, setForm] = useState(() =>
    initialActivity
      ? {
          title: initialActivity.title || '',
          durationMinutes: initialActivity.durationMinutes ?? 30,
          type: initialActivity.type || 'OTHER',
          preferredTimeSlot: initialActivity.preferredTimeSlot || 'ANYTIME',
          priority: initialActivity.priority || 'MEDIUM',
          repeatDays: initialActivity.repeatDays?.length ? [...initialActivity.repeatDays] : [...DAY_ORDER],
        }
      : { ...defaultForm, repeatDays: [...defaultForm.repeatDays] },
  )
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({
      ...currentForm,
      [name]: name === 'durationMinutes' ? Number(value) : value,
    }))
  }

  const toggleDay = (day) => {
    setForm((currentForm) => {
      const includes = currentForm.repeatDays.includes(day)
      const repeatDays = includes
        ? currentForm.repeatDays.filter((d) => d !== day)
        : [...currentForm.repeatDays, day]
      return { ...currentForm, repeatDays: [...new Set(repeatDays)].sort((a, b) => a - b) }
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    if (!form.title.trim()) {
      setError('عنوان النشاط مطلوب.')
      return
    }
    if (!form.durationMinutes || form.durationMinutes < 1 || form.durationMinutes > 1440) {
      setError('المدة يجب أن تكون بين 1 و 1440 دقيقة.')
      return
    }
    if (form.repeatDays.length === 0) {
      setError('اختر يوم تكرار واحد على الأقل.')
      return
    }

    onSubmit({
      ...form,
      title: form.title.trim(),
      repeatDays: [...new Set(form.repeatDays)].sort((a, b) => a - b),
    })
  }

  return (
    <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#40584b]">عنوان النشاط</span>
          <input
            className="w-full rounded-xl border border-[#dfd2b7] bg-white px-4 py-3 text-[#123d32] outline-none transition placeholder:text-[#9aa496] focus:border-[#c38a24] focus:ring-4 focus:ring-[#f7e4b4]"
            name="title"
            onChange={handleChange}
            placeholder="مثال: قراءة القرآن"
            value={form.title}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#40584b]">المدة (بالدقائق)</span>
          <input
            className="w-full rounded-xl border border-[#dfd2b7] bg-white px-4 py-3 text-[#123d32] outline-none transition placeholder:text-[#9aa496] focus:border-[#c38a24] focus:ring-4 focus:ring-[#f7e4b4]"
            max="1440"
            min="1"
            name="durationMinutes"
            onChange={handleChange}
            type="number"
            value={form.durationMinutes}
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#40584b]">النوع</span>
          <select
            className="w-full rounded-xl border border-[#dfd2b7] bg-white px-4 py-3 text-[#123d32] outline-none transition focus:border-[#c38a24] focus:ring-4 focus:ring-[#f7e4b4]"
            name="type"
            onChange={handleChange}
            value={form.type}
          >
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#40584b]">الخانة الزمنية المفضلة</span>
          <select
            className="w-full rounded-xl border border-[#dfd2b7] bg-white px-4 py-3 text-[#123d32] outline-none transition focus:border-[#c38a24] focus:ring-4 focus:ring-[#f7e4b4]"
            name="preferredTimeSlot"
            onChange={handleChange}
            value={form.preferredTimeSlot}
          >
            {Object.entries(TIME_SLOT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#40584b]">الأولوية</span>
          <select
            className="w-full rounded-xl border border-[#dfd2b7] bg-white px-4 py-3 text-[#123d32] outline-none transition focus:border-[#c38a24] focus:ring-4 focus:ring-[#f7e4b4]"
            name="priority"
            onChange={handleChange}
            value={form.priority}
          >
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-[#40584b]">أيام التكرار</legend>
        <div className="flex flex-wrap gap-2">
          {DAY_ORDER.map((day) => {
            const active = form.repeatDays.includes(day)
            return (
              <button
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-[#f7e4b4] ${
                  active
                    ? 'bg-[#174d3d] text-[#fffdf7]'
                    : 'border border-[#dfd2b7] bg-white text-[#68776b] hover:bg-[#f7e4b4]'
                }`}
                key={day}
                onClick={() => toggleDay(day)}
                type="button"
              >
                {DAY_LABELS[day]}
              </button>
            )
          })}
        </div>
      </fieldset>

      {error && (
        <p className="rounded-xl bg-[#fbe5dc] px-4 py-3 text-sm text-[#a44e20]" role="alert">
          {error}
        </p>
      )}

      {apiError && (
        <p className="rounded-xl bg-[#fbe5dc] px-4 py-3 text-sm text-[#a44e20]" role="alert">
          {apiError}
        </p>
      )}

      <button
        className="w-full rounded-xl bg-[#174d3d] px-5 py-3.5 font-semibold text-[#fffdf7] transition hover:bg-[#b8731b] focus:outline-none focus:ring-4 focus:ring-[#f7e4b4] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'جارٍ الحفظ...' : initialActivity ? 'حفظ التعديلات' : 'إضافة النشاط'}
      </button>
    </form>
  )
}

export default ActivityForm