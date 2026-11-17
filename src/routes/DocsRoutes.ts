import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../docs/SwaggerSpec.js';

export const createDocsRouter = (): Router => {
  const router = Router();

  router.use((_request, response, next) => {
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;",
    );
    next();
  });

  router.get('/json', (_request, response) => {
    response.json(swaggerSpec);
  });

  router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  return router;
};
