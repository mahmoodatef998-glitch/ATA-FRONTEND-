/**
 * Swagger/OpenAPI Configuration
 * API Documentation setup
 */

// @ts-ignore - swagger-jsdoc types may not be perfect
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ATA CRM API',
      version: '1.0.0',
      description: 'Complete CRM system API documentation',
      contact: {
        name: 'ATA CRM Support',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'next-auth.session-token',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
        cookieAuth: [],
      },
    ],
  },
  apis: [
    './app/api/**/*.ts', // Path to API route files
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

