import type { MenuItem } from "../types/menu"

export const findMenuByRoute = (items: MenuItem[], route: string): MenuItem | null => {
  for (const item of items) {
    if (item.route === route) return item
    if (item.children?.length) {
      const found = findMenuByRoute(item.children, route)
      if (found) return found
    }
  }
  return null
}

export const buildBreadcrumb = (
  items: MenuItem[],
  route: string,
  trail: MenuItem[] = []
): MenuItem[] => {
  for (const item of items) {
    const nextTrail = [...trail, item]
    if (item.route === route) return nextTrail
    if (item.children?.length) {
      const found = buildBreadcrumb(item.children, route, nextTrail)
      if (found.length) return found
    }
  }
  return []
}
