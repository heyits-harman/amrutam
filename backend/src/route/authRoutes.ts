import type { FastifyInstance } from 'fastify';
import { createUser, loginUser, mfaVerify } from '../controllers/auth';

async function authRoutes(app: FastifyInstance) {
  app.post('/signup', createUser);      //Register new Patients and Doctors
  app.post('/login', loginUser);        //Authenticate user, return JWT, and handle initial MFA challenge if enabled
  app.post('/mfa/verify', mfaVerify);   //Verify MFA token and issue full session token
}

export default authRoutes;
