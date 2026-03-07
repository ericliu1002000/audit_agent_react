import { Navigate, Outlet, useLocation } from "react-router-dom"
import DashboardLayout from "./layouts/DashboardLayout"
import { useAppSelector } from "./store"

const App = () => {
  const token = useAppSelector((state) => state.auth.token)
  const user = useAppSelector((state) => state.auth.user)
  const location = useLocation()

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}

export default App
