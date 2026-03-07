export type AuthUser = {
  id: number
  username: string
  display_name: string
  is_staff: boolean
  is_superuser: boolean
  last_login: string
  name?: string
}

export type LoginResponse = {
  success: boolean
  message: string
  data: {
    csrf_token: string
    user: AuthUser
  }
}

export type CsrfResponse = {
  success: boolean
  message: string
  data: {
    csrf_token: string
  }
}

export type LogoutResponse = {
  success: boolean
  message: string
  data: {
    authenticated: boolean
  }
}

export type ChangePasswordResponse = {
  success: boolean
  message: string
  data: {
    authenticated: boolean
  }
}
