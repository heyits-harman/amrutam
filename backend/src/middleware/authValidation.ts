import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

export const authValidation = async (request: FastifyRequest, reply: FastifyReply) => {
  const authHeader = request.headers.authorization || request.headers.Authorization;

  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const secret = process.env.ACCESS_TOKEN || '';

    return new Promise<void>((resolve, reject) => {
      jwt.verify(token!, secret, (err, decoded: any) => {
        if (err || !decoded) {
          reply.status(401).send({ error: 'User not Authorized!' });
          return reject(new Error('Unauthorized'));
        }

        request.user = {
          id: decoded.id,
          role: decoded.role
        };
        resolve();
      });
    });
  } else {
    reply.status(401).send({ error: 'Token not provided or token format invalid!' });
    throw new Error('Token not provided');
  }
};