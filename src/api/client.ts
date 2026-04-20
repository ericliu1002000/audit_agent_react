import axios from "axios"

const client = axios.create({
  baseURL: "/api",
  timeout: 8000,
  withCredentials: true,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token") || ""
  config.headers.Authorization = token ? `Bearer ${token}` : ""
  config.headers["X-CSRFToken"] = token
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)

export default client
