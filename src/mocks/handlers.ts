import { http, HttpResponse } from "msw"
import type { MenuItem } from "../types/menu"

const menu: MenuItem[] = [
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
  { id: "3", title: "税务管理", icon: "calculator", level: 1, route: "/tax", children: [] },
]

export const handlers = [
  http.post("/api/auth/sendCode", async ({ request }) => {
    const body = (await request.json()) as { phone: string }
    if (!/^1[3-9]\d{9}$/.test(body.phone)) {
      return HttpResponse.json({ code: 400, message: "手机号格式不正确" }, { status: 400 })
    }
    return HttpResponse.json({ ok: true })
  }),
  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as
      | { phone: string; code: string }
      | { phone: string; password: string }
    if ("code" in body) {
      if (!/^\d{6}$/.test(body.code)) {
        return HttpResponse.json({ code: 400, message: "验证码错误" }, { status: 400 })
      }
    } else if ("password" in body) {
      if (body.password.length < 8) {
        return HttpResponse.json({ code: 400, message: "密码错误" }, { status: 400 })
      }
    }
    return HttpResponse.json({
      token: "mock-token",
      user: { name: "李杰", phone: "13800000000" },
    })
  }),
  http.post("/api/user/change-password", async ({ request }) => {
    const body = (await request.json()) as { oldPass: string; newPass: string }
    if (!body.oldPass || !body.newPass) {
      return HttpResponse.json({ code: 400, message: "参数不完整" }, { status: 400 })
    }
    return HttpResponse.json({ ok: true })
  }),
  http.get("/api/menu", () => {
    return HttpResponse.json(menu)
  }),
]
