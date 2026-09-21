import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authValidation } from './middleware/authValidation'
import authRoutes from './route/authRoutes';
import userRoutes from './route/userRoutes';
import doctorRoutes from './route/doctorRoutes'
import consultationRoutes from './route/consultationRoutes'
import adminRoutes from './route/adminRoutes'

const app = Fastify({
  logger: true,
});

app.register(cors);

//auth
app.register(authRoutes, { prefix: '/auth' });

//admin
app.register(async (adminScope) => {
  await adminScope.addHook("preHandler", authValidation);
  adminScope.register(adminRoutes);
}, { prefix: '/admin' })

//users
app.register(async (userScope) => {
  await userScope.addHook("preHandler", authValidation);
  userScope.register(userRoutes);
}, { prefix: '/users' })

//doctors
app.register(async (doctorScope) => {
  await doctorScope.addHook("preHandler", authValidation);
  doctorScope.register(doctorRoutes);
}, { prefix: '/doctors' })

//consultations
app.register(async (consultationScope) => {
  await consultationScope.addHook("preHandler", authValidation);
  consultationScope.register(consultationRoutes);
}, { prefix: '/consultations' })

//Health CHeck
app.get('/health', async () => ({ status: 'ok', timestamp: new Date() }));

export default app;
