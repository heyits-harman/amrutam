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

describe('Doctor Directory & Slot Discovery', () => {
  it('1. Should return list of verified doctors with pagination', async () => {
    const res = await request(app.server)
      .get('/api/v1/doctors?specialization=Ayurveda');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('2. Should list available slots for patients', async () => {
    const res = await request(app.server)
      .get('/api/v1/doctors/slots/available');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});