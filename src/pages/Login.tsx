import { useEffect, useState } from "react"
import { Lock } from "lucide-react"
import { Navigate, useNavigate } from "react-router-dom"
import type { AxiosError } from "axios"
import { setAuth, setToken } from "../store/authSlice"
import { useAppDispatch, useAppSelector } from "../store"
import client from "../api/client"
import { Button, Checkbox, Input, message } from "antd"
import type { CsrfResponse, LoginResponse } from "../types/auth"
import { PASSWORD_RULE_TEXT, isStrongPassword } from "../utils/password"
import { UserOutlined, EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons"
let csrfInitPromise: Promise<CsrfResponse> | null = null

const requestCsrfToken = async () => {
  if (!csrfInitPromise) {
    csrfInitPromise = client
      .get<CsrfResponse>("/v1/auth/csrf/")
      .then((res) => res.data)
      .finally(() => {
        csrfInitPromise = null
      })
  }
  return csrfInitPromise
}

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [csrfLoading, setCsrfLoading] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const token = useAppSelector((s) => s.auth.token)
  const user = useAppSelector((s) => s.auth.user)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const getErrorMessage = (e: unknown) => {
    const err = e as AxiosError<{ message?: string; error?: { message?: string; details?: { reason?: string } } }>
    return err.response?.data?.error?.message || err.response?.data?.error?.details?.reason || err.response?.data?.message || "请求失败"
  }

  useEffect(() => {
    let active = true
    const fetchCsrfToken = async () => {
      if (token) return
      setCsrfLoading(true)
      try {
        const data = await requestCsrfToken()
        if (!active) return
        if (!data.success || !data.data?.csrf_token) {
          message.error(data.message || "初始化令牌失败")
          return
        }
        dispatch(setToken(data.data.csrf_token))
      } catch (e) {
        if (!active) return
        message.error(getErrorMessage(e) || "初始化令牌失败")
      } finally {
        if (active) {
          setCsrfLoading(false)
        }
      }
    }
    void fetchCsrfToken()
    return () => {
      active = false
    }
  }, [dispatch, token])

  if (token && user) {
    return <Navigate to="/" replace />
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const usernameValue = username.trim()
    const passwordValue = password.trim()
    if (!usernameValue) {
      message.warning("请输入用户名")
      return
    }
    if (!passwordValue) {
      message.warning("请输入密码")
      return
    }
    if (!isStrongPassword(passwordValue)) {
      message.warning(PASSWORD_RULE_TEXT)
      return
    }
    if (!token) {
      message.warning("令牌初始化中，请稍后重试")
      return
    }
    try {
      setLoginLoading(true)
      const { data } = await client.post<LoginResponse>(
        "/v1/auth/login/",
        { username: usernameValue, password: passwordValue },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      if (!data.success) {
        message.error(data.message || "登录失败")
        return
      }
      dispatch(
        setAuth({
          token: data.data.csrf_token,
          user: {
            ...data.data.user,
            name: data.data.user.display_name || data.data.user.username,
          },
          remember,
        })
      )
      message.success(data.message || "登录成功")
      navigate("/")
    } catch (e) {
      message.error(getErrorMessage(e) || "登录失败")
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center text-slate-800 relative overflow-hidden">
      <div className="aurora-bg" />
      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-center h-full gap-12 lg:gap-24 relative z-10">
        <div className="hidden lg:flex flex-col max-w-lg space-y-8 animate-fade-in-up">
          {/* <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-[#ff0000] font-bold">F</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">FinAnalyst Pro</h1>
          </div> */}
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-slate-800">
              智能驱动未来 <br /> 数据洞察商业价值
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              专为财务审计打造的智能分析平台。批量处理、深度归纳、精准决策。
            </p>
          </div>
        
        </div>

        <div className="w-full max-w-md glass-panel-light rounded-2xl p-8 shadow-2xl border-t border-white/50 relative overflow-hidden">
          <div className="liquid-glass" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-70"></div>
          <h2 className="text-2xl font-semibold mb-4 text-center text-slate-800">欢迎回来</h2>
          {/* <div className="mb-6">
            <div className="bg-slate-100 border border-slate-200 rounded-full p-1 shadow-sm seg-pill">
              <Segmented
                value={tab}
                onChange={(v) => setTab(v as "code" | "password")}
                options={[
                  { label: "密码登录", value: "password" },
                  { label: "验证码登录", value: "code" },
                ]}
                size="large"
                className="w-full"
              />
            </div>
          </div> */}

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                用户名
              </label>
              <Input autoComplete="on"
                size="large"
                prefix={<UserOutlined className="w-6 h-6 text-slate-600" />}
                className="input-glass w-full rounded-lg"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ height: 48 }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                密码
              </label>
              <Input.Password
                size="large"
                prefix={<Lock className="w-5 h-5 text-slate-600" />}
                className="input-glass w-full rounded-lg"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                iconRender={(visible) =>
                  visible ? <EyeInvisibleOutlined className="w-6 h-6 text-slate-600" /> : <EyeOutlined className="w-6 h-6 text-slate-600" />
                }
                style={{ height: 48 }}
                autoComplete="on"
              />
              <p className="mt-1 text-xs text-slate-500">{PASSWORD_RULE_TEXT}</p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <Checkbox
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="text-slate-600"
              >
                记住密码
              </Checkbox>
              {/* <Button type="link" className="p-0" htmlType="button" onClick={() => navigate("/change-password")}>
                忘记密码？
              </Button> */}
            </div>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              className="w-full rounded-lg"
              style={{ height: 52 }}
              loading={csrfLoading || loginLoading}
            >
              立即登录
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
