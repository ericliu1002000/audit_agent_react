import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

type User = {
  name: string
  phone: string
}

type AuthState = {
  token: string | null
  user: User | null
  remember: boolean
}

const getStoredToken = () => {
  try {
    return localStorage.getItem("auth_token")
  } catch {
    return null
  }
}

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("auth_user")
    return raw ? (JSON.parse(raw) as User) : null
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
    setAuth: (
      state,
      action: PayloadAction<{ token: string; user: User; remember: boolean }>
    ) => {
      state.token = action.payload.token
      state.user = action.payload.user
      state.remember = action.payload.remember
      if (action.payload.remember) {
        localStorage.setItem("auth_token", action.payload.token)
        localStorage.setItem("auth_user", JSON.stringify(action.payload.user))
      }
    },
    clearAuth: (state) => {
      state.token = null
      state.user = null
      try {
        localStorage.removeItem("auth_token")
        localStorage.removeItem("auth_user")
      } catch {
        return
      }
    },
  },
})

export const { setAuth, clearAuth } = authSlice.actions
export default authSlice.reducer
