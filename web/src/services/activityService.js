import { api } from './authService'

export const getActivitiesApi = async () => {
  try {
    const response = await api.get('/activities')
    return response.data
  } catch (error) {
    const data = error.response?.data
    throw new Error(data?.message || 'تعذر جلب الأنشطة.', { cause: error })
  }
}

export const getActivityApi = async (id) => {
  try {
    const response = await api.get(`/activities/${id}`)
    return response.data
  } catch (error) {
    const data = error.response?.data
    throw new Error(data?.message || 'تعذر جلب النشاط.', { cause: error })
  }
}

export const createActivityApi = async (activityData) => {
  try {
    const response = await api.post('/activities', activityData)
    return response.data
  } catch (error) {
    const data = error.response?.data
    const validationMessage = data?.errors?.map((err) => err.msg).join(', ')
    throw new Error(validationMessage || data?.message || 'تعذر إنشاء النشاط.', { cause: error })
  }
}

export const updateActivityApi = async (id, activityData) => {
  try {
    const response = await api.patch(`/activities/${id}`, activityData)
    return response.data
  } catch (error) {
    const data = error.response?.data
    const validationMessage = data?.errors?.map((err) => err.msg).join(', ')
    throw new Error(validationMessage || data?.message || 'تعذر تحديث النشاط.', { cause: error })
  }
}

export const deleteActivityApi = async (id) => {
  try {
    const response = await api.delete(`/activities/${id}`)
    return response.data
  } catch (error) {
    const data = error.response?.data
    throw new Error(data?.message || 'تعذر حذف النشاط.', { cause: error })
  }
}