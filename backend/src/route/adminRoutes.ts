import type { FastifyInstance } from 'fastify';
import { requireRole } from '../middleware/role';
import { authValidation } from '../middleware/authValidation'
import {
  getAnalyticsHandler,
  getAuditLogsHandler,
} from '../controllers/admin';

async function adminRoutes(app: FastifyInstance){

  // AUth Middleware
  app.addHook('preHandler', authValidation);

  app.get('/analytics', { preHandler: requireRole('ADMIN') }, getAnalyticsHandler);
  app.get('/audit-logs', { preHandler: requireRole('ADMIN') }, getAuditLogsHandler);
}

export default adminRoutes;