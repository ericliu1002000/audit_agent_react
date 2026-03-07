import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { AuthUser } from "../types/auth"

type AuthState = {
  token: string | null
  user: AuthUser | null
  remember: boolean
}

const getStoredToken = () => {
  try {
    return localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
  } catch {
    return null
  }
}

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("auth_user")
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

const initialState: AuthState = {
  token: getStoredToken(),
  user: getStoredUser(),
  remember: true,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload
      localStorage.setItem("auth_token", action.payload)
      sessionStorage.removeItem("auth_token")
    },
    setAuth: (
      state,
      action: PayloadAction<{ token: string; user: AuthUser; remember: boolean }>
    ) => {
      state.token = action.payload.token
      state.user = action.payload.user
      state.remember = action.payload.remember
      if (action.payload.remember) {
        localStorage.setItem("auth_token", action.payload.token)
        sessionStorage.removeItem("auth_token")
        localStorage.setItem("auth_user", JSON.stringify(action.payload.user))
      } else {
        localStorage.removeItem("auth_token")
        sessionStorage.setItem("auth_token", action.payload.token)
        localStorage.removeItem("auth_user")
      }
    },
    clearAuth: (state) => {
      state.token = null
      state.user = null
      try {
        localStorage.removeItem("auth_token")
        sessionStorage.removeItem("auth_token")
        localStorage.removeItem("auth_user")
      } catch {
        return
      }
    },
  },
})

export const { setToken, setAuth, clearAuth } = authSlice.actions
export default authSlice.reducer
