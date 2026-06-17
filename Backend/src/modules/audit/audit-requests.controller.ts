import { RequestHandler } from 'express';
import { withConnection } from '../../core/database';
import { sendSuccess } from '../../shared/utils/response';

export const getAuditRequestsController: RequestHandler = async (req, res, next) => {
  try {
    const type = req.query.type as string;
    const limit = parseInt(req.query.limit as string) || 100;
    
    console.log(`🔍 Fetching audit requests for type: ${type}, limit: ${limit}`);
    
    const requests = await withConnection(async (conn) => {
      let query = `
        SELECT 
          id,
          original_id,
          request_type,
          reference_number,
          employee_name,
          employee_email,
          employee_dept,
          status,
          created_at,
          updated_at,
          approved_at,
          rejected_at,
          approved_by,
          rejection_reason,
          request_data
        FROM Request_Audit
      `;
      
      const params = [];
      
      if (type && type !== 'all') {
        query += ' WHERE request_type = ?';
        params.push(type);
      }
      
      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);
      
      console.log(`🔍 Executing audit query: ${query}`);
      console.log(`🔍 With parameters:`, params);
      
      const [rows] = await conn.query(query, params);
      return rows as any[];
    });
    
    console.log(`✅ Found ${requests.length} audit requests`);
    
    // Transform data to match expected format
    const transformedRequests = requests.map(row => {
      try {
        return {
          id: row.original_id,
          type: row.request_type,
          reference_number: row.reference_number,
          employee: {
            name: row.employee_name,
            email: row.employee_email,
            dept: row.employee_dept
          },
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          approvedAt: row.approved_at,
          rejectedAt: row.rejected_at,
          approvedBy: row.approved_by,
          rejectionReason: row.rejection_reason,
          requestData: row.request_data && typeof row.request_data === 'string' ? 
            (() => { try { return JSON.parse(row.request_data); } catch { return null; } })() : 
            null
        };
      } catch (error) {
        console.error('❌ Error transforming audit row:', error, row);
        return {
          id: row.original_id || row.id,
          type: row.request_type,
          reference_number: row.reference_number,
          employee: {
            name: row.employee_name,
            email: row.employee_email,
            dept: row.employee_dept
          },
          status: row.status,
          createdAt: row.created_at
        };
      }
    });
    
    console.log(`🔄 Transformed ${transformedRequests.length} requests for response`);
    sendSuccess(res, transformedRequests);
    
  } catch (error) {
    console.error('❌ Audit requests error:', error);
    next(error);
  }
};
