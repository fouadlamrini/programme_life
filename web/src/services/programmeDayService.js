import { api } from './authService'

export const getProgrammeDayApi = async () => {
  try {
    const response = await api.get('/programme-day/today')
    return response.data
  } catch (error) {
    const data = error.response?.data
    throw new Error(data?.message || 'تعذر جلب برنامج اليوم.', { cause: error })
  }
}