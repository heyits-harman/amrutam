import Fastify from 'fastify';
import cors from '@fastify/cors';
import authValidation from './middleware/authValidation'
import authRoutes from './route/authRoutes';
import userRoutes from './route/userRoutes';
import doctorRoutes from './route/doctorRoutes'
import consultationRoutes from './route/consultationRoutes'

const app = Fastify({
  logger: true,
});

app.register(cors);

//auth
app.register(authRoutes, { prefix: '/auth' });

//admin
app.register(async (adminScope) => {
  app.addHook("preHandler", authValidation);
  adminScope.register(userRoutes);
}, { prefix: '/admin' })

//users
app.register(async (userScope) => {
  app.addHook("preHandler", authValidation);
  userScope.register(userRoutes);
}, { prefix: '/users' })

//doctors
app.register(async (doctorScope) => {
  app.addHook("preHandler", authValidation);
  doctorScope.register(doctorRoutes);
}, { prefix: '/doctors' })

//consultations
app.register(async (consultationScope) => {
  app.addHook("preHandler", authValidation);
  consultationScope.register(consultationRoutes);
}, { prefix: '/consultations' })

export default app;
