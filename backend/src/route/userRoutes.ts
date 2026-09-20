import type { FastifyInstance } from 'fastify';
import { getMeHandler, updateProfileHandler, setupMfaHandler, enableMfaHandler } from '../controllers/user';
import { enableMfaSchema } from '../validations/userSchema';

async function userRoutes(app: FastifyInstance){
  app.get('/me', getMeHandler);
  app.put('/me/profile', updateProfileHandler);

  // MFA Setup Endpoints
  app.post('/mfa/setup', setupMfaHandler);
  app.post('/mfa/enable', { schema: enableMfaSchema }, enableMfaHandler);
}

export default userRoutes;