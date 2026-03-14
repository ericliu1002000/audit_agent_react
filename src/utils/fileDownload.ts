/**
 * 从 content-disposition 响应头中提取下载文件名。
 * @param contentDisposition HTTP 响应头 content-disposition 原始值。
 * @returns 解析后的文件名；解析失败时返回空字符串。
 */
export const getFileNameFromContentDisposition = (contentDisposition?: string) => {
  if (!contentDisposition) return ""
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]).replace(/^["']|["']$/g, "")
    } catch {
      return utf8Match[1].replace(/^["']|["']$/g, "")
    }
  }
  const normalMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  if (!normalMatch?.[1]) return ""
  return normalMatch[1].trim()
}

/**
 * 将后端返回的 Blob 文件保存到浏览器本地。
 * @param blob 接口返回的二进制文件数据。
 * @param fileName 期望保存的文件名。
 * @returns 无返回值。
 */
export const downloadBlobFile = (blob: Blob, fileName: string) => {
  const objectUrl = window.URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = objectUrl
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.URL.revokeObjectURL(objectUrl)
}
