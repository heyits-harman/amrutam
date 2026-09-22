import Fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
} from 'fastify-type-provider-zod';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

import authRoutes from './route/authRoutes';
import userRoutes from './route/userRoutes';
import doctorRoutes from './route/doctorRoutes';
import consultationRoutes from './route/consultationRoutes';
import adminRoutes from './route/adminRoutes';

const app = Fastify({
  logger: true,
});

// Enable CORS
app.register(cors);

// Enable Zod validation & serialization compilers
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Register Swagger OpenAPI with Zod Schema Transformer
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Amrutam Telemedicine API',
      description:
        'Production-grade backend API for doctor availability, booking, consultations, and digital prescriptions.',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token to access protected endpoints',
        },
      },
    },
  },
  transform: jsonSchemaTransform, // Converts Zod schemas to OpenAPI JSON schemas automatically
});

// Register Swagger UI at /docs
app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false,
  },
  staticCSP: true,
});

// Register Application Routes with /api/v1 Prefixes
app.register(authRoutes, { prefix: '/api/v1/auth' });
app.register(userRoutes, { prefix: '/api/v1/users' });
app.register(doctorRoutes, { prefix: '/api/v1/doctors' });
app.register(consultationRoutes, { prefix: '/api/v1/consultations' });
app.register(adminRoutes, { prefix: '/api/v1/admin' });

// Health Check
app.get('/health', async () => ({ status: 'ok', timestamp: new Date() }));

export default app;