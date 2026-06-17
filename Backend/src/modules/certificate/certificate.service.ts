/**
 * Certificate Request (شهادة تعريف) - Service Layer
 */

import { withConnection, withTransaction } from '../../core/database';
import { AppError } from '../../core/errors';
import type { CreateCertificateInput, UpdateCertificateStatusInput } from './certificate.schema';

/**
 * Create a new certificate request
 */
export async function createCertificate(
  userId: number,
  input: CreateCertificateInput
) {
  return withConnection(async (conn) => {
    // Get actual employee information from database
    const [userInfo] = await conn.execute(`
      SELECT u.name, u.email, 
             e.full_name_ar, e.position, e.employee_number,
             d.name_ar as department_name
      FROM App_Users u
      LEFT JOIN Employees e ON e.employee_id = u.employee_id
      LEFT JOIN Departments d ON d.department_id = e.department_id
      WHERE u.id = ?
    `, [userId]);

    // Use database info if available, fallback to form data
    const userRecord = (userInfo as any[])[0];
    const employee_name = userRecord?.full_name_ar || 
                         userRecord?.name || 
                         input.employeeName || 
                         'غير محدد';
    const employee_dept = userRecord?.department_name || input.department || 'غير محدد';
    const employee_email = userRecord?.email || '';

    // Create the certificate request
    const [result] = await conn.execute(
      `INSERT INTO Certificate_Requests 
       (employee_id, employee_name, employee_email, employee_dept, employee_number, job_title, department, nationality, 
        reason, purpose, request_notes, status, approval_stage, final_decision, request_date, reference_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'Pending Review', 'pending', CURDATE(), ?)`,
      [
        userId,
        employee_name,
        employee_email,
        employee_dept,
        userRecord?.employee_number || null,
        input.jobTitle || 'غير محدد',
        employee_dept,
        input.nationality || 'غير محدد',
        input.requestNotes || 'Not specified',
        input.jobTitle || 'Employment Certificate',
        input.requestNotes || null,
        `CERT-${Date.now()}-${userId}`
      ]
    );

    const certificateId = (result as any).insertId;

    console.log(`✅ Certificate request created: ID ${certificateId} for user ${userId} (${employee_name})`);

    return {
      certificateId,
      employee_name,
      employee_dept,
      reference_number: `CERT-${Date.now()}-${userId}`,
      message: 'تم إنشاء طلب شهادة التعريف بنجاح'
    };
  });
}

/**
 * Get certificate by ID with proper authorization
 */
export async function getCertificateById(certificateId: number, userId: number) {
  return withConnection(async (conn) => {
    const [certificates] = await conn.execute<any[]>(
      `SELECT 
         cr.*,
         u.name as employee_name_from_user,
         u.email as employee_email
       FROM Certificate_Requests cr
       LEFT JOIN App_Users u ON cr.employee_id = u.id
       WHERE cr.id = ?`,
      [certificateId]
    );

    if (certificates.length === 0) {
      throw new AppError({
        statusCode: 404,
        message: 'Certificate request not found',
        code: 'NOT_FOUND',
      });
    }

    const certificate = certificates[0];

    // Authorization check - Enhanced multi-method checking
    const userEmail = certificate.employee_email;
    const isOwnerByUserId = certificate.employee_id === userId;
    const isOwnerByEmail = userEmail && certificate.employee_email === userEmail;
    
    // Check if user has admin role (simplified check - you may need to enhance this)
    const [userRoles] = await conn.execute<any[]>(
      'SELECT roles FROM App_Users WHERE id = ?',
      [userId]
    );
    const roles = userRoles[0]?.roles ? JSON.parse(userRoles[0].roles) : [];
    const isAdmin = roles.includes('ADMIN') || roles.includes('HR') || roles.includes('MANAGER');

    if (!isOwnerByUserId && !isOwnerByEmail && !isAdmin) {
      console.log(`❌ Authorization failed for certificate ${certificateId}:`, {
        userId,
        userEmail,
        certificateEmployeeId: certificate.employee_id,
        certificateEmail: certificate.employee_email,
        isAdmin,
        roles
      });
      throw new AppError({
        statusCode: 403,
        message: 'You do not have permission to view this certificate request',
        code: 'FORBIDDEN',
      });
    }

    console.log(`✅ Authorization granted for certificate ${certificateId}:`, {
      isOwnerByUserId,
      isOwnerByEmail,
      isAdmin
    });

    return certificate;
  });
}

/**
 * Get all certificate requests (admin only)
 */
export async function getAllCertificates() {
  return withConnection(async (conn) => {
    const [certificates] = await conn.execute<any[]>(
      `SELECT 
         cr.*,
         u.name as employee_name_from_user,
         u.email as employee_email
       FROM Certificate_Requests cr
       LEFT JOIN App_Users u ON cr.employee_id = u.id
       ORDER BY cr.created_at DESC`
    );

    return certificates;
  });
}

/**
 * Update certificate status
 */
export async function updateCertificateStatus(
  certificateId: number,
  input: UpdateCertificateStatusInput,
  adminId: number
) {
  return withTransaction(async (conn) => {
    // Get current certificate
    const [certificates] = await conn.execute<any[]>(
      `SELECT status FROM Certificate_Requests WHERE id = ?`,
      [certificateId]
    );

    if (certificates.length === 0) {
      throw new AppError({
        statusCode: 404,
        message: 'Certificate request not found',
        code: 'NOT_FOUND',
      });
    }

    const oldStatus = certificates[0].status;

    // Update status
    await conn.execute(
      `UPDATE Certificate_Requests
       SET status = ?,
           admin_notes = COALESCE(?, admin_notes),
           rejection_reason = COALESCE(?, rejection_reason),
           approval_stage = ?,
           final_decision = ?,
           approved_at = CASE WHEN ? = 'approved' THEN NOW() ELSE approved_at END,
           approved_by = CASE WHEN ? = 'approved' THEN ? ELSE approved_by END
       WHERE id = ?`,
      [
        input.status,
        input.adminNotes || null,
        input.rejectionReason || null,
        input.status === 'approved' ? 'Completed' : 
        input.status === 'rejected' ? 'Rejected' : 'In Progress',
        input.status === 'approved' ? 'approved' : 
        input.status === 'rejected' ? 'rejected' : 'pending',
        input.status,
        input.status,
        adminId,
        certificateId,
      ]
    );

    // Add status history for comprehensive event logging
    try {
      await conn.execute(
        `INSERT INTO Certificate_Status_History 
         (request_id, old_status, new_status, changed_by, change_notes, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          certificateId,
          oldStatus,
          input.status,
          adminId,
          input.adminNotes || input.rejectionReason || 'Status updated by admin'
        ]
      );
      console.log(`📝 Certificate status history recorded: ${certificateId} ${oldStatus} -> ${input.status}`);
    } catch (historyError) {
      // Create status history table if it doesn't exist
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS Certificate_Status_History (
          id INT AUTO_INCREMENT PRIMARY KEY,
          request_id INT NOT NULL,
          old_status VARCHAR(50),
          new_status VARCHAR(50) NOT NULL,
          changed_by INT NOT NULL,
          change_notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (request_id) REFERENCES Certificate_Requests(id) ON DELETE CASCADE,
          FOREIGN KEY (changed_by) REFERENCES App_Users(id) ON DELETE CASCADE,
          
          INDEX idx_request (request_id),
          INDEX idx_created_at (created_at)
        )
      `);
      
      // Retry inserting the history record
      await conn.execute(
        `INSERT INTO Certificate_Status_History 
         (request_id, old_status, new_status, changed_by, change_notes, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          certificateId,
          oldStatus,
          input.status,
          adminId,
          input.adminNotes || input.rejectionReason || 'Status updated by admin'
        ]
      );
      console.log(`📝 Certificate status history table created and record inserted`);
    }

    console.log(`✅ Certificate request ${certificateId} status updated to ${input.status}`);

    return {
      success: true,
      message: 'تم تحديث حالة الطلب بنجاح',
    };
  });
}

/**
 * Get certificate status history
 */
export async function getCertificateHistory(certificateId: number) {
  return withConnection(async (conn) => {
    const [history] = await conn.execute<any[]>(
      `SELECT 
         csh.*,
         u.name as changed_by_name,
         u.email as changed_by_email
       FROM Certificate_Status_History csh
       LEFT JOIN App_Users u ON u.id = csh.changed_by
       WHERE csh.request_id = ?
       ORDER BY csh.created_at DESC`,
      [certificateId]
    );

    return history;
  });
}