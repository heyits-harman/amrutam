import type { FastifyInstance } from 'fastify';
import { createUser, loginUser } from '../controllers/user';
import authValidation from '../middleware/auth';

async function userRoutes(app: FastifyInstance) {
  app.post('/signup', createUser);
  app.post('/login', loginUser);
}

export default userRoutes;
