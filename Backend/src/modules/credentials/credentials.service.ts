import { withConnection } from '../../core/database';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { AppError } from '../../core/errors';

// ====================== Certificates ======================

export interface Certificate {
  id?: number;
  employee_id: number;
  certificate_name: string;
  issuing_institution: string;
  certificate_type: string;
  field_of_study?: string;
  issue_date?: string;
  file_path?: string;
  file_name?: string;
  description?: string;
  verified?: boolean;
  created_at?: string;
}

export async function createCertificate(cert: Certificate) {
  return withConnection(async (conn) => {
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO Employee_Certificates (
        employee_id, certificate_name, issuing_institution, certificate_type,
        field_of_study, issue_date, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        cert.employee_id,
        cert.certificate_name,
        cert.issuing_institution,
        cert.certificate_type,
        cert.field_of_study || null,
        cert.issue_date || null,
        cert.description || null
      ]
    );
    
    return { id: result.insertId };
  });
}

export async function getCertificatesByEmployee(employeeId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT * FROM Employee_Certificates WHERE employee_id = ? ORDER BY created_at DESC`,
      [employeeId]
    );
    
    return rows;
  });
}

export async function deleteCertificate(certificateId: number, employeeId: number) {
  return withConnection(async (conn) => {
    const [result] = await conn.execute<ResultSetHeader>(
      `DELETE FROM Employee_Certificates WHERE id = ? AND employee_id = ?`,
      [certificateId, employeeId]
    );
    
    if (result.affectedRows === 0) {
      throw new AppError({ statusCode: 404, message: 'Certificate not found', code: 'NOT_FOUND' });
    }
    
    return { success: true };
  });
}

// ====================== Licenses ======================

export interface License {
  id?: number;
  employee_id: number;
  license_name: string;
  license_number: string;
  issuing_authority: string;
  license_type: string;
  issue_date: string;
  expiry_date: string;
  renewal_reminder_days?: number;
  status?: string;
  file_path?: string;
  file_name?: string;
  description?: string;
  verified?: boolean;
  created_at?: string;
}

export async function createLicense(lic: License) {
  return withConnection(async (conn) => {
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO Employee_Licenses (
        employee_id, license_name, license_number, issuing_authority,
        license_type, issue_date, expiry_date, renewal_reminder_days,
        description, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        lic.employee_id,
        lic.license_name,
        lic.license_number,
        lic.issuing_authority,
        lic.license_type,
        lic.issue_date,
        lic.expiry_date,
        lic.renewal_reminder_days || 30,
        lic.description || null
      ]
    );
    
    return { id: result.insertId };
  });
}

export async function getLicensesByEmployee(employeeId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT * FROM Employee_Licenses WHERE employee_id = ? ORDER BY expiry_date ASC`,
      [employeeId]
    );
    
    // Auto-update expired licenses
    const now = new Date();
    for (const row of rows) {
      if (row.auto_status_updated && row.expiry_date) {
        const expiryDate = new Date(row.expiry_date);
        const shouldBeExpired = expiryDate < now;
        
        if (shouldBeExpired && row.status === 'active') {
          await conn.execute(
            `UPDATE Employee_Licenses SET status = 'expired' WHERE id = ?`,
            [row.id]
          );
          row.status = 'expired';
        }
      }
    }
    
    return rows;
  });
}

export async function deleteLicense(licenseId: number, employeeId: number) {
  return withConnection(async (conn) => {
    const [result] = await conn.execute<ResultSetHeader>(
      `DELETE FROM Employee_Licenses WHERE id = ? AND employee_id = ?`,
      [licenseId, employeeId]
    );
    
    if (result.affectedRows === 0) {
      throw new AppError({ statusCode: 404, message: 'License not found', code: 'NOT_FOUND' });
    }
    
    return { success: true };
  });
}

export async function updateLicenseStatus(licenseId: number, status: string) {
  return withConnection(async (conn) => {
    await conn.execute(
      `UPDATE Employee_Licenses SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, licenseId]
    );
    
    return { success: true };
  });
}

// Get expiring licenses (for notifications)
export async function getExpiringLicenses(days: number = 30) {
  return withConnection(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT l.*, e.email, e.name as employee_name
       FROM Employee_Licenses l
       JOIN App_Users e ON l.employee_id = e.id
       WHERE l.status = 'active'
       AND l.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       AND l.expiry_date >= CURDATE()
       ORDER BY l.expiry_date ASC`,
      [days]
    );
    
    return rows;
  });
}

// ====================== Admin Approval Functions ======================

// Get all pending (unverified) certificates
export async function getPendingCertificates() {
  return withConnection(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT c.*, e.name as employee_name, e.email as employee_email, 
              e.department_name, e.job_title, e.employee_number
       FROM Employee_Certificates c
       JOIN App_Users e ON c.employee_id = e.id
       WHERE c.verified = FALSE
       ORDER BY c.created_at DESC`
    );
    
    return rows;
  });
}

// Get all pending (unverified) licenses
export async function getPendingLicenses() {
  return withConnection(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT l.*, e.name as employee_name, e.email as employee_email,
              e.department_name, e.job_title, e.employee_number
       FROM Employee_Licenses l
       JOIN App_Users e ON l.employee_id = e.id
       WHERE l.verified = FALSE
       ORDER BY l.created_at DESC`
    );
    
    return rows;
  });
}

// Get all pending credentials (certificates + licenses) grouped by employee
export async function getPendingCredentialsGrouped() {
  return withConnection(async (conn) => {
    // Get pending certificates
    const [certificates] = await conn.query<RowDataPacket[]>(
      `SELECT c.*, e.name as employee_name, e.email as employee_email,
              e.department_name, e.job_title, e.employee_number, 'certificate' as credential_type
       FROM Employee_Certificates c
       JOIN App_Users e ON c.employee_id = e.id
       WHERE c.verified = FALSE
       ORDER BY c.created_at DESC`
    );
    
    // Get pending licenses
    const [licenses] = await conn.query<RowDataPacket[]>(
      `SELECT l.*, e.name as employee_name, e.email as employee_email,
              e.department_name, e.job_title, e.employee_number, 'license' as credential_type
       FROM Employee_Licenses l
       JOIN App_Users e ON l.employee_id = e.id
       WHERE l.verified = FALSE
       ORDER BY l.created_at DESC`
    );
    
    // Group by employee
    const grouped = new Map();
    
    [...certificates, ...licenses].forEach((item: any) => {
      const key = item.employee_id;
      if (!grouped.has(key)) {
        grouped.set(key, {
          employee_id: item.employee_id,
          employee_name: item.employee_name,
          employee_email: item.employee_email,
          department_name: item.department_name,
          job_title: item.job_title,
          employee_number: item.employee_number,
          certificates: [],
          licenses: []
        });
      }
      
      const group = grouped.get(key);
      if (item.credential_type === 'certificate') {
        group.certificates.push(item);
      } else {
        group.licenses.push(item);
      }
    });
    
    return Array.from(grouped.values());
  });
}

// Approve a certificate
export async function approveCertificate(certificateId: number, adminId: number) {
  return withConnection(async (conn) => {
    const [result] = await conn.execute<ResultSetHeader>(
      `UPDATE Employee_Certificates 
       SET verified = TRUE, verified_by = ?, verified_at = NOW(), updated_at = NOW()
       WHERE id = ? AND verified = FALSE`,
      [adminId, certificateId]
    );
    
    if (result.affectedRows === 0) {
      throw new AppError({ statusCode: 404, message: 'Certificate not found or already verified', code: 'NOT_FOUND' });
    }
    
    return { success: true };
  });
}

// Approve a license
export async function approveLicense(licenseId: number, adminId: number) {
  return withConnection(async (conn) => {
    const [result] = await conn.execute<ResultSetHeader>(
      `UPDATE Employee_Licenses 
       SET verified = TRUE, verified_by = ?, verified_at = NOW(), updated_at = NOW()
       WHERE id = ? AND verified = FALSE`,
      [adminId, licenseId]
    );
    
    if (result.affectedRows === 0) {
      throw new AppError({ statusCode: 404, message: 'License not found or already verified', code: 'NOT_FOUND' });
    }
    
    return { success: true };
  });
}

// Reject (delete) a certificate
export async function rejectCertificate(certificateId: number, adminId: number) {
  return withConnection(async (conn) => {
    const [result] = await conn.execute<ResultSetHeader>(
      `DELETE FROM Employee_Certificates WHERE id = ? AND verified = FALSE`,
      [certificateId]
    );
    
    if (result.affectedRows === 0) {
      throw new AppError({ statusCode: 404, message: 'Certificate not found or already verified', code: 'NOT_FOUND' });
    }
    
    return { success: true };
  });
}

// Reject (delete) a license
export async function rejectLicense(licenseId: number, adminId: number) {
  return withConnection(async (conn) => {
    const [result] = await conn.execute<ResultSetHeader>(
      `DELETE FROM Employee_Licenses WHERE id = ? AND verified = FALSE`,
      [licenseId]
    );
    
    if (result.affectedRows === 0) {
      throw new AppError({ statusCode: 404, message: 'License not found or already verified', code: 'NOT_FOUND' });
    }
    
    return { success: true };
  });
}

