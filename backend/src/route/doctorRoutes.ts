import type { FastifyInstance } from 'fastify';
import { requireRole } from '../middleware/role'

async function doctorRoutes(app: FastifyInstance){

  app.get('/', { preHandler: requireRole('PATIENT') }, async (_request, reply) => {
    return reply.status(200).send({ message: 'Search and filter doctors by specialization, experience etc' });
  });         //Search and filter doctors by specialization, experience etc

  app.get('/:id', { preHandler: requireRole('PATIENT') }, async (_request, reply) => {
    return reply.status(200).send({ message: 'Fetch doctor details alongside their active schedules' });
  });         //Fetch doctor details alongside their active schedules

  app.post('/slots', { preHandler: requireRole('DOCTOR') }, async (_request, reply) => {
    return reply.status(201).send({ message: 'Bulk-create upcoming availability time slots' });
  });         //Bulk-create upcoming availability time slots

  app.get('/slots/available', { preHandler: requireRole('PATIENT') }, async (_request, reply) => {
    return reply.status(200).send({ message: 'Query available slots across dates and specializations' });
  });         //Query available slots across dates and specializations.

  app.delete('/slots/:id', { preHandler: requireRole('DOCTOR') }, async (_request, reply) => {
    return reply.status(200).send({ message: 'Delete availability slot' });
  });         //Cancle Booking
}

export default doctorRoutes;