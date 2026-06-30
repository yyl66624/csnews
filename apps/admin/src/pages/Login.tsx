import { useState } from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: { openid: string }) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/wx-login', {
        code: `dev_${values.openid}`,
        nickname: '管理员',
      });
      if (data.user?.role !== 'admin') {
        message.error('该账号无管理员权限');
        return;
      }
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      message.success('登录成功');
      navigate('/');
    } catch {
      message.error('登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card title="优学家教 · 管理后台登录" style={{ width: 400 }}>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item name="openid" label="管理员 OpenID" rules={[{ required: true }]} initialValue="admin_openid_placeholder">
            <Input placeholder="开发模式：admin_openid_placeholder" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
          <p style={{ color: '#999', fontSize: 12 }}>
            开发模式：OpenID 填 admin_openid_placeholder，对应数据库种子管理员账号。
          </p>
        </Form>
      </Card>
    </div>
  );
}
