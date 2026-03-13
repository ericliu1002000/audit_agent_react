/**
 * 格式化日期时间字符串为"yyyy-MM-dd HH:mm:ss"格式
 * @param value 日期时间字符串
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (value?: string) => {
  if (!value) return "未设置"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "未设置"
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date)
}
