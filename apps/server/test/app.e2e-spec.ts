import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { auth, devLogin, futureLessonDate } from './e2e.helpers';

describe('CSNews API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.DB_PATH = ':memory:';
    process.env.NODE_ENV = 'test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('基础接口', () => {
    it('GET /api/health 存活检查', async () => {
      const res = await request(app.getHttpServer()).get('/api/health').expect(200);
      expect(res.body.status).toBe('ok');
    });

    it('GET /api/health/payments 支付配置状态', async () => {
      const res = await request(app.getHttpServer()).get('/api/health/payments').expect(200);
      expect(res.body.mode).toBeDefined();
      expect(Array.isArray(res.body.missing)).toBe(true);
    });

    it('GET /api/teachers 返回教师列表', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/teachers?page=1&pageSize=5')
        .expect(200);
      expect(res.body.items.length).toBeGreaterThan(0);
    });

    it('统一错误响应格式', async () => {
      const { token } = await devLogin(app, 'dev_e2e_errfmt');
      const res = await request(app.getHttpServer())
        .get('/api/orders/99999')
        .set(auth(token))
        .expect(404);
      expect(res.body.code).toBeDefined();
      expect(res.body.message).toBeDefined();
    });
  });

  describe('P0#2 学生全链路：搜索 → 预约 → 支付 → 评价', () => {
    it('完整流程', async () => {
      const student = await devLogin(app, 'dev_e2e_student_flow', '流程测试学生');

      const teachers = await request(app.getHttpServer())
        .get('/api/teachers?page=1&pageSize=1&subject=数学')
        .expect(200);
      const teacher = teachers.body.items[0];
      expect(teacher).toBeDefined();

      const orderRes = await request(app.getHttpServer())
        .post('/api/orders')
        .set(auth(student.token))
        .send({
          teacherId: teacher.id,
          subject: '数学',
          gradeLevel: '初中',
          lessonDate: futureLessonDate(),
          startTime: '09:00',
          endTime: '11:00',
          requirement: 'E2E测试预约',
        })
        .expect(201);

      const orderId = orderRes.body.id;
      expect(orderId).toBeDefined();

      await request(app.getHttpServer())
        .post(`/api/payments/mock-success/${orderId}`)
        .set(auth(student.token))
        .expect(201);

      const teacherLogin = await devLogin(app, 'dev_teacher_001', '张老师');
      await request(app.getHttpServer())
        .put(`/api/orders/${orderId}/confirm`)
        .set(auth(teacherLogin.token))
        .expect(200);

      await request(app.getHttpServer())
        .put(`/api/orders/${orderId}/complete`)
        .set(auth(teacherLogin.token))
        .expect(200);

      const reviewRes = await request(app.getHttpServer())
        .post('/api/reviews')
        .set(auth(student.token))
        .send({
          orderId,
          rating: 5,
          content: 'E2E测试评价，老师很好',
          tags: ['耐心'],
        })
        .expect(201);

      expect(reviewRes.body.rating).toBe(5);

      const detail = await request(app.getHttpServer())
        .get(`/api/orders/${orderId}`)
        .set(auth(student.token))
        .expect(200);
      expect(detail.body.status).toBe('completed');
    });
  });

  describe('P0#3 教师+管理员全链路：入驻 → 审核 → 接单 → 完成', () => {
    it('完整流程', async () => {
      const applicant = await devLogin(app, 'dev_e2e_teacher_apply', '新教师申请');

      await request(app.getHttpServer())
        .post('/api/teachers/apply')
        .set(auth(applicant.token))
        .send({
          realName: '赵测试',
          idCard: '110101199001011234',
          education: '本科',
          teachingYears: 3,
          bio: 'E2E测试教师',
          teachingStyle: '耐心',
          city: '北京',
          subjects: [{ subject: '语文', gradeLevel: '小学', price: 100 }],
          schedules: [{ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }],
        })
        .expect(201);

      const admin = await devLogin(app, 'dev_admin_openid_placeholder', '管理员');
      const pending = await request(app.getHttpServer())
        .get('/api/admin/teachers?auditStatus=pending')
        .set(auth(admin.token))
        .expect(200);

      const profile = pending.body.items.find(
        (t: { userId: number }) => t.userId === applicant.user.id,
      );
      expect(profile).toBeDefined();

      await request(app.getHttpServer())
        .put(`/api/admin/teachers/${profile.id}/audit`)
        .set(auth(admin.token))
        .send({ approved: true })
        .expect(200);

      const teacher = await devLogin(app, 'dev_e2e_teacher_apply', '新教师申请');

      const student = await devLogin(app, 'dev_e2e_student_teacher_flow', '下单学生');
      const orderRes = await request(app.getHttpServer())
        .post('/api/orders')
        .set(auth(student.token))
        .send({
          teacherId: applicant.user.id,
          subject: '语文',
          gradeLevel: '小学',
          lessonDate: futureLessonDate(3),
          startTime: '10:00',
          endTime: '11:00',
        })
        .expect(201);

      const orderId = orderRes.body.id;
      await request(app.getHttpServer())
        .post(`/api/payments/mock-success/${orderId}`)
        .set(auth(student.token))
        .expect(201);

      await request(app.getHttpServer())
        .put(`/api/orders/${orderId}/confirm`)
        .set(auth(teacher.token))
        .expect(200);

      await request(app.getHttpServer())
        .put(`/api/orders/${orderId}/complete`)
        .set(auth(teacher.token))
        .expect(200);

      const order = await request(app.getHttpServer())
        .get(`/api/orders/${orderId}`)
        .set(auth(student.token))
        .expect(200);
      expect(order.body.status).toBe('completed');
    });
  });

  describe('P0#4 敏感信息脱敏', () => {
    it('公开教师详情姓名脱敏', async () => {
      const list = await request(app.getHttpServer()).get('/api/teachers?page=1&pageSize=1').expect(200);
      const teacherId = list.body.items[0].id;
      const detail = await request(app.getHttpServer()).get(`/api/teachers/${teacherId}`).expect(200);
      expect(detail.body.realName).toMatch(/^./);
      if (detail.body.realName.length > 1) {
        expect(detail.body.realName).toContain('*');
      }
    });
  });
});
