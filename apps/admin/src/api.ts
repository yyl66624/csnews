import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export interface DashboardData {
  userCount: number;
  teacherCount: number;
  orderCount: number;
  pendingAudits: number;
  gmv: number;
}

export interface TeacherAuditItem {
  id: number;
  userId: number;
  nickname: string;
  realName: string;
  education: string;
  teachingYears: number;
  auditStatus: string;
  rejectReason: string | null;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  orderNo: string;
  subject: string;
  gradeLevel: string;
  totalAmount: number;
  status: string;
  student: { nickname: string };
  teacher: { nickname: string };
  createdAt: string;
}
