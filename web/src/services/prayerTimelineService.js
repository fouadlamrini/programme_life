import { api } from './authService'

export const getPrayerTimelineApi = async (date) => {
  try {
    const response = await api.get(`/prayer-timeline/${date}`)
    return response.data
  } catch (error) {
    const data = error.response?.data
    throw new Error(data?.message || 'تعذر جلب الجدول الزمني المفصّل.', { cause: error })
  }
}