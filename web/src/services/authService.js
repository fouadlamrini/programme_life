import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// إرفاق الـ Access Token من LocalStorage لكل طلب
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const registerApi = async (formData) => {
  try {
    const response = await api.post('/auth/register', formData)
    return response.data
  } catch (error) {
    const data = error.response?.data
    const validationMessage = data?.errors?.map((err) => err.msg).join(', ')
    throw new Error(validationMessage || data?.message || 'تعذر إنشاء الحساب.', { cause: error })
  }
}

export const loginApi = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials)
    return response.data
  } catch (error) {
    const data = error.response?.data
    const validationMessage = data?.errors?.map((err) => err.msg).join(', ')
    throw new Error(validationMessage || data?.message || 'تعذر تسجيل الدخول.', { cause: error })
  }
}

export const getMeApi = async () => {
  try {
    const response = await api.get('/profile/me')
    return response.data
  } catch (error) {
    const data = error.response?.data
    throw new Error(data?.message || 'تعذر جلب بيانات الملف الشخصي.', { cause: error })
  }
}

export const updateProfileApi = async (profileData) => {
  try {
    const response = await api.put('/profile/me', profileData)
    return response.data
  } catch (error) {
    const data = error.response?.data
    const validationMessage = data?.errors?.map((err) => err.msg).join(', ')
    throw new Error(validationMessage || data?.message || 'تعذر تحديث الملف الشخصي.', { cause: error })
  }
}

export const changePasswordApi = async (passwordData) => {
  try {
    const response = await api.put('/profile/password', passwordData)
    return response.data
  } catch (error) {
    const data = error.response?.data
    const validationMessage = data?.errors?.map((err) => err.msg).join(', ')
    throw new Error(validationMessage || data?.message || 'تعذر تغيير كلمة المرور.', { cause: error })
  }
}

export const getActivitiesApi = async () => {
  try {
    const response = await api.get('/activities')
    return response.data
  } catch (error) {
    const data = error.response?.data
    throw new Error(data?.message || 'تعذر جلب الأنشطة.', { cause: error })
  }
}