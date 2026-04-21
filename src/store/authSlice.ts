import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { AuthUser } from "../types/auth"

const CSRF_STORAGE_KEY = "csrf_token"
const LEGACY_TOKEN_STORAGE_KEY = "auth_token"

type AuthState = {
  token: string | null
  user: AuthUser | null
  remember: boolean
}

const getStoredToken = () => {
  try {
    return (
      localStorage.getItem(CSRF_STORAGE_KEY) ||
      sessionStorage.getItem(CSRF_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY) ||
      sessionStorage.getItem(LEGACY_TOKEN_STORAGE_KEY)
    )
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
      localStorage.setItem(CSRF_STORAGE_KEY, action.payload)
      localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY)
      sessionStorage.removeItem(CSRF_STORAGE_KEY)
      sessionStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY)
    },
    setAuth: (
      state,
      action: PayloadAction<{ token: string; user: AuthUser; remember: boolean }>
    ) => {
      state.token = action.payload.token
      state.user = action.payload.user
      state.remember = action.payload.remember
      if (action.payload.remember) {
        localStorage.setItem(CSRF_STORAGE_KEY, action.payload.token)
        localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY)
        sessionStorage.removeItem(CSRF_STORAGE_KEY)
        sessionStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY)
        localStorage.setItem("auth_user", JSON.stringify(action.payload.user))
      } else {
        localStorage.removeItem(CSRF_STORAGE_KEY)
        localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY)
        sessionStorage.setItem(CSRF_STORAGE_KEY, action.payload.token)
        sessionStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY)
        localStorage.removeItem("auth_user")
      }
    },
    clearAuth: (state) => {
      state.token = null
      state.user = null
      try {
        localStorage.removeItem(CSRF_STORAGE_KEY)
        localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY)
        sessionStorage.removeItem(CSRF_STORAGE_KEY)
        sessionStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY)
        localStorage.removeItem("auth_user")
      } catch {
        return
      }
    },
  },
})

export const { setToken, setAuth, clearAuth } = authSlice.actions
export default authSlice.reducer
