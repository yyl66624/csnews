import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Spin } from 'antd';
import { UserOutlined, TeamOutlined, ShoppingOutlined, DollarOutlined } from '@ant-design/icons';
import api, { DashboardData } from '../api';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" />;

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>数据看板</h2>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card><Statistic title="学生用户" value={data?.userCount || 0} prefix={<UserOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="认证教师" value={data?.teacherCount || 0} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="总订单" value={data?.orderCount || 0} prefix={<ShoppingOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="GMV (元)" value={data?.gmv || 0} prefix={<DollarOutlined />} precision={2} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="待审核教师" value={data?.pendingAudits || 0} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
      </Row>
    </div>
  );
}
