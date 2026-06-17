import type { RequestHandler } from 'express';
import multer from 'multer';

const formDataParser = multer().none();

export const parseOptionalFormData: RequestHandler = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    formDataParser(req, res, next);
    return;
  }
  next();
};
