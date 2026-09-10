import { api } from './authService'

export const getSleepApi = async () => {
  try {
    const response = await api.get('/sleep')
    return response.data
  } catch (error) {
    const data = error.response?.data
    throw new Error(data?.message || 'تعذر جلب إعدادات النوم.', { cause: error })
  }
}

export const updateSleepApi = async (payload) => {
  try {
    const response = await api.patch('/sleep', payload)
    return response.data
  } catch (error) {
    const data = error.response?.data
    const validationMessage = data?.errors?.map((err) => err.msg).join(', ')
    throw new Error(validationMessage || data?.message || 'تعذر تحديث إعدادات النوم.', { cause: error })
  }
}