import type { FastifyInstance } from 'fastify';

async function userRoutes(app: FastifyInstance){
  app.get('/me', async (_request, reply) => {
    // Placeholder Controller.
    return reply.send();
  });
  app.put('/me/profile', async (_request, reply) => {
    // Placeholder Controller.
    return reply.send();
  });
}

export default userRoutes;