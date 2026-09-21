import type { FastifyInstance } from 'fastify';
import { requireRole } from '../middleware/role';
import {
  getAnalyticsHandler,
  getAuditLogsHandler,
} from '../controllers/admin';

async function adminRoutes(app: FastifyInstance){
  app.get('/analytics', { preHandler: requireRole('ADMIN') }, getAnalyticsHandler);
  app.get('/audit-logs', { preHandler: requireRole('ADMIN') }, getAuditLogsHandler);
}

export default adminRoutes;