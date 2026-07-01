import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export async function devLogin(
  app: INestApplication,
  code: string,
  nickname?: string,
): Promise<{ token: string; user: { id: number; role: string } }> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/wx-login')
    .send({ code, nickname: nickname || '测试用户' })
    .expect(201);

  return { token: res.body.token, user: res.body.user };
}

export function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function futureLessonDate(days = 7): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
