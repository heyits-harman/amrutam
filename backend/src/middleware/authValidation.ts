import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const authValidation = async (req: FastifyRequest, res: FastifyReply) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const secret = process.env.ACCESS_TOKEN || '';

    return new Promise<void>((resolve) => {
      jwt.verify(token!, secret, (err, decoded: any) => {
        if (err || !decoded) {
          res.status(401).send({ error: 'User not Authorized!' });
          return;
        }

        req.user = {
          id: decoded.id,
          role: decoded.role
        };
        resolve();
      });
    });
  } else {
    res.status(401).send({ error: 'Token not provided or token format invalid!' });
  }
};

export default authValidation;
