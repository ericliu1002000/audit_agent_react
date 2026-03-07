import type { PropsWithChildren } from "react"
import { useState } from "react"
import { BarChart2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  Avatar,
  Button,
  Dropdown,
  Form,
  Input,
  Layout,
  Modal,
  Upload,
  Result,
  Spin,
  Typography,
  message,
} from "antd"
import type { MenuProps } from "antd"
import { useAppDispatch, useAppSelector } from "../store"
import { clearAuth } from "../store/authSlice"
import client from "../api/client"
import { DownOutlined,SettingOutlined, UploadOutlined, UserOutlined, MessageOutlined } from "@ant-design/icons"
const DashboardLayout = ({ children }: PropsWithChildren) => {
  const user = useAppSelector((s) => s.auth.user)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [loading] = useState(false)
  const [showChangePwd, setShowChangePwd] = useState(false)
  const [changeLoading, setChangeLoading] = useState(false)
  const [changeSuccess, setChangeSuccess] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [form] = Form.useForm()
  const [showProfile, setShowProfile] = useState(false)
  const [profileForm] = Form.useForm()
  const email = (user && (user as Record<string, unknown>)["email"]) as string | undefined
  const phone = (user && (user as Record<string, unknown>)["phone"]) as string | undefined
  const dept = (user && (user as Record<string, unknown>)["dept"]) as string | undefined
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackForm] = Form.useForm()

  const dropdownItems: MenuProps["items"] = [
    {
      key: "profile",
      label: (
        <div className="flex flex-row items-center">
          <UserOutlined /> 个人中心
        </div>
      ),
      onClick: () => setShowProfile(true),
    },
    { type: "divider" },
    {
      key: "feedback",
      label: (
        <div className="flex flex-row items-center">
          <MessageOutlined /> 问题反馈
        </div>
      ),
      onClick: () => setShowFeedback(true),
    },
    { type: "divider" },
    {
      key: "change",
      label: (
        <div className="flex flex-row items-center">
          <SettingOutlined /> 修改密码
        </div>
      ),
      onClick: () => setShowChangePwd(true),
    },
    { type: "divider" },
    {
      key: "logout",
      danger: true,
      label: (
        <span className="flex items-center">
          <UploadOutlined /> 退出登录
        </span>
      ),
      onClick: () => {
        dispatch(clearAuth())
        navigate("/login", { replace: true })
      },
    },
  ]

  return (
    <Layout className="h-screen w-screen bg-slate-50 text-slate-700">
      <div className="aurora-bg-light" />
      <Layout.Header className="hidden header-glass-light items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <BarChart2 className="text-white w-5 h-5" />
          </div>
          <Typography.Text className="text-lg font-semibold text-slate-800 tracking-tight">
            FinAnalyst Pro
          </Typography.Text>
        </div>
        <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
          <div className="flex items-center space-x-3 cursor-pointer">
            <Avatar size={32} style={{ backgroundColor: "#334155" }}>
              {user?.name?.[0] || "张"}
            </Avatar>
            <Typography.Text className="text-slate-600">
              {user?.name || "李杰"} - 预算科 <DownOutlined className="w-3 h-3"/>
            </Typography.Text>
          </div>
        </Dropdown>
      </Layout.Header>
      <Layout className="bg-transparent h-full">
        <Layout.Content className="relative overflow-hidden flex flex-col content-bg-light h-full min-h-0">
          <Spin spinning={loading} description="数据加载中..." size="large" className="dashboard-spin-fill">
            <div className="h-full overflow-y-auto p-5 ">
              {children}
            </div>
          </Spin>
        </Layout.Content>
      </Layout>
      <Modal
        title="个人资料"
        open={showProfile}
        centered
        onCancel={() => {
          setShowProfile(false)
          profileForm.resetFields()
        }}
        onOk={() => profileForm.submit()}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <div className="mb-4 space-y-1">
          <Typography.Text type="secondary">
            登录账户：{user?.name || "未登录"}
          </Typography.Text>
          <br />
          <Typography.Text type="secondary">邮箱：{email || "未设置"}</Typography.Text>
          <br />
          <Typography.Text type="secondary">手机号：{phone || "未设置"}</Typography.Text>
          <br />
          <Typography.Text type="secondary">所属部门：{dept || "默认部门"}</Typography.Text>
        </div>
        <Form
          form={profileForm}
          layout="vertical"
          initialValues={{ nickname: user?.name || "" }}
          onFinish={() => {
            message.success("保存成功")
            setShowProfile(false)
          }}
        >
          <Form.Item
            label="昵称"
            name="nickname"
            rules={[{ required: true, message: "请输入昵称" }]}
          >
            <Input placeholder="请输入昵称" />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} placeholder="填写备注信息" />
          </Form.Item>
          <Form.Item label="头像" valuePropName="fileList" getValueFromEvent={(e) => e?.fileList}>
            <Upload listType="picture-card" beforeUpload={() => false} maxCount={1}>
              <div>上传头像</div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="问题反馈"
        open={showFeedback}
        centered
        onCancel={() => {
          setShowFeedback(false)
          feedbackForm.resetFields()
        }}
        onOk={() => feedbackForm.submit()}
        okText="提交"
        cancelText="取消"
        destroyOnHidden
      >
        <Form
          form={feedbackForm}
          layout="vertical"
          onFinish={() => {
            message.success("感谢反馈，我们会尽快处理")
            setShowFeedback(false)
          }}
        >
          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: "请输入标题" }]}
          >
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item
            label="描述"
            name="desc"
            rules={[{ required: true, message: "请输入描述" }]}
          >
            <Input.TextArea rows={4} placeholder="请详细描述问题" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="修改密码"
        open={showChangePwd}
        centered
        onCancel={() => {
          setShowChangePwd(false)
          setChangeSuccess(false)
          setCountdown(3)
          form.resetFields()
        }}
        footer={null}
        destroyOnHidden
      >
        {changeSuccess ? (
          <Result
            status="success"
            title="密码修改成功"
            subTitle={`请使用新密码重新登录，正在跳转(${countdown}s)...`}
          />
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={async (values) => {
              try {
                setChangeLoading(true)
                await client.post("/user/change-password", {
                  oldPass: values.oldPass,
                  newPass: values.newPass,
                })
                setChangeLoading(false)
                setChangeSuccess(true)
                const timer = window.setInterval(() => {
                  setCountdown((s) => {
                    if (s <= 1) {
                      window.clearInterval(timer)
                      setShowChangePwd(false)
                      navigate("/login", { replace: true })
                      return 0
                    }
                    return s - 1
                  })
                }, 1000)
              } catch (e) {
                setChangeLoading(false)
                const err = e as { response?: { data?: { message?: string } } }
                message.error(err.response?.data?.message || "修改失败")
              }
            }}
          >
            <Form.Item
              label="原密码"
              name="oldPass"
              rules={[{ required: true, message: "请输入原密码" }]}
            >
              <Input.Password size="large" placeholder="请输入原密码" />
            </Form.Item>
            <Form.Item
              label="新密码"
              name="newPass"
              rules={[
                { required: true, message: "请输入新密码" },
                { min: 8, message: "至少8位" },
                {
                  pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/,
                  message: "需包含数字、字母及特殊符号，8-16位",
                },
              ]}
            >
              <Input.Password size="large" placeholder="请输入新密码" />
            </Form.Item>
            <Form.Item
              label="确认新密码"
              name="confirmPass"
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
              <Input.Password size="large" placeholder="请再次输入新密码" />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={changeLoading}
            >
              确认修改
            </Button>
          </Form>
        )}
      </Modal>
    </Layout>
  )
}

export default DashboardLayout
