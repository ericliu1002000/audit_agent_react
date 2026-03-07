import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom"
import { Provider } from "react-redux"
import "antd/dist/reset.css"
import "./index.css"
import App from "./App"
import Login from "./pages/Login"
import ChangePassword from "./pages/ChangePassword"
import { store } from "./store"
import DashboardHome from "./pages/DashboardHome"
import FinancialReportPage from "./pages/FinancialReportPage"
import AuditPage from "./pages/AuditPage"
import TaxPage from "./pages/TaxPage"

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <DashboardHome /> },
      { path: "report", element: <FinancialReportPage /> },
      { path: "audit", element: <AuditPage /> },
      { path: "tax", element: <TaxPage /> },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/change-password", element: <ChangePassword /> },
  { path: "*", element: <Navigate to="/" replace /> },
])

const renderApp = () => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </StrictMode>
  )
}

const prepare = async () => {
  const enableMock = import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === "true"
  if (!enableMock) return

  try {
    const { worker } = await import("./mocks/browser")
    await worker.start({
      onUnhandledRequest: "bypass",
      serviceWorker: { url: "/mockServiceWorker.js" },
    })
  } catch (error) {
    console.error("MSW 启动失败，已降级为真实接口模式。", error)
  }
}

prepare().finally(renderApp)
