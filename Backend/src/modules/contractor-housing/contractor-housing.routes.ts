import { Router } from 'express';
import { ContractorHousingController } from './contractor-housing.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';

const router = Router();

// Employee routes
router.post('/', authenticate, ContractorHousingController.create);
router.get('/my-requests', authenticate, ContractorHousingController.getMyRequests);

// Admin routes
router.get('/', authenticate, requireRoles(['ADMIN', 'HR']), ContractorHousingController.getAll);
router.get('/statistics', authenticate, requireRoles(['ADMIN', 'HR']), ContractorHousingController.getStatistics);
router.get('/:id', authenticate, ContractorHousingController.getById);
router.patch('/:id/status', authenticate, requireRoles(['ADMIN', 'HR']), ContractorHousingController.updateStatus);
router.delete('/:id', authenticate, requireRoles(['ADMIN']), ContractorHousingController.delete);

export { router as contractorHousingRouter };

