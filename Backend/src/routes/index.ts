import { Router } from 'express';

import { authRouter } from '../modules/auth/auth.routes';
import { adminRouter } from '../modules/admin/admin.routes';
import { clearanceRouter } from '../modules/clearance/clearance.routes';
import { delegationRouter } from '../modules/delegation/delegation.routes';
import { onboardingRouter } from '../modules/onboarding/onboarding.routes';
import { profileRouter } from '../modules/profile/profile.routes';
import { roleRouter } from '../modules/roles/role.routes';
import { usersRouter } from '../modules/users/users.routes';
import { uploadRouter } from '../modules/upload/upload.routes';
import { employeeRequestsRouter } from '../modules/employee-requests/employee-requests.routes';

// ADD MISSING ROUTE IMPORTS:
import { assignmentRouter } from '../modules/assignment/assignment.routes';
import { assignmentTerminationRouter } from '../modules/assignment-termination/assignment-termination.routes';
import { certificateRouter } from '../modules/certificate/certificate.routes';
import { experienceRouter } from '../modules/experience/experience.routes';
import { internalTransferRouter } from '../modules/internal-transfer/internal-transfer.routes';
import { exitRouter } from '../modules/exit/exit.routes';
import leaveRouter from '../modules/leave/leave.routes';
import multiApprovalRouter from '../modules/multi-approval/multi-approval.routes';
import credentialsRouter from '../modules/credentials/credentials.routes';
import jobDescriptionsRouter from '../modules/job-descriptions/job-descriptions.routes';
import jobDescriptionsAdminRouter from '../modules/job-descriptions/job-descriptions-admin.routes';
import { commissionerTicketsRouter } from '../modules/commissioner/tickets.routes';
import { maternityLeaveRouter } from '../modules/maternity-leave/maternity-leave.routes';
import { housingAllowanceRouter } from '../modules/housing-allowance/housing-allowance.routes';
import { travelOrderRouter } from '../modules/travel-order/travel-order.routes';
import { rewardRefundRouter } from '../modules/reward-refund/reward-refund.routes';
import { airlinesTicketRouter } from '../modules/airlines-ticket/airlines-ticket.routes';

// New employee forms
import { contractorHousingRouter } from '../modules/contractor-housing/contractor-housing.routes';
import { guaranteeDetailedRouter } from '../modules/guarantee-detailed/guarantee-detailed.routes';
import { guaranteeFineRouter } from '../modules/guarantee-fine/guarantee-fine.routes';
import { guaranteePublicLawRouter } from '../modules/guarantee-public-law/guarantee-public-law.routes';
import { saudiTicketCompensationRouter } from '../modules/saudi-ticket-compensation/saudi-ticket-compensation.routes';
import { ticketCompensationRouter } from '../modules/ticket-compensation/ticket-compensation.routes';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Register specific routes FIRST (more specific routes before general ones)
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/admin', jobDescriptionsAdminRouter); // Admin job descriptions routes

// Request type specific routes (CRITICAL: before employee requests catch-all)
apiRouter.use('/assignment', assignmentRouter);
apiRouter.use('/assignment-termination', assignmentTerminationRouter);
apiRouter.use('/certificate', certificateRouter);
apiRouter.use('/experience-certificate', experienceRouter);
apiRouter.use('/internal-transfer', internalTransferRouter);
apiRouter.use('/exit', exitRouter);
apiRouter.use('/leave-request', leaveRouter);
apiRouter.use('/multi-approval', multiApprovalRouter);
apiRouter.use('/approvals', multiApprovalRouter); // Alias for /approvals/pending compatibility
apiRouter.use('/commissioner/tickets', commissionerTicketsRouter);
apiRouter.use('/maternity-leave', maternityLeaveRouter);
apiRouter.use('/housing-allowance', housingAllowanceRouter);
apiRouter.use('/travel-order', travelOrderRouter);
apiRouter.use('/reward-refund', rewardRefundRouter);
apiRouter.use('/airlines-ticket', airlinesTicketRouter);
apiRouter.use('/contractor-housing', contractorHousingRouter);
apiRouter.use('/guarantee-detailed', guaranteeDetailedRouter);
apiRouter.use('/guarantee-fine', guaranteeFineRouter);
apiRouter.use('/guarantee-public-law', guaranteePublicLawRouter);
apiRouter.use('/saudi-ticket-compensation', saudiTicketCompensationRouter);
apiRouter.use('/ticket-compensation', ticketCompensationRouter);

// Other specific routes
apiRouter.use('/clearance', clearanceRouter);
apiRouter.use('/delegation', delegationRouter);
apiRouter.use('/onboarding', onboardingRouter);
apiRouter.use('/roles', roleRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/profile', profileRouter);
apiRouter.use('/upload', uploadRouter);
apiRouter.use('/employee', credentialsRouter); // For /employee/admin/pending-credentials
apiRouter.use('/employee', jobDescriptionsRouter); // For employee job descriptions

// Employee requests router LAST (catch-all with '/' - will handle anything not matched above)
apiRouter.use('/', employeeRequestsRouter);
