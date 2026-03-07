import { useState } from "react"
import { ArrowLeft, Lock } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button, Form, Input, message } from "antd"
import { useAppDispatch } from "../store"
import { clearAuth } from "../store/authSlice"
import client from "../api/client"
import type { ChangePasswordResponse } from "../types/auth"
import { PASSWORD_RULE_TEXT, isStrongPassword } from "../utils/password"

type ChangePasswordFormValues = {
  oldPass: string
  newPass: string
  confirmPass: string
}

const ChangePassword = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const onFinish = async (values: ChangePasswordFormValues) => {
    const oldPassword = values.oldPass.trim()
    const newPassword = values.newPass.trim()
    const confirmPassword = values.confirmPass.trim()
    if (!oldPassword || !newPassword || !confirmPassword) return
    if (oldPassword === newPassword) {
      message.warning("新密码不能与原密码一致")
      return
    }
    if (!isStrongPassword(newPassword)) {
      message.warning(PASSWORD_RULE_TEXT)
      return
    }
    if (!isStrongPassword(confirmPassword)) {
      message.warning(PASSWORD_RULE_TEXT)
      return
    }
    if (newPassword !== confirmPassword) {
      message.warning("两次输入的密码不一致")
      return
    }
    try {
      setLoading(true)
      const { data } = await client.post<ChangePasswordResponse>("/v1/auth/change-password/", {
        old_password: oldPassword,
        new_password1: newPassword,
        new_password2: confirmPassword,
      })
      if (!data.success) {
        message.error(data.message || "修改失败")
        return
      }
      dispatch(clearAuth())
      message.success(data.message || "修改成功，请重新登录")
      navigate("/login", { replace: true })
    } catch (e) {
      const err = e as { response?: { data?: { message?: string; error?: { message?: string } } } }
      message.error(err.response?.data?.error?.message || err.response?.data?.message || "修改失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center text-slate-800 relative overflow-hidden">
      <div className="aurora-bg" />

      <div className="w-full max-w-md glass-panel-light rounded-2xl p-8 shadow-2xl border-t border-white/50 relative z-10">
        <div className="liquid-glass" />
        <div className="relative mb-6 flex items-center justify-center">
          <Button
            type="link"
            htmlType="button"
            className="absolute left-0 flex items-center gap-1 p-0 text-slate-700"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
            去登录
          </Button>
          <h2 className="text-2xl font-semibold text-center text-slate-800">修改密码</h2>
        </div>
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
            dependencies={["oldPass"]}
            extra={<span className="text-xs text-slate-500">{PASSWORD_RULE_TEXT}</span>}
            rules={[
              { required: true, message: "请输入新密码" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value) {
                    return Promise.resolve()
                  }
                  if (value === getFieldValue("oldPass")) {
                    return Promise.reject(new Error("新密码不能与原密码一致"))
                  }
                  if (!value || isStrongPassword(value)) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error(PASSWORD_RULE_TEXT))
                },
              }),
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
            extra={<span className="text-xs text-slate-500">{PASSWORD_RULE_TEXT}</span>}
            rules={[
              { required: true, message: "请再次输入新密码" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value) {
                    return Promise.resolve()
                  }
                  if (!isStrongPassword(value)) {
                    return Promise.reject(new Error(PASSWORD_RULE_TEXT))
                  }
                  if (getFieldValue("newPass") !== value) {
                    return Promise.reject(new Error("两次输入的密码不一致"))
                  }
                  return Promise.resolve()
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
    </div>
  )
}

export default ChangePassword
