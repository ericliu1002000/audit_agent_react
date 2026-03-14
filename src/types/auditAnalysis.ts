export type AmountStatus = "normal" | "warning" | "danger" | "pending"

export type AuditDetailRow = {
  key: string
  submittedUnit: string
  submittedUnitPrice: number
  submittedQuantity: number
  submittedDays: number
  submittedAmount: number
  reviewedUnit: string
  reviewedUnitPrice: number
  reviewedQuantity: number
  reviewedDays: number
  reviewedAmount: number
  reductionAmount: number
}

export type AuditRow = {
  key: number
  index: number
  item: string
  declared: number
  ai: number
  status: AmountStatus
  details: AuditDetailRow[]
}

export type AuditIssue = {
  key: number
  title: string
  level: "异常" | "警告"
  rowIndex: number
  declared: number
  suggestion: number
  analysis: string
}
