import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../lib/prisma'

export async function checkIdempotency(request: FastifyRequest, reply: FastifyReply) {
  const idempotencyKey = request.headers['idempotency-key'] as string;

  if (!idempotencyKey) {
    return reply.status(400).send({
      success: false,
      message: 'Idempotency-Key header is required for booking operations',
    });
  }

  // Check if this request key was already processed
  const existingAudit = await prisma.auditLog.findFirst({
    where: {
      action: `IDEMPOTENCY_KEY:${idempotencyKey}`,
    },
  });

  if (existingAudit && existingAudit.metadata) {
    const cachedResponse = existingAudit.metadata as { status: number; body: any };
    return reply.status(cachedResponse.status).send(cachedResponse.body);
  }
}