import type { RequestHandler } from 'express';
import { AppError } from '../../core/errors';
import { withConnection } from '../../core/database';

/**
 * Get employee's own requests summary
 * GET /api/employee/requests/summary
 */
export const getMyRequestsSummaryController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }
    
    const summary = await getEmployeeRequestsSummary(req.auth.sub);
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

/**
 * Get summary of all requests for a specific employee
 */
async function getEmployeeRequestsSummary(userId: number) {
  return withConnection(async (conn) => {
    const summary = {
      total_requests: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      today_requests: 0,
      breakdown_by_type: [] as any[],
      recent_requests: [] as any[]
    };

    // Define all request types with their table and status column
    const requestTypes = [
      { type: 'clearance', table: 'Clearance_Requests', name: 'إخلاء طرف' },
      { type: 'onboarding', table: 'Onboarding_Requests', name: 'مباشرة عمل' },
      { type: 'certificate', table: 'Certificate_Requests', name: 'شهادة تعريف' },
      { type: 'experience', table: 'Experience_Certificate_Requests', name: 'شهادة خبرة' },
      { type: 'delegation', table: 'Delegation_Requests', name: 'انتداب' },
      { type: 'assignment', table: 'Assignment_Requests', name: 'تكليف' },
      { type: 'assignment_termination', table: 'Assignment_Termination_Requests', name: 'إنهاء تكليف' },
      { type: 'internal_transfer', table: 'Internal_Transfer_Requests', name: 'نقل داخلي' },
      { type: 'leave', table: 'Leave_Requests', name: 'إجازة' },
      { type: 'exit', table: 'Exit_Requests', name: 'طلب استقالة' }
    ];

    // Get counts for each request type
    for (const requestType of requestTypes) {
      try {
        const query = `
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'قيد الاعتماد' OR status = 'pending' OR status = 'submitted' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'معتمد' OR status = 'approved' THEN 1 END) as approved,
            COUNT(CASE WHEN status = 'مرفوض' OR status = 'rejected' THEN 1 END) as rejected,
            COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_requests
          FROM ${requestType.table}
          WHERE employee_id = ? OR created_by = ?
        `;

        const [rows] = await conn.execute(query, [userId, userId]);
        const result = (rows as any)[0];

        if (result.total > 0) {
          summary.total_requests += result.total;
          summary.pending += result.pending;
          summary.approved += result.approved;
          summary.rejected += result.rejected;
          summary.today_requests += result.today_requests;

          summary.breakdown_by_type.push({
            request_type: requestType.type,
            request_name: requestType.name,
            total: result.total,
            pending: result.pending,
            approved: result.approved,
            rejected: result.rejected
          });
        }
      } catch (error) {
        // Skip tables that don't exist or have different structure
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.log(`Warning: Could not query ${requestType.table}:`, errorMessage);
      }
    }

    // Get recent requests for the employee
    const recentQuery = `
      SELECT 'clearance' as type, id, status, created_at FROM Clearance_Requests WHERE employee_id = ? OR created_by = ?
      UNION ALL
      SELECT 'onboarding' as type, id, status, created_at FROM Onboarding_Requests WHERE employee_id = ? OR created_by = ?
      UNION ALL  
      SELECT 'certificate' as type, id, status, created_at FROM Certificate_Requests WHERE employee_id = ? OR created_by = ?
      ORDER BY created_at DESC
      LIMIT 5
    `;

    try {
      const [recentRows] = await conn.execute(recentQuery, [userId, userId, userId, userId, userId, userId]);
      summary.recent_requests = recentRows as any[];
    } catch (error) {
      summary.recent_requests = [];
    }

    return summary;
  });
}
