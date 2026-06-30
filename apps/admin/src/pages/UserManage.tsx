import { useEffect, useState } from 'react';
import { Table, Tag, Tabs } from 'antd';
import api from '../api';

export default function UserManage() {
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('student');

  useEffect(() => {
    setLoading(true);
    api.get('/admin/users', { params: { role: tab } })
      .then((res) => setData(res.data.items))
      .finally(() => setLoading(false));
  }, [tab]);

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '昵称', dataIndex: 'nickname', key: 'nickname' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (r: string) => {
        const map: Record<string, string> = { student: '学生', teacher: '教师', admin: '管理员' };
        return <Tag>{map[r] || r}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '正常' : '禁用'}</Tag>,
    },
    { title: '注册时间', dataIndex: 'createdAt', key: 'createdAt' },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>用户管理</h2>
      <Tabs activeKey={tab} onChange={setTab} items={[
        { key: 'student', label: '学生/家长' },
        { key: 'teacher', label: '教师' },
        { key: 'admin', label: '管理员' },
      ]} />
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
    </div>
  );
}
