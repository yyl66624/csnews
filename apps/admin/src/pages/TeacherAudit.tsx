import { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Modal, Input, message, Tabs } from 'antd';
import api, { TeacherAuditItem } from '../api';

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待审核' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已驳回' },
};

export default function TeacherAudit() {
  const [data, setData] = useState<TeacherAuditItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('pending');
  const [rejectModal, setRejectModal] = useState<{ id: number } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = (status?: string) => {
    setLoading(true);
    const params = status ? { auditStatus: status } : {};
    api.get('/admin/teachers', { params })
      .then((res) => setData(res.data.items))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(tab === 'all' ? undefined : tab); }, [tab]);

  const audit = async (id: number, approved: boolean, reason?: string) => {
    await api.put(`/admin/teachers/${id}/audit`, { approved, rejectReason: reason });
    message.success(approved ? '已通过' : '已驳回');
    load(tab === 'all' ? undefined : tab);
    setRejectModal(null);
  };

  const columns = [
    { title: '姓名', dataIndex: 'realName', key: 'realName' },
    { title: '昵称', dataIndex: 'nickname', key: 'nickname' },
    { title: '学历', dataIndex: 'education', key: 'education' },
    { title: '教龄', dataIndex: 'teachingYears', key: 'teachingYears' },
    {
      title: '状态',
      dataIndex: 'auditStatus',
      key: 'auditStatus',
      render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text || s}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: TeacherAuditItem) =>
        record.auditStatus === 'pending' ? (
          <Space>
            <Button type="primary" size="small" onClick={() => audit(record.id, true)}>通过</Button>
            <Button danger size="small" onClick={() => setRejectModal({ id: record.id })}>驳回</Button>
          </Space>
        ) : null,
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>教师审核</h2>
      <Tabs activeKey={tab} onChange={setTab} items={[
        { key: 'pending', label: '待审核' },
        { key: 'approved', label: '已通过' },
        { key: 'rejected', label: '已驳回' },
        { key: 'all', label: '全部' },
      ]} />
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />

      <Modal
        title="驳回原因"
        open={!!rejectModal}
        onOk={() => rejectModal && audit(rejectModal.id, false, rejectReason)}
        onCancel={() => setRejectModal(null)}
      >
        <Input.TextArea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="请输入驳回原因" />
      </Modal>
    </div>
  );
}
