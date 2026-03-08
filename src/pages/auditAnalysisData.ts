export type AmountStatus = "normal" | "warning" | "danger"

export type AuditRow = {
  key: number
  index: number
  item: string
  declared: number
  ai: number
  status: AmountStatus
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

export const auditRows: AuditRow[] = [
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
  { key: 16, index: 15, item: "办公设备租赁2", declared: 12000, ai: 11000, status: "normal" },
  { key: 17, index: 16, item: "办公设备租赁3", declared: 12000, ai: 11000, status: "normal" },
  { key: 18, index: 17, item: "办公设备租赁4", declared: 12000, ai: 11000, status: "normal" },
  { key: 19, index: 18, item: "办公设备租赁5", declared: 12000, ai: 11000, status: "normal" },
  { key: 20, index: 19, item: "办公设备租赁6", declared: 12000, ai: 11000, status: "normal" },
  { key: 21, index: 20, item: "办公设备租赁7", declared: 12000, ai: 11000, status: "normal" },
  { key: 22, index: 21, item: "办公设备租赁8", declared: 12000, ai: 11000, status: "normal" },
  { key: 23, index: 22, item: "办公设备租赁9", declared: 12000, ai: 11000, status: "normal" },
  { key: 24, index: 23, item: "办公设备租赁10", declared: 12000, ai: 11000, status: "normal" },
  { key: 25, index: 24, item: "办公设备租赁11", declared: 12000, ai: 11000, status: "normal" },
  { key: 26, index: 25, item: "办公设备租赁12", declared: 12000, ai: 11000, status: "normal" },
  { key: 27, index: 26, item: "办公设备租赁13", declared: 12000, ai: 11000, status: "normal" },
  { key: 28, index: 27, item: "办公设备租赁14", declared: 12000, ai: 11000, status: "normal" },
  { key: 29, index: 28, item: "办公设备租赁15", declared: 12000, ai: 11000, status: "normal" },
  { key: 30, index: 29, item: "办公设备租赁16", declared: 12000, ai: 11000, status: "normal" },
]

export const auditIssues: AuditIssue[] = [
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

export const formatCurrency = (value: number) => `¥${value.toLocaleString("zh-CN")}`
