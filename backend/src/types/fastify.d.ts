import { Role } from "@prisma/client";
import "@fastify/jwt";

declare module "fastify" {
  interface FastifyRequest {
    user: {
      id: string;
      role: Role;
    };
  }
  interface FastifyInstance {
    jwt: {
      sign(payload: object, options?: object): string;
      verify<T = object>(token: string, options?: object): T;
    };
  }
}
