export type MenuItem = {
  id: string
  title: string
  level: number
  icon?: string
  route?: string
  children?: MenuItem[]
}
