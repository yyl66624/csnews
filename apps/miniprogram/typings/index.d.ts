export interface IUserInfo {
  id: number;
  openid: string;
  nickname: string;
  avatarUrl: string | null;
  phone: string | null;
  role: 'student' | 'teacher' | 'admin';
}

export interface ITeacher {
  id: number;
  nickname: string;
  avatarUrl: string | null;
  realName: string;
  education: string;
  teachingYears: number;
  teachingStyle: string;
  rating: number;
  reviewCount: number;
  city: string;
  minPrice: number;
  subjects: Array<{ subject: string; gradeLevel: string; price: number }>;
}

export interface IOrder {
  id: number;
  orderNo: string;
  subject: string;
  gradeLevel: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  lessonFee: number;
  serviceFee: number;
  totalAmount: number;
  status: string;
  teacher?: { id: number; nickname: string; avatarUrl: string | null };
  student?: { id: number; nickname: string; avatarUrl: string | null };
  payment?: { payStatus: string };
}

interface IAppOption {
  globalData: {
    userInfo: IUserInfo | null;
    token: string;
    apiBase: string;
  };
}

export type { IAppOption };
