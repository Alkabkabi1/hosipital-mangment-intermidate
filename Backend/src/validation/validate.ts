import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
      return res.status(422).json({ error: 'UNPROCESSABLE', details });
    }
    (req as any).validated = { ...(req as any).validated, body: result.data };
    next();
  };
}

