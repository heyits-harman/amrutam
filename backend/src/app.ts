import Fastify from 'fastify';
import cors from '@fastify/cors';
import userRoutes from './route/userRoutes';

const app = Fastify({
  logger: true,
});

app.register(cors);

app.register(userRoutes, { prefix: '/users' });

export default app;
