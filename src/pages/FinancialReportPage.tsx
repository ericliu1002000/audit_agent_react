import { Card, Empty, Typography } from "antd"

const FinancialReportPage = () => {
  return (
    <Card className="rounded-2xl border-0 shadow-lg">
      <Typography.Title level={4} className="!mb-2">
        财务报表分析
      </Typography.Title>
      <Empty description="暂无内容" />
    </Card>
  )
}

export default FinancialReportPage
