import type { MenuItem } from "../types/menu"

export const menuData: MenuItem[] = [
  {
    id: "1",
    title: "财务报表分析",
    icon: "pie-chart",
    level: 1,
    route: "/report",
    children: [],
  },
  {
    id: "2",
    title: "智能审计",
    icon: "shield-check",
    level: 1,
    route: "/audit",
    children: [],
  },
  {
    id: "3",
    title: "税务管理",
    icon: "calculator",
    level: 1,
    route: "/tax",
    children: [],
  },
]
