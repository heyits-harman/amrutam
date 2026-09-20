import type { FastifyRequest, FastifyReply } from "fastify";

type Role = "ADMIN" | "PATIENT" | "DOCTOR";

// Accept multiple allowed roles
export function requireRole(...allowedRoles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userRole = request.user?.role;

    // Check if the user's role is in the list of allowed roles
    if (!userRole || !allowedRoles.includes(userRole)) {
      return reply.status(403).send({ 
        error: `Forbidden: Access requires one of the following roles: ${allowedRoles.join(", ")}` 
      });
    }
  };
}