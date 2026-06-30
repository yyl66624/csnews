import { useEffect, useState } from 'react';
import { Table, Tag, Tabs } from 'antd';
import api, { OrderItem } from '../api';

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待确认' },
  confirmed: { color: 'blue', text: '已确认' },
  in_progress: { color: 'cyan', text: '进行中' },
  completed: { color: 'green', text: '已完成' },
  cancelled: { color: 'default', text: '已取消' },
  refunded: { color: 'red', text: '已退款' },
};

export default function OrderManage() {
  const [data, setData] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = tab ? { status: tab } : {};
    api.get('/admin/orders', { params })
      .then((res) => setData(res.data.items))
      .finally(() => setLoading(false));
  }, [tab]);

  const columns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 200 },
    { title: '科目', key: 'subject', render: (_: unknown, r: OrderItem) => `${r.subject} · ${r.gradeLevel}` },
    { title: '学生', dataIndex: ['student', 'nickname'], key: 'student' },
    { title: '教师', dataIndex: ['teacher', 'nickname'], key: 'teacher' },
    { title: '金额', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => `¥${v}` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text || s}</Tag>,
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>订单管理</h2>
      <Tabs activeKey={tab} onChange={setTab} items={[
        { key: '', label: '全部' },
        { key: 'pending', label: '待确认' },
        { key: 'confirmed', label: '已确认' },
        { key: 'completed', label: '已完成' },
        { key: 'cancelled', label: '已取消' },
      ]} />
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: 900 }} />
    </div>
  );
}
