import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import * as credentialsController from './credentials.controller';

const router = Router();

// Certificate routes (employee only)
router.post('/certificates', authenticate, credentialsController.createCertificateController);
router.get('/certificates', authenticate, credentialsController.getMyCertificatesController);
router.delete('/certificates/:id', authenticate, credentialsController.deleteCertificateController);

// License routes (employee only)
// Admin route MUST come before /licenses to avoid matching /licenses/:id
router.get('/licenses/expiring', authenticate, requireRoles(['ADMIN', 'HR']), credentialsController.getExpiringLicensesController);
router.post('/licenses', authenticate, credentialsController.createLicenseController);
router.get('/licenses', authenticate, credentialsController.getMyLicensesController);
router.delete('/licenses/:id', authenticate, credentialsController.deleteLicenseController);

// Admin approval routes (admin/HR only)
router.get('/admin/pending-credentials', authenticate, requireRoles(['ADMIN', 'HR']), credentialsController.getPendingCredentialsGroupedController);
router.get('/admin/pending-certificates', authenticate, requireRoles(['ADMIN', 'HR']), credentialsController.getPendingCertificatesController);
router.get('/admin/pending-licenses', authenticate, requireRoles(['ADMIN', 'HR']), credentialsController.getPendingLicensesController);
router.post('/admin/certificates/:id/approve', authenticate, requireRoles(['ADMIN', 'HR']), credentialsController.approveCertificateController);
router.post('/admin/certificates/:id/reject', authenticate, requireRoles(['ADMIN', 'HR']), credentialsController.rejectCertificateController);
router.post('/admin/licenses/:id/approve', authenticate, requireRoles(['ADMIN', 'HR']), credentialsController.approveLicenseController);
router.post('/admin/licenses/:id/reject', authenticate, requireRoles(['ADMIN', 'HR']), credentialsController.rejectLicenseController);

// Admin routes to view any employee's credentials
router.get('/admin/employees/:employeeId/certificates', authenticate, requireRoles(['ADMIN', 'HR']), credentialsController.getEmployeeCertificatesController);
router.get('/admin/employees/:employeeId/licenses', authenticate, requireRoles(['ADMIN', 'HR']), credentialsController.getEmployeeLicensesController);

export default router;

