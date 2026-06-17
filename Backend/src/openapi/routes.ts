import { Router } from 'express';
import { getOpenApiDocument } from './spec';

export const openApiRouter = Router();

openApiRouter.get('/openapi.json', (_req, res) => {
  res.type('application/json').send(getOpenApiDocument());
});

export default openApiRouter;

