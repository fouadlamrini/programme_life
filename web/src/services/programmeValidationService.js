import { api } from './authService'

export const getProgrammeValidationApi = async (date) => {
  try {
    const response = await api.get(`/programme-validation/${date}`)
    return response.data
  } catch (error) {
    const data = error.response?.data
    throw new Error(data?.message || 'تعذر التحقق من البرنامج.', { cause: error })
  }
}