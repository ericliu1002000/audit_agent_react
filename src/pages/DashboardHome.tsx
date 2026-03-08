import { useEffect, useState } from "react"
import {
  CheckCircle2,
  CloudUpload,
  FileSpreadsheet,
  Lightbulb,
  Sparkles,
  X,
} from "lucide-react"
import {
  Button,
  Card,
  Dropdown,
  Form,
  Input,
  Modal,
  Radio,
  Result,
  Tag,
  Typography,
  Upload,
  message,
} from "antd"
import type { UploadProps } from "antd"
import type { MenuProps } from "antd"
import { SettingOutlined, UploadOutlined, UserOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../store"
import { clearAuth } from "../store/authSlice"
import client from "../api/client"
import type { ChangePasswordResponse, LogoutResponse } from "../types/auth"
import { PASSWORD_RULE_TEXT, isStrongPassword } from "../utils/password"
import "./DashboardHome.audit.css"

const venueOptionsByCity: Record<string, string[]> = {
  天津: ["天津梅江会展中心", "国家会展中心(天津)"],
}
const FIXED_CITY = "天津"

const DashboardHome = () => {
  const user = useAppSelector((s) => s.auth.user)
  const token = useAppSelector((s) => s.auth.token)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [projectForm] = Form.useForm()
  const [changeForm] = Form.useForm()
  const [profileForm] = Form.useForm()
  const [feedbackForm] = Form.useForm()
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showChangePwd, setShowChangePwd] = useState(false)
  const [changeLoading, setChangeLoading] = useState(false)
  const [changeSuccess, setChangeSuccess] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const email = (user && (user as Record<string, unknown>)["email"]) as string | undefined
  const phone = (user && (user as Record<string, unknown>)["phone"]) as string | undefined
  const dept = (user && (user as Record<string, unknown>)["dept"]) as string | undefined

  useEffect(() => {
    projectForm.setFieldsValue({
      city: FIXED_CITY,
      projectType: "临时展会",
      venue: "天津梅江会展中心",
    })
    const timer = window.setTimeout(() => {
      setUploadedFile({ name: "展会预算清单_2024.xlsx", size: "2.4 MB" })
    }, 800)
    return () => {
      window.clearTimeout(timer)
    }
  }, [projectForm])

  useEffect(() => {
    if (!token) return
    // const wsClient = getWebSocketClient()
    // wsClient.connect()
  }, [token])

  const currentVenueOptions = venueOptionsByCity[FIXED_CITY] || []

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
    // { type: "divider" },
    // {
    //   key: "feedback",
    //   label: (
    //     <div className="flex flex-row items-center">
    //       <MessageOutlined /> 问题反馈
    //     </div>
    //   ),
    //   onClick: () => setShowFeedback(true),
    // },
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
        Modal.confirm({
          title: "退出登录",
          content: "确认退出当前账号吗？",
          centered: true,
          okText: "确定",
          cancelText: "取消",
          onOk: async () => {
            try {
              const { data } = await client.post<LogoutResponse>("/v1/auth/logout/", {})
              if (!data.success) {
                message.error(data.message || "退出失败")
                return
              }
              message.success(data.message || "已退出登录")
              dispatch(clearAuth())
              navigate("/login", { replace: true })
            } catch (e) {
              const err = e as { response?: { data?: { message?: string; error?: { message?: string } } } }
              message.error(err.response?.data?.error?.message || err.response?.data?.message || "退出失败")
            }
          },
        })
      },
    },
  ]

  const uploadProps: UploadProps = {
    showUploadList: false,
    multiple: false,
    accept: ".xlsx,.xls,.pdf",
    beforeUpload(file) {
      const sizeInMb = file.size / 1024 / 1024
      if (sizeInMb > 50) {
        message.error("单个文件最大支持50MB")
        return Upload.LIST_IGNORE
      }
      setUploadedFile({
        name: file.name,
        size: `${sizeInMb.toFixed(1)} MB`,
      })
      message.success("文件已添加")
      return false
    },
  }

  const startAnalysis = () => {
    if (!uploadedFile) return
    navigate("/audit-analysis")
  }

  return (
    <>
      <div className="audit-home animate-fade-in">
        <div className="audit-home-layout">
          <Card className="audit-left-panel" variant="borderless">
          <div className="flex items-center gap-3 mb-6">
            <div className="audit-brand-icon">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <Typography.Title level={4} className="!mb-0">
                津沽评审
              </Typography.Title>
              <Typography.Text className="text-xs text-slate-400">智能展会预算评审系统</Typography.Text>
            </div>
          </div>
          <Form form={projectForm} layout="vertical" className="audit-config-form">
            <Form.Item label="城市" name="city">
              <Radio.Group className="audit-venue-group">
                <Radio value={FIXED_CITY}>天津</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="项目性质" name="projectType">
              <Radio.Group className="audit-venue-group">
                <Radio value="临时展会">临时展会</Radio>
                <Radio value="常设陈列">常设陈列</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="目标场馆" name="venue">
              <Radio.Group className="audit-venue-group">
                {currentVenueOptions.map((venue) => (
                  <Radio key={venue} value={venue}>
                    {venue}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>
          </Form>
              <div className="audit-user">
                <div className="audit-user-avatar">{user?.name?.[0] || "审"}</div>
                <div className="audit-user-main">
                  <p className="text-sm font-medium text-slate-700">{user?.name || "审计员"}</p>
                  <p className="text-xs text-slate-400">{dept || "天津智源沄析人工智能科技有限责任公司"}</p>
                </div>
                            <Dropdown menu={{ items: dropdownItems }} placement="bottomRight" classNames={{ root: "audit-user-dropdown" }}>
                <Button type="text" shape="circle" icon={<SettingOutlined className="w-5 h-5" />} />
                </Dropdown>
              </div>
         
          </Card>

          <div className="audit-right-panel">
            <div className="audit-upload-state">
              <div className="text-center mb-10">
                <div className="audit-center-icon">
                  <Lightbulb className="w-8 h-8 text-blue-700" />
                </div>
                <Typography.Title level={2} className="!mb-2">
                  智能预算评审
                </Typography.Title>
                <Typography.Text className="text-slate-500">基于AI大模型分析展会预算，智能比对价格数据</Typography.Text>
              </div>

              <Upload.Dragger {...uploadProps} className="audit-uploader">
                <div className="audit-upload-core">
                  <div className="audit-upload-icon-wrap">
                    <CloudUpload className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">上传预算文件</h3>
                  <p className="text-slate-500 mb-6">拖拽文件到此处或点击上传</p>
                  <div className="flex justify-center gap-3 mb-6">
                    <Tag color="success" className="!px-3 !py-1 !rounded-lg !text-sm">
                      Excel
                    </Tag>
                    <Tag color="error" className="!px-3 !py-1 !rounded-lg !text-sm">
                      PDF
                    </Tag>
                  </div>
                  <p className="text-xs text-slate-400">支持 .xlsx, .xls, .pdf 格式，单个文件最大50MB</p>
                </div>
              </Upload.Dragger>

              {uploadedFile && (
                <div className="audit-file-card">
                  <div className="flex items-center gap-3">
                    <div className="audit-file-ok">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{uploadedFile.name}</p>
                      <p className="text-xs text-slate-400">{uploadedFile.size} · 已上传</p>
                    </div>
                  </div>
                  <Button
                    type="text"
                    shape="circle"
                    icon={<X className="w-4 h-4" />}
                    onClick={() => setUploadedFile(null)}
                  />
                </div>
              )}

              <div className="text-center mt-8">
                <Button
                  type="primary"
                  size="large"
                  className="audit-analyze-btn"
                  disabled={!uploadedFile}
                  icon={<Sparkles className="w-4 h-4" />}
                  onClick={startAnalysis}
                >
                  开始智能分析
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
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
          <Typography.Text type="secondary">登录账户：{user?.name || "未登录"}</Typography.Text>
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
          <Form.Item label="昵称" name="nickname" rules={[{ required: true, message: "请输入昵称" }]}>
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
          <Form.Item label="标题" name="title" rules={[{ required: true, message: "请输入标题" }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item label="描述" name="desc" rules={[{ required: true, message: "请输入描述" }]}>
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
          changeForm.resetFields()
        }}
        footer={null}
        destroyOnHidden
      >
        {changeSuccess ? (
          <Result status="success" title="密码修改成功" subTitle={`请使用新密码重新登录，正在跳转(${countdown}s)...`} />
        ) : (
          <Form
            form={changeForm}
            layout="vertical"
            onFinish={async (values) => {
              const oldPassword = values.oldPass?.trim()
              const newPassword = values.newPass?.trim()
              const confirmPassword = values.confirmPass?.trim()
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
                setChangeLoading(true)
                const { data } = await client.post<ChangePasswordResponse>("/v1/auth/change-password/", {
                  old_password: oldPassword,
                  new_password1: newPassword,
                  new_password2: confirmPassword,
                })
                if (!data.success) {
                  message.error(data.message || "修改失败")
                  return
                }
                setChangeSuccess(true)
                dispatch(clearAuth())
                message.success(data.message || "修改成功，请重新登录")
                setShowChangePwd(false)
                navigate("/login", { replace: true })
              } catch (e) {
                const err = e as { response?: { data?: { message?: string; error?: { message?: string } } } }
                message.error(err.response?.data?.error?.message || err.response?.data?.message || "修改失败")
              } finally {
                setChangeLoading(false)
              }
            }}
          >
            <Form.Item label="原密码" name="oldPass" rules={[{ required: true, message: "请输入原密码" }]}>
              <Input.Password size="large" placeholder="请输入原密码" />
            </Form.Item>
            <Form.Item
              label="新密码"
              name="newPass"
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
              <Input.Password size="large" placeholder="请输入新密码" />
            </Form.Item>
            <Form.Item
              label="确认新密码"
              name="confirmPass"
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
              <Input.Password size="large" placeholder="请再次输入新密码" />
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={changeLoading}>
              确认修改
            </Button>
          </Form>
        )}
      </Modal>
    </>
  )
}

export default DashboardHome
