import type { FastifyInstance } from 'fastify';
import { requireRole } from '../middleware/role'

async function adminRoutes(app: FastifyInstance){
  app.get('/analytics', requireRole('ADMIN'));    //Aggregate metrics (daily consultation volume, total revenue, doctor load)
  app.get('/audit-logs', requireRole('ADMIN'));   //Query system security and compliance audit trails
}

export default adminRoutes;