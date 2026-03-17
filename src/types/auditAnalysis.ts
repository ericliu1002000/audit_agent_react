export type AmountStatus = "normal" | "warning" | "danger" | "pending"

export type AuditEvidenceItem = {
  name: string
  unit: string
  max: string
  min: string
}

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
  ai: number | null
  status: AmountStatus
  rowType?: string
  auditReason?: string
  auditEvidence?: AuditEvidenceItem[]
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
