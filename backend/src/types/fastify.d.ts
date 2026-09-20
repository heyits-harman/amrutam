import { Role } from "../../generated/prisma/enums";

declare module "fastify" {
  interface FastifyRequest {
    user: {
      id: string;
      role: Role;
    };
  }
}
