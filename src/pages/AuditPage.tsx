import { Card, Empty, Typography } from "antd"

const AuditPage = () => {
  return (
    <Card className="rounded-2xl border-0 shadow-lg">
      <Typography.Title level={4} className="!mb-2">
        智能审计
      </Typography.Title>
      <Empty description="暂无内容" />
    </Card>
  )
}

export default AuditPage
