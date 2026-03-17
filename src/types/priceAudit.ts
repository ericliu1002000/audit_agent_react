export type PriceAuditSubmissionData = {
  id: number
  status: string
  current_step: string
  progress_percent: number
  total_rows: number
  processed_rows: number
  failed_rows: number
  current_message: string
  project_name: string
  original_filename: string
  exhibition_center_id: number
  exhibition_center_name: string
  project_nature: number
  project_nature_name: string
  submitted_total_amount: string | number | null
  reviewed_total_amount: string | number | null
  reduction_total_amount: string | number | null
  report_json: unknown | null
  error_message: string
  created_at: string
  updated_at: string
  detail_url: string
  rows_url: string
  audited_excel_download_url: string | null
}

export type PriceAuditSubmissionResponse = {
  success: boolean
  message: string
  data: PriceAuditSubmissionData
}

export type PriceAuditSubmissionDetailResponse = PriceAuditSubmissionResponse

export type PriceAuditSubmissionRowsResponse = {
  success: boolean
  message?: string
  data: unknown
  meta?: unknown
}
