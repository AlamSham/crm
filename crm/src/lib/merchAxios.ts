import axios from 'axios'
import useMerchAuthStore from '@/store/useMerchAuthStore'

const merchAxios = axios.create({
  baseURL: 'http://localhost:5000/api/merch',
  withCredentials: true,
})

merchAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('merchAccessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

merchAxios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const { data } = await merchAxios.post('/refresh-token')
        const newToken = data?.accessToken
        if (newToken) {
          // update localStorage and store
          localStorage.setItem('merchAccessToken', newToken)
          const { setToken } = useMerchAuthStore.getState()
          setToken?.(newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return merchAxios(originalRequest)
        }
      } catch {
        // fall through to reject
      }
    }
    return Promise.reject(error)
  }
)

export default merchAxios
