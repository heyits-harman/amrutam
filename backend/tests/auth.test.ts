import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../lib/prisma';

beforeAll(async () => {
  await app.ready();
});

afterAll(async () => {
  await prisma.$disconnect();
  await app.close();
});

describe('Authentication & RBAC Enforcement', () => {
  it('1. Should fail login with incorrect password', async () => {
    const res = await request(app.server)
      .post('/api/v1/auth/login')
      .send({
        email: 'rahul.verma@example.com',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('2. Should return JWT access token for valid login', async () => {
    const res = await request(app.server)
      .post('/api/v1/auth/login')
      .send({
        email: 'rahul.verma@example.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('3. Should block unauthorized access to protected doctor routes (RBAC check)', async () => {
    // Attempting to post slots without a token
    const res = await request(app.server)
      .post('/api/v1/doctors/slots')
      .send({
        slots: [
          {
            startTime: '2026-10-01T10:00:00.000Z',
            endTime: '2026-10-01T10:30:00.000Z',
          },
        ],
      });

    expect(res.status).toBe(401); // Unauthorized
  });
});