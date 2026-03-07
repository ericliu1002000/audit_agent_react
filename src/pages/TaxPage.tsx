import { Card, Empty, Typography } from "antd"

const TaxPage = () => {
  return (
    <Card className="rounded-2xl border-0 shadow-lg">
      <Typography.Title level={4} className="!mb-2">
        税务管理
      </Typography.Title>
      <Empty description="暂无内容" />
    </Card>
  )
}

export default TaxPage
