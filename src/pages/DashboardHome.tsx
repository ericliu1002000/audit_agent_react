import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  CircleGauge,
  CloudUpload,
  Download,
  FileSpreadsheet,
  Lightbulb,
  Sparkles,
  TrendingDown,
  TriangleAlert,
  X,
} from "lucide-react"
import {
  Button,
  Card,
  Dropdown,
  Form,
  Input,
  List,
  Modal,
  Progress,
  Radio,
  Result,
  Select,
  Statistic,
  Steps,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from "antd"
import type { UploadProps } from "antd"
import type { MenuProps } from "antd"
import type { ColumnsType } from "antd/es/table"
import { MessageOutlined, SettingOutlined, UploadOutlined, UserOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../store"
import { clearAuth } from "../store/authSlice"
import client from "../api/client"
import "./DashboardHome.audit.css"

type ViewState = "upload" | "processing" | "result"
type AmountStatus = "normal" | "warning" | "danger"

type AuditRow = {
  key: number
  index: number
  item: string
  declared: number
  ai: number
  status: AmountStatus
}

type AuditIssue = {
  key: number
  title: string
  level: "异常" | "警告"
  rowIndex: number
  declared: number
  suggestion: number
  analysis: string
}

const auditRows: AuditRow[] = [
  { key: 1, index: 1, item: "展台搭建费", declared: 180000, ai: 165000, status: "normal" },
  { key: 2, index: 2, item: "展板制作费", declared: 45000, ai: 42000, status: "normal" },
  { key: 3, index: 3, item: "音响设备租赁", declared: 68000, ai: 65000, status: "normal" },
  { key: 4, index: 4, item: "灯光设备租赁", declared: 52000, ai: 50000, status: "normal" },
  { key: 5, index: 5, item: "物流运输费", declared: 35000, ai: 32000, status: "warning" },
  { key: 6, index: 6, item: "人工安装费", declared: 48000, ai: 38000, status: "warning" },
  { key: 7, index: 7, item: "P3 LED屏幕租赁", declared: 150000, ai: 84000, status: "warning" },
  { key: 8, index: 8, item: "舞台搭建费", declared: 200000, ai: 120000, status: "danger" },
  { key: 9, index: 9, item: "空调租赁费", declared: 28000, ai: 26000, status: "normal" },
  { key: 10, index: 10, item: "VIP接待室布置", declared: 85000, ai: 45000, status: "danger" },
  { key: 11, index: 11, item: "地毯铺设费", declared: 18000, ai: 16500, status: "normal" },
  { key: 12, index: 12, item: "安保安检服务", declared: 36000, ai: 34000, status: "normal" },
  { key: 13, index: 13, item: "清洁卫生服务", declared: 22000, ai: 18000, status: "warning" },
  { key: 14, index: 14, item: "开幕式花篮", declared: 15000, ai: 5000, status: "danger" },
  { key: 15, index: 15, item: "办公设备租赁", declared: 12000, ai: 11000, status: "normal" },
]

const auditIssues: AuditIssue[] = [
  {
    key: 1,
    title: "舞台搭建费异常",
    level: "异常",
    rowIndex: 8,
    declared: 200000,
    suggestion: 80000,
    analysis: "该费用超出天津市财政标准基准价150%，且高于市场平均价80%。",
  },
  {
    key: 2,
    title: "VIP接待室布置异常",
    level: "异常",
    rowIndex: 10,
    declared: 85000,
    suggestion: 40000,
    analysis: "该费用超出天津市财政标准200%，装饰用品采购价高于市场价3倍。",
  },
  {
    key: 3,
    title: "开幕式花篮价格虚高",
    level: "异常",
    rowIndex: 14,
    declared: 15000,
    suggestion: 10000,
    analysis: "花篮采购费用超出市场价200%，单支花篮均价偏高。",
  },
  {
    key: 4,
    title: "P3 LED屏幕租赁偏高",
    level: "警告",
    rowIndex: 7,
    declared: 150000,
    suggestion: 66000,
    analysis: "LED屏幕租赁单价高于天津市场均价，建议按面积重估。",
  },
  {
    key: 5,
    title: "人工安装费偏高",
    level: "警告",
    rowIndex: 6,
    declared: 48000,
    suggestion: 10000,
    analysis: "人工费用高于标准工时核算结果，建议复核班组报价。",
  },
  {
    key: 6,
    title: "清洁卫生服务偏高",
    level: "警告",
    rowIndex: 13,
    declared: 22000,
    suggestion: 4000,
    analysis: "清洁服务费用高于同类展馆均价，建议按面积单价复核。",
  },
]

const formatCurrency = (value: number) => `¥${value.toLocaleString("zh-CN")}`

const venueOptionsByCity: Record<string, string[]> = {
  天津: ["天津梅江会展中心", "国家会展中心(天津)", "其他"],
}

const DashboardHome = () => {
  const user = useAppSelector((s) => s.auth.user)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [projectForm] = Form.useForm()
  const [changeForm] = Form.useForm()
  const [profileForm] = Form.useForm()
  const [feedbackForm] = Form.useForm()
  const selectedCity = Form.useWatch("city", projectForm)
  const [viewState, setViewState] = useState<ViewState>("upload")
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null)
  const [progress, setProgress] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [showProfile, setShowProfile] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showChangePwd, setShowChangePwd] = useState(false)
  const [changeLoading, setChangeLoading] = useState(false)
  const [changeSuccess, setChangeSuccess] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const progressTimer = useRef<number | null>(null)
  const stepTimer = useRef<number | null>(null)
  const finishTimer = useRef<number | null>(null)
  const email = (user && (user as Record<string, unknown>)["email"]) as string | undefined
  const phone = (user && (user as Record<string, unknown>)["phone"]) as string | undefined
  const dept = (user && (user as Record<string, unknown>)["dept"]) as string | undefined

  const totals = useMemo(() => {
    const declared = auditRows.reduce((sum, row) => sum + row.declared, 0)
    const ai = auditRows.reduce((sum, row) => sum + row.ai, 0)
    return {
      declared,
      ai,
      reduction: declared - ai,
      ratio: Math.round(((declared - ai) / declared) * 100),
    }
  }, [])

  const clearTimers = () => {
    if (progressTimer.current) {
      window.clearInterval(progressTimer.current)
      progressTimer.current = null
    }
    if (stepTimer.current) {
      window.clearInterval(stepTimer.current)
      stepTimer.current = null
    }
    if (finishTimer.current) {
      window.clearTimeout(finishTimer.current)
      finishTimer.current = null
    }
  }

  useEffect(() => {
    projectForm.setFieldsValue({
      city: "天津",
      projectType: "临时展会",
      venue: "天津梅江会展中心",
    })
    const timer = window.setTimeout(() => {
      setUploadedFile({ name: "展会预算清单_2024.xlsx", size: "2.4 MB" })
    }, 800)
    return () => {
      window.clearTimeout(timer)
      clearTimers()
    }
  }, [projectForm])

  const currentVenueOptions = venueOptionsByCity[selectedCity || "天津"] || []

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
    clearTimers()
    setViewState("processing")
    setProgress(0)
    setActiveStep(0)

    progressTimer.current = window.setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(100, prev + Math.random() * 15)
        return Number(next.toFixed(0))
      })
    }, 220)

    stepTimer.current = window.setInterval(() => {
      setActiveStep((prev) => Math.min(prev + 1, 3))
    }, 700)

    finishTimer.current = window.setTimeout(() => {
      clearTimers()
      setProgress(100)
      setActiveStep(3)
      setViewState("result")
    }, 3200)
  }

  const resetView = () => {
    clearTimers()
    setProgress(0)
    setActiveStep(0)
    setViewState("upload")
  }

  const statusTag = (status: AmountStatus) => {
    if (status === "danger") {
      return (
        <span className="inline-flex items-center gap-2">
          <span className="audit-dot audit-dot-danger" />
          <Tag className="!m-0" color="error">
            异常
          </Tag>
        </span>
      )
    }
    if (status === "warning") {
      return (
        <span className="inline-flex items-center gap-2">
          <span className="audit-dot audit-dot-warning" />
          <Tag className="!m-0" color="warning">
            警告
          </Tag>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-2">
        <span className="audit-dot audit-dot-normal" />
        <Tag className="!m-0" color="success">
          正常
        </Tag>
      </span>
    )
  }

  const columns: ColumnsType<AuditRow> = [
    { title: "序号", dataIndex: "index", width: 78 },
    { title: "项目名称", dataIndex: "item", ellipsis: true },
    {
      title: "申报金额",
      dataIndex: "declared",
      width: 130,
      render: (value: number) => <span className="font-mono">{formatCurrency(value)}</span>,
    },
    {
      title: "AI审核价",
      dataIndex: "ai",
      width: 130,
      render: (value: number) => <span className="font-mono text-slate-500">{formatCurrency(value)}</span>,
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 120,
      render: (value: AmountStatus) => statusTag(value),
    },
  ]

  return (
    <>
      <div className="audit-home animate-fade-in">
        <div className="audit-home-layout">
          <Card className="audit-left-panel" bordered={false}>
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
              <Select
                size="large"
                options={[{ label: "天津", value: "天津" }]}
                onChange={(city) => {
                  const venues = venueOptionsByCity[city] || []
                  projectForm.setFieldValue("venue", venues[0])
                }}
              />
            </Form.Item>
            <Form.Item label="项目性质" name="projectType">
              <Select
                size="large"
                options={[
                  { label: "临时展会", value: "临时展会" },
                  { label: "常设陈列", value: "常设陈列" },
                ]}
              />
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
                  <p className="text-xs text-slate-400">{dept || "天津市审计局"}</p>
                </div>
                            <Dropdown menu={{ items: dropdownItems }} placement="bottomRight" overlayClassName="audit-user-dropdown">
                <Button type="text" shape="circle" icon={<SettingOutlined className="w-5 h-5" />} />
                </Dropdown>
              </div>
         
          </Card>

          <div className="audit-right-panel">
          {viewState === "upload" && (
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
          )}

          {viewState === "processing" && (
            <div className="audit-processing-state">
              <div className="audit-processing-orbit">
                <div className="audit-orbit-circle" />
                <div className="audit-orbit-core">
                  <BrainCircuit className="w-8 h-8 text-white" />
                </div>
              </div>
              <Typography.Title level={3} className="!mb-2">
                AI 智能分析中...
              </Typography.Title>
              <Typography.Text className="text-slate-500">正在对比市场数据与审计标准</Typography.Text>
              <div className="w-[360px] max-w-full mt-8">
                <Progress percent={progress} strokeColor={{ from: "#1d4ed8", to: "#1e40af" }} />
              </div>
              <div className="w-[380px] max-w-full mt-6">
                <Steps
                  direction="vertical"
                  size="small"
                  current={Math.min(activeStep, 2)}
                  items={[
                    { title: "解析预算文件..." },
                    { title: "比对天津市财政标准..." },
                    { title: "智能比对价格数据..." },
                  ]}
                />
              </div>
            </div>
          )}

          {viewState === "result" && (
            <div className="audit-result-state">
              <div className="audit-metric-grid">
                <Card bordered={false} className="audit-metric-card">
                  <Statistic
                    title="申报总额"
                    value={totals.declared}
                    formatter={(value) => formatCurrency(Number(value))}
                    prefix={<CircleGauge className="w-4 h-4 text-blue-500" />}
                  />
                </Card>
                <Card bordered={false} className="audit-metric-card">
                  <Statistic
                    title="AI审核金额"
                    value={totals.ai}
                    formatter={(value) => formatCurrency(Number(value))}
                    prefix={<BrainCircuit className="w-4 h-4 text-violet-500" />}
                  />
                </Card>
                <Card bordered={false} className="audit-metric-card audit-metric-card-danger">
                  <Statistic
                    title="建议核减"
                    value={totals.reduction}
                    formatter={(value) => formatCurrency(Number(value))}
                    prefix={<TrendingDown className="w-4 h-4 text-red-500" />}
                    suffix={`(${totals.ratio}%)`}
                  />
                </Card>
              </div>

              <div className="audit-result-main">
                <Card bordered={false} className="audit-table-card" title="全部数据分析" extra={<span className="text-xs text-slate-400">共 {auditRows.length} 项</span>}>
                  <Table<AuditRow>
                    rowKey="key"
                    columns={columns}
                    dataSource={auditRows}
                    pagination={false}
                    size="small"
                    scroll={{ y: 430 }}
                    rowClassName={(record) =>
                      record.status === "danger" ? "audit-row-danger" : record.status === "warning" ? "audit-row-warning" : ""
                    }
                  />
                </Card>

                <Card
                  bordered={false}
                  className="audit-issues-card"
                  title="AI审计问题"
                  extra={
                    <div className="flex gap-2">
                      <Tag color="error">3 异常</Tag>
                      <Tag color="warning">3 警告</Tag>
                    </div>
                  }
                >
                  <List
                    className="audit-issues-list"
                    dataSource={auditIssues}
                    renderItem={(issue) => {
                      const danger = issue.level === "异常"
                      return (
                        <List.Item className="!px-0">
                          <div className={`audit-issue-item ${danger ? "audit-issue-danger" : "audit-issue-warning"}`}>
                            <div className={`audit-issue-icon ${danger ? "audit-issue-icon-danger" : "audit-issue-icon-warning"}`}>
                              {danger ? <AlertTriangle className="w-4 h-4" /> : <TriangleAlert className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-sm font-semibold ${danger ? "text-red-600" : "text-yellow-700"}`}>{issue.title}</p>
                                <Tag color={danger ? "error" : "warning"}>{issue.level}</Tag>
                              </div>
                              <p className="text-xs text-slate-500 mb-2">
                                第{issue.rowIndex}项 · 申报{formatCurrency(issue.declared)}
                              </p>
                              <p className="text-xs text-slate-600 leading-5 mb-1">{issue.analysis}</p>
                              <p className={`text-xs font-semibold ${danger ? "text-red-600" : "text-yellow-700"}`}>
                                核减建议：{formatCurrency(issue.suggestion)}
                              </p>
                            </div>
                          </div>
                        </List.Item>
                      )
                    }}
                  />
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <Button type="primary" className="audit-export-btn" icon={<Download className="w-4 h-4" />}>
                      导出评审报告
                    </Button>
                    <Button onClick={resetView}>重新分析</Button>
                  </div>
                </Card>
              </div>
            </div>
          )}
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
        destroyOnClose
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
        destroyOnClose
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
        destroyOnClose
      >
        {changeSuccess ? (
          <Result status="success" title="密码修改成功" subTitle={`请使用新密码重新登录，正在跳转(${countdown}s)...`} />
        ) : (
          <Form
            form={changeForm}
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
            <Form.Item label="原密码" name="oldPass" rules={[{ required: true, message: "请输入原密码" }]}>
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
