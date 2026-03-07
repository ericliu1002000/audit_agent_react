import { useState } from "react"
import { Eye, EyeOff, Lock, Phone } from "lucide-react"
import { Navigate, useNavigate } from "react-router-dom"
import { setAuth } from "../store/authSlice"
import { useAppDispatch, useAppSelector } from "../store"
import client from "../api/client"
import { Button, Checkbox, Input, Segmented, message } from "antd"

const Login = () => {
  const [tab, setTab] = useState<"code" | "password">("password")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [countdown, setCountdown] = useState(0)
  const token = useAppSelector((s) => s.auth.token)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  if (token) {
    return <Navigate to="/" replace />
  }

  const sendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      message.warning("请先输入有效手机号")
      return
    }
    if (countdown > 0) return
    try {
      await client.post("/auth/sendCode", { phone })
      message.success("验证码已发送")
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((s) => {
          if (s <= 1) {
            clearInterval(timer)
            return 0
          }
          return s - 1
        })
      }, 1000)
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      message.error(err.response?.data?.message || "发送失败")
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const phoneValue = phone.trim()
    const codeValue = code.trim()
    const passwordValue = password.trim()
    if (!phoneValue) {
      message.warning("请输入手机号")
      return
    }
    if (!/^1[3-9]\d{9}$/.test(phoneValue)) {
      message.warning("请输入有效手机号")
      return
    }
    if (tab === "code" && !codeValue) {
      message.warning("请输入验证码")
      return
    }
    if (tab === "password" && !passwordValue) {
      message.warning("请输入密码")
      return
    }
    const mockLoginData = {
      token: "mock-token",
      user: { name: "李杰", phone: phoneValue },
    }
    dispatch(
      setAuth({
        token: mockLoginData.token,
        user: mockLoginData.user,
        remember,
      })
    )
    navigate("/")
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
                手机号
              </label>
              <Input autoComplete="on"
                size="large"
                prefix={<Phone className="w-5 h-5 text-slate-400" />}
                className="input-glass w-full rounded-lg"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ height: 48 }}
              />
            </div>
            {tab === "code" ? (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  验证码
                </label>
                <div className="flex space-x-3">
                  <Input
                    size="large"
                    className="input-glass flex-1 rounded-lg"
                    placeholder="6位验证码"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    style={{ height: 48 }}
                  />
                  <Button
                    size="large"
                    onClick={sendCode}
                    disabled={countdown > 0}
                    style={{ height: 48, minWidth: 140 }}
                  >
                    {countdown > 0 ? `${countdown}s 后重试` : "获取验证码"}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  密码
                </label>
                <Input.Password
                  size="large"
                  prefix={<Lock className="w-5 h-5 text-slate-400" />}
                  className="input-glass w-full rounded-lg"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  iconRender={(visible) =>
                    visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />
                  }
                  style={{ height: 48 }}
                />
                <p className="text-xs text-slate-500 mt-1">
                  8-16位，含数字+字母+特殊符号
                </p>
              </div>
            )}
            {tab === "password" ? (
              <div className="flex items-center justify-between text-sm">
                <Checkbox
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="text-slate-600"
                >
                  记住密码
                </Checkbox>
                <Button type="link" className="p-0" htmlType="button" onClick={() => navigate("/change-password")}>
                  忘记密码？
                </Button>
              </div>
            ) : null}
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              className="w-full rounded-lg"
              style={{ height: 52 }}
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
