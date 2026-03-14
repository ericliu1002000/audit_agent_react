import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  CircleGauge,
  Download,
  TrendingDown,
  TriangleAlert,
} from "lucide-react"
import { Button, Card, Empty, List, Modal, Progress, Statistic, Steps, Table, Tag, Tooltip, Typography, message } from "antd"
import type { ColumnsType } from "antd/es/table"
import { useLocation, useNavigate } from "react-router-dom"
import client from "../api/client"
import type { AmountStatus, AuditDetailRow, AuditIssue, AuditRow } from "../types/auditAnalysis"
import type {
  PriceAuditSubmissionData,
  PriceAuditSubmissionDetailResponse,
  PriceAuditSubmissionRowsResponse,
} from "../types/priceAudit"
import { formatCurrency } from "../utils/currency"
import { downloadBlobFile, getFileNameFromContentDisposition } from "../utils/fileDownload"
import "../styles/pages/AuditAnalysisPage.css"

type ViewState = "processing" | "result"
type AuditAnalysisRouteState = {
  submissionId?: number
  exhibitionCenterId?: number
  projectNature?: number
}

type AnalysisEvent = {
  id: string
  message: string
  createdAt: number
}

type ApiError = {
  response?: {
    data?: {
      message?: string
      error?: {
        message?: string
      }
    }
  }
}

/**
 * 将后端 current_step 映射为前端步骤条索引。
 * @param step 后端返回的当前步骤标识。
 * @returns 对应步骤索引，范围为 0-2。
 */
const mapCurrentStepToIndex = (step: string) => {
  const currentStep = step.toLowerCase()
  if (["queued", "pending", "uploaded", "waiting"].includes(currentStep)) {
    return 0
  }
  if (["parsing", "parsed", "normalizing", "normalized"].includes(currentStep)) {
    return 1
  }
  if (["comparing", "reviewing", "reporting", "completed"].includes(currentStep)) {
    return 2
  }
  return 0
}

/**
 * 从 report_json 中提取后端错误信息。
 * @param reportJson 后端返回的 report_json 字段。
 * @returns 可展示的错误信息字符串，未命中时返回空字符串。
 */
const getReportJsonError = (reportJson: unknown) => {
  if (typeof reportJson !== "object" || !reportJson) return ""
  const errorValue = (reportJson as Record<string, unknown>).error
  return typeof errorValue === "string" ? errorValue : ""
}

const toNumber = (value: unknown) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim()
    if (!normalized) return 0
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const toText = (value: unknown) => (typeof value === "string" ? value.trim() : "")

const resolveRowsData = (data: any): any[] => {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== "object") return []

  const record = data as Record<string, unknown>
  const candidates = [record.rows, record.results, record.list, record.items]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }

  for (const value of Object.values(record)) {
    if (Array.isArray(value)) return value
  }
  return []
}

const mapResultTypeToStatus = (rawRow: Record<string, unknown>): AmountStatus => {
  const decision = (rawRow.decision as Record<string, unknown> | undefined) || {}
  const resultType = String(decision.result_type || "").toLowerCase()
  const decisionStatus = String(decision.status || "").toLowerCase()
  const dangerKeywords = ["failed", "error", "abnormal", "exception"]

  if (dangerKeywords.some((keyword) => resultType.includes(keyword) || decisionStatus.includes(keyword))) {
    return "danger"
  }
  if (resultType === "adjusted") {
    return "warning"
  }
  return "normal"
}

const getStatusPriority = (status: AmountStatus) => {
  if (status === "danger") return 0
  if (status === "warning") return 1
  return 2
}

const mapRowsAndIssues = (rowsPayload: any[]) => {
  const mappedRowsWithMeta = rowsPayload.map((rawRow, index) => {
    const rowRecord = (rawRow || {}) as Record<string, unknown>
    const decision = (rowRecord.decision as Record<string, unknown> | undefined) || {}
    const sequenceNoText = toText(rowRecord.sequence_no)
    const submittedAmount = toNumber(rowRecord.submitted_amount)
    const reductionAmount = toNumber(decision.reduction_amount)
    const hasReviewedAmount =
      decision.reviewed_amount !== undefined && decision.reviewed_amount !== null && decision.reviewed_amount !== ""
    const reviewedAmount = hasReviewedAmount
      ? toNumber(decision.reviewed_amount)
      : Math.max(submittedAmount - reductionAmount, 0)
    const status = mapResultTypeToStatus(rowRecord)

    const submittedUnit = toText(rowRecord.submitted_unit) || toText(rowRecord.unit) || "-"
    const submittedQuantity = toNumber(rowRecord.submitted_quantity ?? rowRecord.quantity)
    const submittedDays = toNumber(rowRecord.submitted_days ?? rowRecord.days)
    const submittedPriceRaw = toNumber(rowRecord.submitted_unit_price ?? rowRecord.unit_price)
    const submittedDivisor = submittedQuantity > 0 ? submittedQuantity * Math.max(submittedDays, 1) : 0
    const submittedUnitPrice =
      submittedPriceRaw > 0 ? submittedPriceRaw : submittedDivisor > 0 ? submittedAmount / submittedDivisor : 0

    const reviewedUnit = toText(decision.reviewed_unit) || toText(rowRecord.reviewed_unit) || submittedUnit
    const reviewedQuantitySource = decision.reviewed_quantity ?? rowRecord.reviewed_quantity
    const reviewedDaysSource = decision.reviewed_days ?? rowRecord.reviewed_days
    const reviewedQuantity =
      reviewedQuantitySource === undefined || reviewedQuantitySource === null
        ? submittedQuantity
        : toNumber(reviewedQuantitySource)
    const reviewedDays =
      reviewedDaysSource === undefined || reviewedDaysSource === null ? submittedDays : toNumber(reviewedDaysSource)
    const reviewedPriceRaw = toNumber(decision.reviewed_unit_price ?? rowRecord.reviewed_unit_price)
    const reviewedDivisor = reviewedQuantity > 0 ? reviewedQuantity * Math.max(reviewedDays, 1) : 0
    const reviewedUnitPrice =
      reviewedPriceRaw > 0 ? reviewedPriceRaw : reviewedDivisor > 0 ? reviewedAmount / reviewedDivisor : 0

    const parsedRowId = Math.trunc(toNumber(rowRecord.row_id))
    const rowKey = parsedRowId > 0 ? parsedRowId : index + 1
    const itemName = toText(rowRecord.fee_type) || `第${index + 1}项`
    const reasonText = toText(decision.reason) || toText(decision.error_message)

    const mappedRow: AuditRow = {
      key: rowKey,
      index: sequenceNoText ? toNumber(sequenceNoText) : Number.NaN,
      item: itemName,
      declared: submittedAmount,
      ai: reviewedAmount,
      status,
      details: [
        {
          key: `${rowKey}-detail`,
          submittedUnit,
          submittedUnitPrice,
          submittedQuantity,
          submittedDays,
          submittedAmount,
          reviewedUnit,
          reviewedUnitPrice,
          reviewedQuantity,
          reviewedDays,
          reviewedAmount,
          reductionAmount,
        },
      ],
    }

    return {
      row: mappedRow,
      reason: reasonText,
      order: index,
    }
  })

  const issues: AuditIssue[] = mappedRowsWithMeta
    .filter((item) => item.row.status !== "normal")
    .sort((a, b) => getStatusPriority(a.row.status) - getStatusPriority(b.row.status) || a.order - b.order)
    .map((item) => {
      const level = item.row.status === "danger" ? "异常" : "警告"
      const suggestion = Math.max(item.row.declared - item.row.ai, 0)
      return {
        key: item.row.key,
        title: level === "异常" ? `${item.row.item}存在异常` : `${item.row.item}建议复核`,
        level,
        rowIndex: Number.isFinite(item.row.index) ? item.row.index : item.order + 1,
        declared: item.row.declared,
        suggestion,
        analysis:
          item.reason || (level === "异常" ? "该项存在高风险，请优先进行人工复核。" : "该项存在调整建议，请进一步核验。"),
      }
    })

  return {
    rows: mappedRowsWithMeta.map((item) => item.row),
    issues,
  }
}

const AuditAnalysisPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = (location.state ?? null) as AuditAnalysisRouteState | null
  const submissionId = routeState?.submissionId

  const [viewState, setViewState] = useState<ViewState>("processing")
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [tableScrollY, setTableScrollY] = useState(480)
  const [submissionDetail, setSubmissionDetail] = useState<PriceAuditSubmissionData | null>(null)
  const [expandedRowKey, setExpandedRowKey] = useState<number | null>(null)
  const [tableRows, setTableRows] = useState<AuditRow[]>([])
  const [issues, setIssues] = useState<AuditIssue[]>([])
  const [rowsLoading, setRowsLoading] = useState(false)
  const [analysisEvents, setAnalysisEvents] = useState<AnalysisEvent[]>([])
  const [prevProcessedRows, setPrevProcessedRows] = useState(0)

  const firstFetchRef = useRef(true)
  const firstErrorHandledRef = useRef(false)
  const pollingTimer = useRef<number | null>(null)
  const firstFetchKickoffTimer = useRef<number | null>(null)
  const firstErrorNavigateTimer = useRef<number | null>(null)
  const prevProcessedRowsRef = useRef(0)
  const rowsSyncedProcessedRowsRef = useRef(0)
  const lastSyncedNoticeProcessedRowsRef = useRef(0)
  const analysisStartedRef = useRef(false)
  const analysisCompletedRef = useRef(false)
  const rowsFetchingRef = useRef(false)
  const pendingRowsFetchRef = useRef<{ processedRows: number; totalRows: number; force: boolean } | null>(null)
  const resultStateRef = useRef<HTMLDivElement | null>(null)
  const resultTopRef = useRef<HTMLDivElement | null>(null)
  const thinkingPanelRef = useRef<HTMLDivElement | null>(null)

  const appendAnalysisEvent = (eventMessage: string) => {
    setAnalysisEvents((prev) => {
      const nextEvent: AnalysisEvent = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        message: eventMessage,
        createdAt: Date.now(),
      }
      return [...prev, nextEvent].slice(-50)
    })
  }

  const totals = useMemo(() => {
    const declared = toNumber(submissionDetail?.submitted_total_amount)
    const ai = toNumber(submissionDetail?.reviewed_total_amount)
    const reduction = toNumber(submissionDetail?.reduction_total_amount)
    return {
      declared,
      ai,
      reduction,
      ratio: declared > 0 ? Math.round((reduction / declared) * 100) : 0,
    }
  }, [submissionDetail])

  const projectMeta = useMemo(
    () => ({
      originalFilename: toText(submissionDetail?.original_filename) || "-",
      exhibitionCenterName: toText(submissionDetail?.exhibition_center_name) || "-",
      projectNatureName: toText(submissionDetail?.project_nature_name) || "-",
    }),
    [submissionDetail]
  )

  const issueCounts = useMemo(
    () =>
      issues.reduce(
        (acc, issue) => {
          if (issue.level === "异常") {
            acc.danger += 1
          } else {
            acc.warning += 1
          }
          return acc
        },
        { danger: 0, warning: 0 }
      ),
    [issues]
  )

  const showAnalysisTimeline = useMemo(() => {
    const status = String(submissionDetail?.status || "").toLowerCase()
    const totalRows = Math.max(0, Math.trunc(toNumber(submissionDetail?.total_rows)))
    return status !== "completed" && totalRows > 0
  }, [submissionDetail])

  const isAnalyzing = useMemo(() => {
    const status = String(submissionDetail?.status || "").toLowerCase()
    return status !== "completed" && status !== "failed" && status !== "canceled"
  }, [submissionDetail])

  const actionDisabledTip = isAnalyzing ? "AI正在分析中，请耐心等待" : undefined

  useEffect(() => {
    const clearPollingTimer = () => {
      if (!pollingTimer.current) return
      window.clearInterval(pollingTimer.current)
      pollingTimer.current = null
    }
    const clearFirstFetchKickoffTimer = () => {
      if (!firstFetchKickoffTimer.current) return
      window.clearTimeout(firstFetchKickoffTimer.current)
      firstFetchKickoffTimer.current = null
    }
    const clearNavigateTimer = () => {
      if (!firstErrorNavigateTimer.current) return
      window.clearTimeout(firstErrorNavigateTimer.current)
      firstErrorNavigateTimer.current = null
    }
    const resetRealtimeState = () => {
      firstFetchRef.current = true
      firstErrorHandledRef.current = false
      prevProcessedRowsRef.current = 0
      rowsSyncedProcessedRowsRef.current = 0
      lastSyncedNoticeProcessedRowsRef.current = 0
      analysisStartedRef.current = false
      analysisCompletedRef.current = false
      rowsFetchingRef.current = false
      pendingRowsFetchRef.current = null
      setViewState("processing")
      setProgress(0)
      setActiveStep(0)
      setSubmissionDetail(null)
      setExpandedRowKey(null)
      setTableRows([])
      setIssues([])
      setRowsLoading(false)
      setAnalysisEvents([])
      setPrevProcessedRows(0)
    }
    const handleFirstQueryFatalError = (errorText?: string) => {
      if (!firstFetchRef.current || firstErrorHandledRef.current) return
      firstErrorHandledRef.current = true
      clearPollingTimer()
      const modal = Modal.error({
        title: "送审单查询失败",
        content: errorText || "首次查询送审单详情失败，请重新上传文件后再试。",
        okButtonProps: { className: "hidden" },
      })
      firstErrorNavigateTimer.current = window.setTimeout(() => {
        modal.destroy()
        navigate("/", { replace: true })
      }, 1500)
    }

    resetRealtimeState()

    if (typeof submissionId !== "number" || submissionId <= 0) {
      message.error("缺少 submissionId，无法查询送审单详情")
      navigate("/", { replace: true })
      return () => {
        clearFirstFetchKickoffTimer()
        clearPollingTimer()
        clearNavigateTimer()
      }
    }

    const fetchSubmissionRows = async (currentProcessedRows: number, totalRows: number, force = false) => {
      if (typeof submissionId !== "number" || submissionId <= 0) return
      if (!force && currentProcessedRows <= rowsSyncedProcessedRowsRef.current) return
      if (rowsFetchingRef.current) {
        pendingRowsFetchRef.current = { processedRows: currentProcessedRows, totalRows, force }
        return
      }

      rowsFetchingRef.current = true
      setRowsLoading(true)
      try {
        const { data: responseData } = await client.get<PriceAuditSubmissionRowsResponse>(
          `/v1/price-audit/submissions/${submissionId}/rows/`,
          {
            params: {
              submission_id: submissionId,
              page: 1,
              page_size: 200,
            },
          }
        )

        console.log("[price-audit][submission-rows]", responseData)

        if (!responseData.success) {
          message.error(responseData.message || "获取送审行数据失败")
          return
        }

        const rowsPayload = resolveRowsData(responseData.data)
        const mapped = mapRowsAndIssues(rowsPayload)
        setTableRows(mapped.rows)
        setIssues(mapped.issues)
        rowsSyncedProcessedRowsRef.current = Math.max(rowsSyncedProcessedRowsRef.current, currentProcessedRows)

        if (currentProcessedRows > lastSyncedNoticeProcessedRowsRef.current) {
          const syncedRows = Math.min(currentProcessedRows, totalRows > 0 ? totalRows : currentProcessedRows)
          appendAnalysisEvent(`已同步前 ${syncedRows} 条分析结果`)
          lastSyncedNoticeProcessedRowsRef.current = currentProcessedRows
        }
      } catch (e) {
        const err = e as ApiError
        message.error(err.response?.data?.error?.message || err.response?.data?.message || "获取送审行数据失败")
      } finally {
        rowsFetchingRef.current = false
        setRowsLoading(false)
        const pendingRequest = pendingRowsFetchRef.current
        pendingRowsFetchRef.current = null
        if (
          pendingRequest &&
          (pendingRequest.force || pendingRequest.processedRows > rowsSyncedProcessedRowsRef.current)
        ) {
          void fetchSubmissionRows(pendingRequest.processedRows, pendingRequest.totalRows, pendingRequest.force)
        }
      }
    }

    const fetchSubmissionDetail = async () => {
      try {
        const { data } = await client.get<PriceAuditSubmissionDetailResponse>(
          `/v1/price-audit/submissions/${submissionId}/`
        )
        if (import.meta.env.DEV) {
          console.log("[price-audit][submission-detail]", data)
        }
        if (!data.success) {
          handleFirstQueryFatalError(data.message || "查询分析进度失败")
          if (!firstFetchRef.current) {
            message.error(data.message || "查询分析进度失败")
          }
          return false
        }

        const detail = data.data
        setSubmissionDetail(detail)
        setProgress(Math.max(0, Math.min(100, Number(detail.progress_percent || 0))))
        setActiveStep(mapCurrentStepToIndex(detail.current_step || "queued"))
        if (firstFetchRef.current) {
          setViewState("result")
        }

        const totalRows = Math.max(0, Math.trunc(toNumber(detail.total_rows)))
        const processedRows = Math.max(0, Math.trunc(toNumber(detail.processed_rows)))

        if (!analysisStartedRef.current && totalRows > 0) {
          appendAnalysisEvent(`开始分析，共 ${totalRows} 条`)
          analysisStartedRef.current = true
        }

        if (processedRows > prevProcessedRowsRef.current) {
          const previousProcessedRows = prevProcessedRowsRef.current
          const nextMessage =
            processedRows - previousProcessedRows > 1
              ? `已完成第 ${previousProcessedRows + 1}-${processedRows} 条，${
                  processedRows < totalRows ? `正在分析第 ${processedRows + 1} 条` : "正在生成最终报告"
                }`
              : `已完成第 ${processedRows} 条，${
                  processedRows < totalRows ? `正在分析第 ${processedRows + 1} 条` : "正在生成最终报告"
                }`
          appendAnalysisEvent(nextMessage)
          prevProcessedRowsRef.current = processedRows
          setPrevProcessedRows(processedRows)
        } else if (processedRows !== prevProcessedRowsRef.current) {
          prevProcessedRowsRef.current = processedRows
          setPrevProcessedRows(processedRows)
        }

        if (processedRows > rowsSyncedProcessedRowsRef.current) {
          void fetchSubmissionRows(processedRows, totalRows, false)
        }

        const status = (detail.status || "").toLowerCase()
        if (status === "completed") {
          setViewState("result")
          clearPollingTimer()
          if (!analysisCompletedRef.current) {
            appendAnalysisEvent("全部数据分析完成")
            analysisCompletedRef.current = true
          }
          await fetchSubmissionRows(processedRows, totalRows, true)
          return false
        }

        if (status === "failed" || status === "canceled") {
          const detailErrorText =
            detail.error_message ||
            getReportJsonError(detail.report_json) ||
            detail.current_message ||
            data.message ||
            "分析任务已终止"
          handleFirstQueryFatalError(detailErrorText)
          clearPollingTimer()
          if (!firstFetchRef.current) {
            message.error(detailErrorText)
          }
          return false
        }
        return true
      } catch (e) {
        if (import.meta.env.DEV) {
          console.log("[price-audit][submission-detail][error]", e)
        }
        const err = e as ApiError
        const errorText = err.response?.data?.error?.message || err.response?.data?.message || "查询分析进度失败"
        handleFirstQueryFatalError(errorText)
        if (!firstFetchRef.current) {
          message.error(errorText)
        }
        return false
      }
    }

    firstFetchKickoffTimer.current = window.setTimeout(() => {
      void (async () => {
        const shouldStartPolling = await fetchSubmissionDetail()
        firstFetchRef.current = false
        if (!shouldStartPolling || firstErrorHandledRef.current) return
        pollingTimer.current = window.setInterval(() => {
          void fetchSubmissionDetail()
        }, 3000)
      })()
    }, 0)

    return () => {
      clearFirstFetchKickoffTimer()
      clearPollingTimer()
      clearNavigateTimer()
    }
  }, [navigate, submissionId])

  /**
   * 下载审核后Excel文件并保存到浏览器本地。
   * @param currentSubmissionId 当前送审单ID。
   * @returns 无返回值。
   */
  const handleDownloadAuditedExcel = async (currentSubmissionId: number | undefined) => {
    if (downloadLoading) return
    if (typeof currentSubmissionId !== "number" || currentSubmissionId <= 0) {
      message.warning("缺少 submissionId，无法下载评审报告")
      return
    }
    try {
      setDownloadLoading(true)
      const response = await client.get<Blob>(
        `/v1/price-audit/submissions/${currentSubmissionId}/download/audited-excel/`,
        { responseType: "blob" }
      )
      const contentDisposition = (response.headers?.["content-disposition"] || "") as string
      const fileName =
        getFileNameFromContentDisposition(contentDisposition) || `评审报告_${currentSubmissionId}.xlsx`
      downloadBlobFile(response.data, fileName)
      message.success("下载已开始")
    } catch (e) {
      const err = e as ApiError
      message.error(err.response?.data?.error?.message || err.response?.data?.message || "下载失败")
    } finally {
      setDownloadLoading(false)
    }
  }

  useEffect(() => {
    if (viewState !== "result") return
    const updateTableScrollY = () => {
      const resultStateEl = resultStateRef.current
      const resultTopEl = resultTopRef.current
      if (!resultStateEl || !resultTopEl) return
      const resultStateHeight = resultStateEl.getBoundingClientRect().height
      const resultTopHeight = resultTopEl.getBoundingClientRect().height
      const thinkingPanelHeight = showAnalysisTimeline
        ? Math.ceil(thinkingPanelRef.current?.getBoundingClientRect().height || 0)
        : 0
      // 152 为表格头部、卡片内边距等固定占位，思考区显示时需扣减其实时高度。
      const nextScrollY = Math.max(140, Math.floor(resultStateHeight - resultTopHeight - 20 - 152 - thinkingPanelHeight))
      setTableScrollY((prev) => (prev === nextScrollY ? prev : nextScrollY))
    }
    updateTableScrollY()
    const resizeObserver = new ResizeObserver(updateTableScrollY)
    const resultStateEl = resultStateRef.current
    const resultTopEl = resultTopRef.current
    if (resultStateEl) {
      resizeObserver.observe(resultStateEl)
    }
    if (resultTopEl) {
      resizeObserver.observe(resultTopEl)
    }
    if (thinkingPanelRef.current) {
      resizeObserver.observe(thinkingPanelRef.current)
    }
    window.addEventListener("resize", updateTableScrollY)
    return () => {
      window.removeEventListener("resize", updateTableScrollY)
      resizeObserver.disconnect()
    }
  }, [analysisEvents.length, showAnalysisTimeline, viewState])

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

  const detailColumns: ColumnsType<AuditDetailRow> = [
    {
      title: "送审",
      align: "center",
      onHeaderCell: () => ({ className: "audit-detail-head-submitted" }),
      children: [
        {
          title: "计量单位",
          dataIndex: "submittedUnit",
          width: 96,
          align: "center",
          onHeaderCell: () => ({ className: "audit-detail-head-submitted" }),
        },
        {
          title: "单价（元）",
          dataIndex: "submittedUnitPrice",
          width: 116,
          align: "center",
          onHeaderCell: () => ({ className: "audit-detail-head-submitted" }),
          render: (value: number) => <span className="font-mono">{formatCurrency(value)}</span>,
        },
        {
          title: "数量",
          dataIndex: "submittedQuantity",
          width: 86,
          align: "center",
          onHeaderCell: () => ({ className: "audit-detail-head-submitted" }),
        },
        {
          title: "天数",
          dataIndex: "submittedDays",
          width: 86,
          align: "center",
          onHeaderCell: () => ({ className: "audit-detail-head-submitted" }),
        },
        {
          title: "预算金额（元）",
          dataIndex: "submittedAmount",
          width: 136,
          align: "center",
          onHeaderCell: () => ({ className: "audit-detail-head-submitted" }),
          render: (value: number) => <span className="font-mono">{formatCurrency(value)}</span>,
        },
      ],
    },
    {
      title: "审核",
      align: "center",
      onHeaderCell: () => ({ className: "audit-detail-head-reviewed" }),
      children: [
        {
          title: "计量单位",
          dataIndex: "reviewedUnit",
          width: 96,
          align: "center",
          onHeaderCell: () => ({ className: "audit-detail-head-reviewed" }),
        },
        {
          title: "单价（元）",
          dataIndex: "reviewedUnitPrice",
          width: 116,
          align: "center",
          onHeaderCell: () => ({ className: "audit-detail-head-reviewed" }),
          render: (value: number) => <span className="font-mono">{formatCurrency(value)}</span>,
        },
        {
          title: "数量",
          dataIndex: "reviewedQuantity",
          width: 86,
          align: "center",
          onHeaderCell: () => ({ className: "audit-detail-head-reviewed" }),
        },
        {
          title: "天数",
          dataIndex: "reviewedDays",
          width: 86,
          align: "center",
          onHeaderCell: () => ({ className: "audit-detail-head-reviewed" }),
        },
        {
          title: "审核金额（元）",
          dataIndex: "reviewedAmount",
          width: 136,
          align: "center",
          onHeaderCell: () => ({ className: "audit-detail-head-reviewed" }),
          render: (value: number) => <span className="font-mono text-slate-500">{formatCurrency(value)}</span>,
        },
        {
          title: "审减金额（元）",
          dataIndex: "reductionAmount",
          width: 136,
          align: "center",
          onHeaderCell: () => ({ className: "audit-detail-head-reviewed" }),
          render: (value: number) => <span className="font-mono text-red-600">{formatCurrency(value)}</span>,
        },
      ],
    },
  ]

  const columns: ColumnsType<AuditRow> = [
    {
      title: "序号",
      dataIndex: "index",
      width: 78,
      render: (value: number) => (Number.isFinite(value) && value !== 0 ? value : ""),
    },
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
    {
      title: "详情",
      width: 100,
      render: (_value, record) => {
        const expanded = expandedRowKey === record.key
        return (
          <Button
            type="link"
            className="audit-detail-trigger"
            onClick={() => {
              setExpandedRowKey(expanded ? null : record.key)
            }}
          >
            <span className="audit-detail-trigger-content">
              {expanded ? "收起详情" : "查看详情"}
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </span>
          </Button>
        )
      },
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
            <Typography.Text className="text-slate-500">
              {submissionDetail?.current_message || "正在对比市场数据与审计标准"}
            </Typography.Text>
            <div className="w-[360px] max-w-full mt-8">
              <Progress percent={progress} strokeColor={{ from: "#1d4ed8", to: "#1e40af" }} />
            </div>
            <div className="w-[380px] max-w-full mt-6">
              <Steps
                direction="vertical"
                size="small"
                current={Math.min(activeStep, 2)}
                items={[{ title: "解析预算文件..." }, { title: "AI逐行分析中..." }, { title: "智能比对价格数据..." }]}
              />
            </div>
          </div>
        )}

        {viewState === "result" && (
          <div className="audit-result-state" ref={resultStateRef}>
            <div ref={resultTopRef}>
              <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                   <Typography.Title level={4} className="!mb-0">
                  智能分析结果
                </Typography.Title>
                <span className="audit-project-meta-value">
                {projectMeta.originalFilename}/{projectMeta.exhibitionCenterName}/{projectMeta.projectNatureName}
             </span>
              </div>
               
                <div className="flex gap-2">
                  <Tooltip title={actionDisabledTip}>
                    <span>
                      <Button
                        type="primary"
                        icon={<Download className="w-4 h-4" />}
                        loading={downloadLoading}
                        disabled={downloadLoading || isAnalyzing}
                        onClick={() => {
                          void handleDownloadAuditedExcel(submissionId)
                        }}
                      >
                        导出评审报告
                      </Button>
                    </span>
                  </Tooltip>
                  <Tooltip title={actionDisabledTip}>
                    <span>
                      <Button
                        className="audit-export-btn"
                        icon={<ArrowLeft className="w-4 h-4" />}
                        disabled={isAnalyzing}
                        onClick={() => navigate("/")}
                      >
                        返回首页
                      </Button>
                    </span>
                  </Tooltip>
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
            </div>

            <div className="audit-result-main">
              <Card
                variant="borderless"
                className="audit-table-card"
                title="全部数据分析"
                extra={<span className="text-xs text-slate-400">{rowsLoading ? "数据同步中..." : `共 ${tableRows.length} 项`}</span>}
              >
                {showAnalysisTimeline && (
                  <div className="audit-thinking-panel" ref={thinkingPanelRef}>
                    <div className="audit-thinking-header">
                      <span>AI思考过程</span>
                      <span className="text-xs text-slate-400">
                        已处理 {prevProcessedRows}/{Math.max(0, Math.trunc(toNumber(submissionDetail?.total_rows)))}
                      </span>
                    </div>
                    <div className="audit-thinking-list">
                      {analysisEvents.length === 0 ? (
                        <p className="audit-thinking-empty">等待分析任务启动...</p>
                      ) : (
                        analysisEvents.map((event) => (
                          <div key={event.id} className="audit-thinking-item">
                            <span className="audit-thinking-time">
                              {new Date(event.createdAt).toLocaleTimeString("zh-CN", { hour12: false })}
                            </span>
                            <span className="audit-thinking-message">{event.message}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <Table<AuditRow>
                  rowKey="key"
                  columns={columns}
                  dataSource={tableRows}
                  loading={rowsLoading}
                  locale={{emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" ></Empty>}}
                  expandable={{
                    showExpandColumn: false,
                    expandedRowKeys: expandedRowKey ? [expandedRowKey] : [],
                    expandedRowRender: (record) => (
                      <Table<AuditDetailRow>
                        className="audit-detail-table"
                        rowKey="key"
                        columns={detailColumns}
                        dataSource={record.details}
                        pagination={false}
                        size="small"
                        bordered
                        scroll={{ x: 1200 }}
                      />
                    ),
                  }}
                  pagination={false}
                  size="small"
                  scroll={{ y: tableScrollY }}
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
                    <Tag color="error">{issueCounts.danger} 异常</Tag>
                    <Tag color="warning">{issueCounts.warning} 警告</Tag>
                  </div>
                }
              >
                <List
                  className="audit-issues-list"
                  dataSource={issues}
                  locale={{emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" ></Empty>}}
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
