import type { FastifyInstance } from 'fastify';
import { requireRole } from '../middleware/role'

async function consultationRoutes(app: FastifyInstance){

  app.post('/book', { preHandler: requireRole('PATIENT') }, async (_request, reply) => {
    return reply.status(201).send({ message: 'Atomic reservation of a time slot' });
  });         //Atomic reservation of a time slot (Requires Idempotency-Key header)

  app.get('/', async (_request, reply) => {
    return reply.status(200).send({ message: 'Get paginated list of consultations' });
  });         //Get paginated list of consultations (filtered by role: Patient/Doctor

  app.get('/:id', async (_request, reply) => {
    return reply.status(200).send({ message: 'Retrieve single consultation details' });
  });         //Retrieve single consultation details

  app.patch('/:id/cancel', { preHandler: requireRole('PATIENT', 'DOCTOR') }, async (_request, reply) => {
    return reply.status(200).send({ message: 'Cancel booking and release availability slot' });
  });         //Cancel booking and release availability slot

  app.patch('/:id/complete', { preHandler: requireRole('DOCTOR') }, async (_request, reply) => {
    return reply.status(200).send({ message: 'Mark consultation as completed' });
  });         //Mark consultation as completed.

  app.post('/:id/prescription', { preHandler: requireRole('DOCTOR') }, async (_request, reply) => {
    return reply.status(201).send({ message: 'Issue digital prescription with medicine payload' });
  });         //Issue digital prescription with medicine payload

  app.get('/:id/prescription', { preHandler: requireRole('PATIENT', 'DOCTOR') }, async (_request, reply) => {
    return reply.status(200).send({ message: 'Fetch consultation prescription details' });
  });         //Fetch consultation prescription details

}

export default consultationRoutes;