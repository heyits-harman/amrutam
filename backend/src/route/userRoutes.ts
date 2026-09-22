import type { FastifyInstance } from 'fastify';
import { authValidation } from '../middleware/authValidation'
import { getMeHandler, updateProfileHandler, setupMfaHandler, enableMfaHandler } from '../controllers/user';
import { enableMfaSchema, updateProfileSchema } from '../validations/userSchema';

async function userRoutes(app: FastifyInstance){
  app.get('/me', { preHandler: authValidation }, getMeHandler);

  app.put('/me/profile', { preHandler: authValidation, schema: updateProfileSchema }, updateProfileHandler);

  // MFA Setup Endpoints
  app.post('/mfa/setup', setupMfaHandler);
  app.post('/mfa/enable', { schema: enableMfaSchema }, enableMfaHandler);
}

export default userRoutes;