import { useState, useEffect } from 'react'
import { getCountriesWithCities } from '../services/locationsService'

function ProfileForm({ user, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    country: user?.country || '',
    city: user?.city || '',
  })
  const [countries, setCountries] = useState([])
  const [availableCities, setAvailableCities] = useState([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(true)

  // جلب البلدان وربطها بقيم المستخدم الحالية
  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoadingLocations(true)
      const data = await getCountriesWithCities()
      setCountries(data)

      if (user?.country) {
        const matched = data.find((c) => c.country.toLowerCase() === user.country.toLowerCase())
        if (matched) {
          const cities = matched.cities || []
          const currentCity =
            cities.find((city) => city.toLowerCase() === user.city?.toLowerCase()) ||
            cities[0] ||
            user.city ||
            ''
          setAvailableCities([currentCity, ...cities.filter((c) => c !== currentCity)])
        }
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
  }, [user])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
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
        {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
      </button>
    </form>
  )
}

export default ProfileForm