import axios from 'axios'

const countriesNowApi = axios.create({
  baseURL: 'https://countriesnow.space/api/v0.1',
  timeout: 10000,
})

export const getCountriesWithCities = async () => {
  try {
    const response = await countriesNowApi.get('/countries')
    const countriesData = response.data?.data || []

    return countriesData.map((item) => ({
      ...item,
      label: item.country,
      cities: item.cities || [],
    }))
  } catch (error) {
    console.error('Error fetching countries:', error)
    return []
  }
}