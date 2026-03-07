import { useEffect, useState } from "react"
import { ArrowLeft, Lock } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button, Form, Input, message } from "antd"

type ChangePasswordFormValues = {
  oldPass: string
  newPass: string
  confirmPass: string
}

const ChangePassword = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let t: number | undefined
    if (success) {
      t = window.setInterval(() => {
        setCountdown((s) => {
          if (s <= 1) {
            window.clearInterval(t)
            navigate("/login", { replace: true })
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => {
      if (t) window.clearInterval(t)
    }
  }, [success, navigate])

  const onFinish = async (values: ChangePasswordFormValues) => {
    try {
      setLoading(true)
      const { oldPass, newPass } = values
      if (!oldPass || !newPass) return
      await new Promise((resolve) => setTimeout(resolve, 1000))
      message.success("修改成功")
      setSuccess(true)
    } catch {
      message.error("修改失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center text-slate-800 relative overflow-hidden">
      <div className="aurora-bg" />
      <Button
        type="link"
        htmlType="button"
        className="absolute top-8 left-8 z-10 flex items-center gap-1 p-0 text-slate-700"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4" />
        返回
      </Button>

      <div className="w-full max-w-md glass-panel-light rounded-2xl p-8 shadow-2xl border-t border-white/50 relative z-10">
        <div className="liquid-glass" />
        <h2 className="text-2xl font-semibold mb-6 text-center text-slate-800">修改密码</h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          className="space-y-4"
        >
          <Form.Item
            name="oldPass"
            label={<span className="text-slate-600 font-medium">原密码</span>}
            rules={[{ required: true, message: "请输入原密码" }]}
          >
            <Input.Password
              placeholder="请输入原密码"
              prefix={<Lock className="w-4 h-4 text-slate-400" />}
              className="input-glass rounded-lg"
            />
          </Form.Item>

          <Form.Item
            name="newPass"
            label={<span className="text-slate-600 font-medium">新密码</span>}
            rules={[
              { required: true, message: "请输入新密码" },
              { min: 8, max: 16, message: "8-16位字符" },
              {
                pattern: /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/,
                message: "需包含数字、字母及特殊符号",
              },
            ]}
          >
            <Input.Password
              placeholder="请输入新密码"
              prefix={<Lock className="w-4 h-4 text-slate-400" />}
              className="input-glass rounded-lg"
            />
          </Form.Item>

          <Form.Item
            name="confirmPass"
            label={<span className="text-slate-600 font-medium">确认新密码</span>}
            dependencies={["newPass"]}
            rules={[
              { required: true, message: "请再次输入新密码" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPass") === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error("两次输入的密码不一致"))
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="请再次输入新密码"
              prefix={<Lock className="w-4 h-4 text-slate-400" />}
              className="input-glass rounded-lg"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className="rounded-lg h-12 text-lg font-medium shadow-lg shadow-blue-500/30"
            >
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </div>

      {success && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-panel-light p-8 rounded-2xl shadow-2xl text-center max-w-sm mx-4 bg-white/90 border border-white/60">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <span className="text-green-600 font-bold text-xl">✓</span>
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">密码修改成功</h3>
            <p className="text-sm text-slate-500 mb-2">请使用新密码重新登录</p>
            <p className="text-xs text-slate-400">正在跳转至登录页 ({countdown}s)...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChangePassword
