import type { FastifyInstance } from 'fastify';
import { requireRole } from '../middleware/role'

async function adminRoutes(app: FastifyInstance){
  app.get('/analytics', { preHandler: requireRole('ADMIN') }, async (_request, reply) => {
    return reply.status(200).send({ message: 'Aggregate metrics (daily consultation volume, total revenue, doctor load)' });
  });
  app.get('/audit-logs', { preHandler: requireRole('ADMIN') }, async (_request, reply) => {
    return reply.status(200).send({ message: 'Query system security and compliance audit trails' });
  });
}

export default adminRoutes;