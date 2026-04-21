import axios from "axios"

const getCookie = (name: string) => {
  if (typeof document === "undefined") return ""
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`))
  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : ""
}

const client = axios.create({
  baseURL: "/api",
  timeout: 8000,
  withCredentials: true,
})

client.interceptors.request.use((config) => {
  const csrfToken =
    getCookie("csrftoken") ||
    localStorage.getItem("csrf_token") ||
    sessionStorage.getItem("csrf_token") ||
    localStorage.getItem("auth_token") ||
    sessionStorage.getItem("auth_token") ||
    ""
  config.headers["X-CSRFToken"] = csrfToken
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)

export default client
