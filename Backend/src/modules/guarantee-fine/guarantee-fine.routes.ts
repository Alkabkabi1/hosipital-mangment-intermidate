import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';

const router = Router();

// Placeholder routes - to be implemented like contractor-housing
router.post('/', authenticate, (req, res) => {
  res.status(501).json({ message: 'Guarantee Fine module - under development' });
});

router.get('/my-requests', authenticate, (req, res) => {
  res.status(501).json({ message: 'Guarantee Fine module - under development' });
});

router.get('/', authenticate, requireRoles(['ADMIN', 'HR']), (req, res) => {
  res.status(501).json({ message: 'Guarantee Fine module - under development' });
});

export { router as guaranteeFineRouter };

