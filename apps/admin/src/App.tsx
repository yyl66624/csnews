import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  AuditOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import TeacherAudit from './pages/TeacherAudit';
import UserManage from './pages/UserManage';
import OrderManage from './pages/OrderManage';
import Login from './pages/Login';

const { Header, Sider, Content } = Layout;

function AppLayout() {
  const location = useLocation();
  const token = localStorage.getItem('admin_token');

  if (!token) return <Navigate to="/login" replace />;

  // 角色校验：非 admin 角色拒绝访问管理后台
  try {
    const userStr = localStorage.getItem('admin_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user?.role !== 'admin') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      alert('无管理员权限，请使用管理员账号登录');
      return <Navigate to="/login" replace />;
    }
  } catch {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    return <Navigate to="/login" replace />;
  }

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: <Link to="/">数据看板</Link> },
    { key: '/teachers', icon: <AuditOutlined />, label: <Link to="/teachers">教师审核</Link> },
    { key: '/users', icon: <UserOutlined />, label: <Link to="/users">用户管理</Link> },
    { key: '/orders', icon: <ShoppingOutlined />, label: <Link to="/orders">订单管理</Link> },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={220}>
        <div style={{ color: '#fff', padding: '16px 24px', fontSize: 18, fontWeight: 'bold' }}>
          优学家教
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menuItems} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', fontSize: 16 }}>
          一对一家教平台 · 管理后台
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/teachers" element={<TeacherAudit />} />
            <Route path="/users" element={<UserManage />} />
            <Route path="/orders" element={<OrderManage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
