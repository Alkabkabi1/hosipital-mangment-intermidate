import { withConnection } from '../../core/database';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { AppError } from '../../core/errors';

export interface JobDescription {
  id?: number;
  employee_id: number;
  job_description: string;
  submission_notes?: string;
  verified?: boolean;
  verified_by?: number;
  verified_at?: string;
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
}

// ====================== Employee Functions ======================

export async function createJobDescription(desc: JobDescription) {
  return withConnection(async (conn) => {
    // Get the employee_id from Employees table (not App_Users.id)
    const [userRow] = await conn.query<RowDataPacket[]>(
      `SELECT employee_id FROM App_Users WHERE id = ?`,
      [desc.employee_id]
    );
    
    if (!userRow || userRow.length === 0 || !userRow[0].employee_id) {
      throw new AppError({ 
        statusCode: 400, 
        message: 'User is not linked to an employee record', 
        code: 'BAD_REQUEST' 
      });
    }
    
    const actualEmployeeId = userRow[0].employee_id;
    
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO Employee_Job_Descriptions (
        employee_id, job_description, submission_notes
      ) VALUES (?, ?, ?)`,
      [
        actualEmployeeId,
        desc.job_description,
        desc.submission_notes || null
      ]
    );
    
    return { id: result.insertId };
  });
}

export async function getJobDescriptionsByEmployee(userId: number) {
  return withConnection(async (conn) => {
    // Get the employee_id from App_Users
    const [userRow] = await conn.query<RowDataPacket[]>(
      `SELECT employee_id FROM App_Users WHERE id = ?`,
      [userId]
    );
    
    if (!userRow || userRow.length === 0 || !userRow[0].employee_id) {
      return []; // No employee record, return empty
    }
    
    const actualEmployeeId = userRow[0].employee_id;
    
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT * FROM Employee_Job_Descriptions 
       WHERE employee_id = ? 
       ORDER BY created_at DESC`,
      [actualEmployeeId]
    );
    
    return rows;
  });
}

export async function getApprovedJobDescription(userId: number) {
  return withConnection(async (conn) => {
    // Get the employee_id from App_Users
    const [userRow] = await conn.query<RowDataPacket[]>(
      `SELECT employee_id FROM App_Users WHERE id = ?`,
      [userId]
    );
    
    if (!userRow || userRow.length === 0 || !userRow[0].employee_id) {
      return null; // No employee record
    }
    
    const actualEmployeeId = userRow[0].employee_id;
    
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT * FROM Employee_Job_Descriptions 
       WHERE employee_id = ? AND verified = TRUE
       ORDER BY verified_at DESC
       LIMIT 1`,
      [actualEmployeeId]
    );
    
    return rows[0] || null;
  });
}

export async function deleteJobDescription(id: number, userId: number) {
  return withConnection(async (conn) => {
    // Get the employee_id from App_Users
    const [userRow] = await conn.query<RowDataPacket[]>(
      `SELECT employee_id FROM App_Users WHERE id = ?`,
      [userId]
    );
    
    if (!userRow || userRow.length === 0 || !userRow[0].employee_id) {
      throw new AppError({ 
        statusCode: 400, 
        message: 'User is not linked to an employee record', 
        code: 'BAD_REQUEST' 
      });
    }
    
    const actualEmployeeId = userRow[0].employee_id;
    
    const [result] = await conn.execute<ResultSetHeader>(
      `DELETE FROM Employee_Job_Descriptions WHERE id = ? AND employee_id = ?`,
      [id, actualEmployeeId]
    );
    
    if (result.affectedRows === 0) {
      throw new AppError({ 
        statusCode: 404, 
        message: 'Job description not found', 
        code: 'NOT_FOUND' 
      });
    }
    
    return { success: true };
  });
}

// ====================== Admin Functions ======================

export async function getPendingJobDescriptions() {
  return withConnection(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT jd.*, 
              u.name as employee_name, 
              u.email as employee_email,
              e.employee_number,
              e.full_name_ar,
              e.position,
              d.name_ar as department_name
       FROM Employee_Job_Descriptions jd
       JOIN Employees e ON jd.employee_id = e.employee_id
       JOIN App_Users u ON e.employee_id = u.employee_id
       LEFT JOIN Departments d ON e.department_id = d.department_id
       WHERE jd.verified = FALSE
       ORDER BY jd.created_at DESC`
    );
    
    return rows;
  });
}

export async function getAllJobDescriptions() {
  return withConnection(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT jd.*, 
              u.name as employee_name, 
              u.email as employee_email,
              e.employee_number,
              e.full_name_ar,
              e.position,
              d.name_ar as department_name
       FROM Employee_Job_Descriptions jd
       JOIN Employees e ON jd.employee_id = e.employee_id
       JOIN App_Users u ON e.employee_id = u.employee_id
       LEFT JOIN Departments d ON e.department_id = d.department_id
       ORDER BY jd.created_at DESC`
    );
    
    return rows;
  });
}

export async function approveJobDescription(id: number, adminId: number) {
  return withConnection(async (conn) => {
    const [result] = await conn.execute<ResultSetHeader>(
      `UPDATE Employee_Job_Descriptions 
       SET verified = TRUE, 
           verified_by = ?, 
           verified_at = NOW(), 
           updated_at = NOW()
       WHERE id = ? AND verified = FALSE`,
      [adminId, id]
    );
    
    if (result.affectedRows === 0) {
      throw new AppError({ 
        statusCode: 404, 
        message: 'Job description not found or already verified', 
        code: 'NOT_FOUND' 
      });
    }
    
    return { success: true };
  });
}

export async function rejectJobDescription(id: number, adminId: number, reason?: string) {
  return withConnection(async (conn) => {
    // For now, rejecting means deleting
    // You could also add a rejected status if you want to keep history
    const [result] = await conn.execute<ResultSetHeader>(
      `DELETE FROM Employee_Job_Descriptions WHERE id = ? AND verified = FALSE`,
      [id]
    );
    
    if (result.affectedRows === 0) {
      throw new AppError({ 
        statusCode: 404, 
        message: 'Job description not found or already verified', 
        code: 'NOT_FOUND' 
      });
    }
    
    return { success: true };
  });
}

