import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
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