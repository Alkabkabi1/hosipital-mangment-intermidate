/**
 * Experience Certificate Request (شهادة خبرة) - Service Layer
 */

import { withConnection } from '../../core/database';
import { AppError } from '../../core/errors';
import type { CreateExperienceInput, UpdateExperienceStatusInput } from './experience.schema';
import { initializeRequestApprovals } from '../multi-approval/multi-approval.service';

/**
 * Create a new experience certificate request
 */
export async function createExperience(
  userId: number,
  input: CreateExperienceInput
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

    // Create the experience certificate request
    const [result] = await conn.execute(
      `INSERT INTO Experience_Certificate_Requests 
       (employee_id, employee_name, employee_email, employee_dept, employee_number, job_title, department, nationality, 
        service_type, start_date, end_date, reason_for_leaving, request_notes, 
        status, approval_stage, final_decision, reference_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'Pending Review', 'pending', ?)`,
      [
        userId,
        employee_name,
        employee_email,
        employee_dept,
        userRecord?.employee_number || input.employeeNumber || 'غير محدد',
        input.position || 'غير محدد',
        employee_dept,
        input.nationality || 'غير محدد',
        input.serviceType || 'غير محدد',
        input.startDate,
        input.endDate,
        input.reasonForLeaving || null,
        input.requestNotes || null,
        `EXP-${Date.now()}-${userId}`
      ]
    );

    const experienceId = (result as any).insertId;

    // Initialize approvals for experience requests if needed
    try {
      await initializeRequestApprovals('experience', experienceId);
      console.log(`✅ Experience request approvals initialized: ${experienceId}`);
    } catch (approvalError) {
      const errorMessage = approvalError instanceof Error ? approvalError.message : 'Unknown error occurred';
      console.log(`⚠️ Experience request approval initialization skipped: ${errorMessage}`);
    }

    console.log(`✅ Experience certificate request created: ID ${experienceId} for user ${userId} (${employee_name})`);

    return {
      experienceId,
      employee_name,
      employee_dept,
      reference_number: `EXP-${Date.now()}-${userId}`,
      message: 'تم إنشاء طلب شهادة الخبرة بنجاح'
    };
  });
}

/**
 * Get experience by ID with proper authorization
 */
export async function getExperienceById(experienceId: number, userId: number) {
  return withConnection(async (conn) => {
    const [experiences] = await conn.execute<any[]>(
      `SELECT 
         ecr.*,
         u.name as employee_name_from_user,
         u.email as employee_email
       FROM Experience_Certificate_Requests ecr
       LEFT JOIN App_Users u ON ecr.employee_id = u.id
       WHERE ecr.id = ?`,
      [experienceId]
    );

    if (experiences.length === 0) {
      throw new AppError({
        statusCode: 404,
        message: 'Experience certificate request not found',
        code: 'NOT_FOUND',
      });
    }

    const experience = experiences[0];

    // Authorization check - Enhanced multi-method checking
    const userEmail = experience.employee_email;
    const isOwnerByUserId = experience.employee_id === userId;
    const isOwnerByEmail = userEmail && experience.employee_email === userEmail;
    
    // Check if user has admin role
    const [userRoles] = await conn.execute<any[]>(
      'SELECT roles FROM App_Users WHERE id = ?',
      [userId]
    );
    const roles = userRoles[0]?.roles ? JSON.parse(userRoles[0].roles) : [];
    const isAdmin = roles.includes('ADMIN') || roles.includes('HR') || roles.includes('MANAGER');

    if (!isOwnerByUserId && !isOwnerByEmail && !isAdmin) {
      throw new AppError({
        statusCode: 403,
        message: 'You do not have permission to view this experience certificate request',
        code: 'FORBIDDEN',
      });
    }

    return experience;
  });
}

/**
 * Get all experience certificate requests (admin only)
 */
export async function getAllExperiences() {
  return withConnection(async (conn) => {
    const [experiences] = await conn.execute<any[]>(
      `SELECT 
         ecr.*,
         u.name as employee_name_from_user,
         u.email as employee_email
       FROM Experience_Certificate_Requests ecr
       LEFT JOIN App_Users u ON ecr.employee_id = u.id
       ORDER BY ecr.created_at DESC`
    );

    return experiences;
  });
}

/**
 * Update experience certificate status
 */
export async function updateExperienceStatus(
  experienceId: number,
  input: UpdateExperienceStatusInput,
  adminId: number
) {
  return withConnection(async (conn) => {
    // Get current experience certificate
    const [experiences] = await conn.execute<any[]>(
      `SELECT status FROM Experience_Certificate_Requests WHERE id = ?`,
      [experienceId]
    );

    if (experiences.length === 0) {
      throw new AppError({
        statusCode: 404,
        message: 'Experience certificate request not found',
        code: 'NOT_FOUND',
      });
    }

    const oldStatus = experiences[0].status;

    // Update status
    await conn.execute(
      `UPDATE Experience_Certificate_Requests
       SET status = ?,
           admin_notes = COALESCE(?, admin_notes),
           rejection_reason = COALESCE(?, rejection_reason),
           approval_stage = ?,
           approved_at = CASE WHEN ? = 'approved' THEN NOW() ELSE approved_at END
       WHERE id = ?`,
      [
        input.status,
        input.adminNotes || null,
        input.rejectionReason || null,
        input.status === 'approved' ? 'Completed' : 
        input.status === 'rejected' ? 'Rejected' : 'In Progress',
        input.status,
        experienceId,
      ]
    );

    // Add status history for comprehensive event logging
    try {
      await conn.execute(
        `INSERT INTO Experience_Status_History 
         (request_id, old_status, new_status, changed_by, change_notes, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          experienceId,
          oldStatus,
          input.status,
          adminId,
          input.adminNotes || input.rejectionReason || 'Status updated by admin'
        ]
      );
      console.log(`📝 Experience status history recorded: ${experienceId} ${oldStatus} -> ${input.status}`);
    } catch (historyError) {
      // Create status history table if it doesn't exist
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS Experience_Status_History (
          id INT AUTO_INCREMENT PRIMARY KEY,
          request_id INT NOT NULL,
          old_status VARCHAR(50),
          new_status VARCHAR(50) NOT NULL,
          changed_by INT NOT NULL,
          change_notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (request_id) REFERENCES Experience_Certificate_Requests(id) ON DELETE CASCADE,
          FOREIGN KEY (changed_by) REFERENCES App_Users(id) ON DELETE CASCADE,
          
          INDEX idx_request (request_id),
          INDEX idx_created_at (created_at)
        )
      `);
      
      // Retry inserting the history record
      await conn.execute(
        `INSERT INTO Experience_Status_History 
         (request_id, old_status, new_status, changed_by, change_notes, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          experienceId,
          oldStatus,
          input.status,
          adminId,
          input.adminNotes || input.rejectionReason || 'Status updated by admin'
        ]
      );
      console.log(`📝 Experience status history table created and record inserted`);
    }

    console.log(`✅ Experience certificate request ${experienceId} status updated to ${input.status}`);

    return {
      success: true,
      message: 'تم تحديث حالة الطلب بنجاح',
    };
  });
}

/**
 * Get experience certificate status history
 */
export async function getExperienceHistory(experienceId: number) {
  return withConnection(async (conn) => {
    const [history] = await conn.execute<any[]>(
      `SELECT 
         esh.*,
         u.name as changed_by_name,
         u.email as changed_by_email
       FROM Experience_Status_History esh
       LEFT JOIN App_Users u ON u.id = esh.changed_by
       WHERE esh.request_id = ?
       ORDER BY esh.created_at DESC`,
      [experienceId]
    );

    return history;
  });
}