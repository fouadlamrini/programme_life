import { useState, useEffect } from 'react'
import { getCountriesWithCities } from '../services/locationsService'

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  sex: '',
  country: '',
  city: '',
}

function RegisterForm({ onSubmit, isSubmitting }) {
  const [form, setForm] = useState(initialForm)
  const [passwordError, setPasswordError] = useState('')
  const [countries, setCountries] = useState([])
  const [availableCities, setAvailableCities] = useState([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(true)

  // جلب البيانات وتحديد Morocco و Nador كـ Default صريح
  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoadingLocations(true)
      const data = await getCountriesWithCities()
      setCountries(data)

      // 1. البحث عن المغرب
      const moroccoData = data.find((c) => c.country.toLowerCase() === 'morocco')

      if (moroccoData) {
        const cities = moroccoData.cities || []
        // البحث عن Nador ضمن القائمة
        const defaultCity = cities.find((city) => city.toLowerCase() === 'nador') || cities[0] || 'Nador'

        // إعادة ترتيب المدن باش تكون Nador هي رقم 1 فـ القائمة
        const sortedCities = [defaultCity, ...cities.filter((c) => c !== defaultCity)]

        setAvailableCities(sortedCities)
        setForm((prev) => ({
          ...prev,
          country: moroccoData.country,
          city: defaultCity, // القيمة المحددة تلقائياً
        }))
      } else if (data.length > 0) {
        const firstCountry = data[0]
        setAvailableCities(firstCountry.cities || [])
        setForm((prev) => ({
          ...prev,
          country: firstCountry.country,
          city: firstCountry.cities[0] || '',
        }))
      }

      setIsLoadingLocations(false)
    }

    fetchLocations()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))

    if (name === 'password' || name === 'confirmPassword') {
      setPasswordError('')
    }
  }

  // عند تغيير الدولة يدوياً
  const handleCountryChange = (event) => {
    const selectedCountryName = event.target.value
    const selectedCountryData = countries.find((c) => c.country === selectedCountryName)
    const cities = selectedCountryData?.cities || []

    setAvailableCities(cities)
    setForm((prev) => ({
      ...prev,
      country: selectedCountryName,
      city: cities[0] || '',
    }))
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

      <div className="grid gap-5 sm:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#40584b]">الجنس</span>
          <select
            className="w-full rounded-xl border border-[#dfd2b7] bg-white px-4 py-3 text-[#123d32] outline-none transition focus:border-[#c38a24] focus:ring-4 focus:ring-[#f7e4b4]"
            name="sex"
            onChange={handleChange}
            required
            value={form.sex}
          >
            <option disabled value="">
              اختر الجنس
            </option>
            <option value="homme">ذكر</option>
            <option value="femme">أنثى</option>
          </select>
        </label>

        {/* 1. البلد على اليمين */}
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#40584b]">البلد</span>
          <select
            className="w-full rounded-xl border border-[#dfd2b7] bg-white px-4 py-3 text-[#123d32] outline-none transition focus:border-[#c38a24] focus:ring-4 focus:ring-[#f7e4b4] disabled:bg-gray-100"
            disabled={isLoadingLocations}
            name="country"
            onChange={handleCountryChange}
            required
            value={form.country}
          >
            {isLoadingLocations ? (
              <option value="">جارٍ التحميل...</option>
            ) : (
              countries.map((item) => (
                <option key={item.iso2 || item.country} value={item.country}>
                  {item.label}
                </option>
              ))
            )}
          </select>
        </label>

        {/* 2. المدينة على اليسار وتكون Nador هي الأولى المحددة */}
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#40584b]">المدينة</span>
          <select
            className="w-full rounded-xl border border-[#dfd2b7] bg-white px-4 py-3 text-[#123d32] outline-none transition focus:border-[#c38a24] focus:ring-4 focus:ring-[#f7e4b4] disabled:bg-gray-100"
            disabled={isLoadingLocations || !availableCities.length}
            name="city"
            onChange={handleChange}
            required
            value={form.city}
          >
            {isLoadingLocations ? (
              <option value="">جارٍ التحميل...</option>
            ) : (
              availableCities.map((cityName) => (
                <option key={cityName} value={cityName}>
                  {cityName}
                </option>
              ))
            )}
          </select>
        </label>
      </div>

      <button
        className="w-full rounded-xl bg-[#174d3d] px-5 py-3.5 font-semibold text-[#fffdf7] transition hover:bg-[#b8731b] focus:outline-none focus:ring-4 focus:ring-[#f7e4b4] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting || isLoadingLocations}
        type="submit"
      >
        {isSubmitting ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}
      </button>
    </form>
  )
}

export default RegisterForm