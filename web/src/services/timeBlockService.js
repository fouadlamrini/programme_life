import { api } from './authService'

export const getTimeBlocksApi = async (date) => {
  try {
    const response = await api.get(`/daily-schedules/${date}/time-blocks`)
    return response.data
  } catch (error) {
    const data = error.response?.data
    throw new Error(data?.message || 'تعذر جلب الفقرات الزمنية.', { cause: error })
  }
}

export const createTimeBlockApi = async (date, timeBlockData) => {
  try {
    const response = await api.post(`/daily-schedules/${date}/time-blocks`, timeBlockData)
    return response.data
  } catch (error) {
    const data = error.response?.data
    const validationMessage = data?.errors?.map((err) => err.msg).join(', ')
    throw new Error(validationMessage || data?.message || 'تعذر إنشاء الفقرة الزمنية.', { cause: error })
  }
}

export const updateTimeBlockApi = async (date, blockId, timeBlockData) => {
  try {
    const response = await api.patch(`/daily-schedules/${date}/time-blocks/${blockId}`, timeBlockData)
    return response.data
  } catch (error) {
    const data = error.response?.data
    const validationMessage = data?.errors?.map((err) => err.msg).join(', ')
    throw new Error(validationMessage || data?.message || 'تعذر تحديث الفقرة الزمنية.', { cause: error })
  }
}

export const deleteTimeBlockApi = async (date, blockId) => {
  try {
    const response = await api.delete(`/daily-schedules/${date}/time-blocks/${blockId}`)
    return response.data
  } catch (error) {
    const data = error.response?.data
    throw new Error(data?.message || 'تعذر حذف الفقرة الزمنية.', { cause: error })
  }
}