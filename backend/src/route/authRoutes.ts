import type { FastifyInstance } from 'fastify';
import { createUserHandler, loginUserHandler, verifyMfaHandler } from '../controllers/auth';
import { registerSchema, loginSchema, verifyMfaSchema } from '../validations/authSchema'

async function authRoutes(app: FastifyInstance) {
  app.post('/register', { schema: registerSchema }, createUserHandler);      //Register new Patients and Doctors
  app.post('/login', { schema: loginSchema }, loginUserHandler);        //Authenticate user, return JWT, and handle initial MFA challenge if enabled
  app.post('/mfa/verify', { schema: verifyMfaSchema }, verifyMfaHandler);   //Verify MFA token and issue full session token
}

export default authRoutes;
