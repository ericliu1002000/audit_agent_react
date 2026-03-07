import { useMemo } from "react"
import { Menu } from "antd"
import type { MenuProps } from "antd"
import type { MenuItem } from "../types/menu"
import {
  BarChart3,
  Calculator,
  PieChart,
  ShieldCheck,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

type SidebarProps = {
  menu: MenuItem[]
  activeRoute: string
  onSelect: (item: MenuItem) => void
}

const Sidebar = ({ menu, activeRoute, onSelect }: SidebarProps) => {
  const iconMap = useMemo<Record<string, LucideIcon>>(
    () => ({
      "pie-chart": PieChart,
      "shield-check": ShieldCheck,
      calculator: Calculator,
      "bar-chart": BarChart3,
    }),
    []
  )

  const items = useMemo<MenuProps["items"]>(() => {
    return menu.map((item) => {
      const Icon = item.icon ? iconMap[item.icon] : undefined
      return {
        key: item.route || item.id,
        icon: Icon ? <Icon className="w-4 h-4" /> : undefined,
        label: item.title,
      }
    })
  }, [menu, iconMap])

  return (
    <div className="h-full flex flex-col">
      <nav className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin">
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[activeRoute]}
          items={items}
          className="sidebar-menu no-sider-border"
          onClick={(e) => {
            const item = menu.find((m) => m.route === e.key)
            if (item) onSelect(item)
          }}
        />
      </nav>
    </div>
  )
}

export default Sidebar
