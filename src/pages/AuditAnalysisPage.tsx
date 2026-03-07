import { useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, BrainCircuit, CircleGauge, Download, TrendingDown, TriangleAlert } from "lucide-react"
import { Button, Card, List, Progress, Statistic, Steps, Table, Tag, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import { useNavigate } from "react-router-dom"
import { auditIssues, auditRows, formatCurrency } from "./auditAnalysisData"
import type { AmountStatus, AuditRow } from "./auditAnalysisData"
import "./AuditAnalysisPage.css"

type ViewState = "processing" | "result"

const AuditAnalysisPage = () => {
  const navigate = useNavigate()
  const [viewState, setViewState] = useState<ViewState>("processing")
  const [progress, setProgress] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const progressTimer = useRef<number | null>(null)
  const stepTimer = useRef<number | null>(null)
  const finishTimer = useRef<number | null>(null)

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

    return () => {
      clearTimers()
    }
  }, [])

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
    <div className="audit-analysis-page animate-fade-in">
      <div className="audit-analysis-panel">
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
                items={[{ title: "解析预算文件..." }, { title: "比对天津市财政标准..." }, { title: "智能比对价格数据..." }]}
              />
            </div>
          </div>
        )}

        {viewState === "result" && (
          <div className="audit-result-state">
            <div className="flex justify-between items-center mb-4">
              <Typography.Title level={4} className="!mb-0">
                智能分析结果
              </Typography.Title>
              <div className="flex gap-2">
                <Button type="primary" className="audit-export-btn" icon={<Download className="w-4 h-4" />}>
                  导出评审报告
                </Button>
                <Button onClick={() => navigate("/")}>重新分析</Button>
              </div>
            </div>
            <div className="audit-metric-grid">
              <Card variant="borderless" className="audit-metric-card audit-metric-card-declared">
                <Statistic
                  title="申报总额"
                  value={totals.declared}
                  formatter={(value) => formatCurrency(Number(value))}
                  prefix={<CircleGauge className="w-4 h-4 text-blue-500" />}
                />
              </Card>
              <Card variant="borderless" className="audit-metric-card audit-metric-card-ai">
                <Statistic
                  title="AI审核金额"
                  value={totals.ai}
                  formatter={(value) => formatCurrency(Number(value))}
                  prefix={<BrainCircuit className="w-4 h-4 text-violet-500" />}
                />
              </Card>
              <Card variant="borderless" className="audit-metric-card audit-metric-card-reduction">
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
              <Card variant="borderless" className="audit-table-card" title="全部数据分析" extra={<span className="text-xs text-slate-400">共 {auditRows.length} 项</span>}>
                <Table<AuditRow>
                  rowKey="key"
                  columns={columns}
                  dataSource={auditRows}
                  pagination={false}
                  size="small"
                  rowClassName={(record) =>
                    record.status === "danger" ? "audit-row-danger" : record.status === "warning" ? "audit-row-warning" : ""
                  }
                />
              </Card>

              <Card
                variant="borderless"
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
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditAnalysisPage
