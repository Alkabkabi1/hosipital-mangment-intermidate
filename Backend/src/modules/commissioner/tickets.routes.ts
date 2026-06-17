import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles as coreRequireRoles } from '../../core/middleware/requireRoles';
import { createTicketController, revokeTicketController, listMyTicketsController, getTicketController, listAllTicketsController } from './tickets.controller';

export const commissionerTicketsRouter = Router();

commissionerTicketsRouter.use(authenticate);

// Issue / revoke tickets (ADMIN, MANAGER, HR)
const adminish = coreRequireRoles(['ADMIN', 'MANAGER', 'HR']);
commissionerTicketsRouter.post('/', adminish, createTicketController);
commissionerTicketsRouter.post('/:id/revoke', adminish, revokeTicketController);

// Get all tickets (ADMIN, MANAGER, HR)
commissionerTicketsRouter.get('/all', adminish, listAllTicketsController);

// Subject can view their active tickets
commissionerTicketsRouter.get('/mine', listMyTicketsController);

// ADMIN-only details
commissionerTicketsRouter.get('/:id', coreRequireRoles(['ADMIN']), getTicketController);

