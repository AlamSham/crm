import { create } from "zustand"
import axiosInstance from "../lib/axiosInstance"

interface AuthState {
  accessToken: string | null
  adminId: string | null
  isAuthenticated: boolean
  setAuth: (token: string, adminId: string) => void
  logout: () => void
  refreshToken: () => Promise<string | null>
}

const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem("accessToken"),
  adminId: localStorage.getItem("adminId"),
  isAuthenticated: !!localStorage.getItem("accessToken"),

  setAuth: (token, adminId) => {
    localStorage.setItem("accessToken", token)
    localStorage.setItem("adminId", adminId)
    set({ accessToken: token, adminId, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("adminId")
    set({ accessToken: null, adminId: null, isAuthenticated: false })
    window.location.href = "/login"
  },

  refreshToken: async () => {
    try {
      const response = await axiosInstance.post("/refresh-token", {}, { withCredentials: true })
      const newToken = response.data.accessToken
      localStorage.setItem("accessToken", newToken)
      set({ accessToken: newToken, isAuthenticated: true })
      return newToken
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      set({ accessToken: null, isAuthenticated: false })
      localStorage.removeItem("accessToken")
      window.location.href = "/login"
      return null
    }
  },
}))

export default useAuthStore
