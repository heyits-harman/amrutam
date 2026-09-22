import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../lib/prisma';

let patientToken: string;
let availableSlotId: string;

beforeAll(async () => {
  await app.ready();

  // 1. Authenticate Patient
  const loginRes = await request(app.server)
    .post('/api/v1/auth/login')
    .send({
      email: 'rahul.verma@example.com',
      password: 'Password123!',
    });

  patientToken = loginRes.body.token;

  // 2. Fetch an available slot
  const slotRes = await request(app.server)
    .get('/api/v1/doctors/slots/available');

  if (slotRes.body.data && slotRes.body.data.length > 0) {
    availableSlotId = slotRes.body.data[0].id;
  }
});

afterAll(async () => {
  await prisma.$disconnect();
  await app.close();
});

describe('Consultation Booking & Idempotency Flow', () => {
  const testIdempotencyKey = `test-key-${Date.now()}`;

  it('1. Should successfully book an available slot', async () => {
    if (!availableSlotId) return;

    const res = await request(app.server)
      .post('/api/v1/consultations/book')
      .set('Authorization', `Bearer ${patientToken}`)
      .set('Idempotency-Key', testIdempotencyKey)
      .send({
        slotId: availableSlotId,
        notes: 'Integration test booking',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
  });

  it('2. Should return cached response for duplicate request (Idempotency check)', async () => {
    if (!availableSlotId) return;

    // Send identical request with exact same Idempotency-Key
    const res = await request(app.server)
      .post('/api/v1/consultations/book')
      .set('Authorization', `Bearer ${patientToken}`)
      .set('Idempotency-Key', testIdempotencyKey)
      .send({
        slotId: availableSlotId,
        notes: 'Integration test booking',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('3. Should reject booking an already booked slot with new key (Concurrency check)', async () => {
    if (!availableSlotId) return;

    const res = await request(app.server)
      .post('/api/v1/consultations/book')
      .set('Authorization', `Bearer ${patientToken}`)
      .set('Idempotency-Key', `new-key-${Date.now()}`)
      .send({
        slotId: availableSlotId,
        notes: 'Attempting double booking',
      });

    expect(res.status).toBe(409); // Conflict
    expect(res.body.success).toBe(false);
  });
});