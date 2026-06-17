import { type RequestHandler } from 'express';
import mysql from 'mysql2/promise';
import {
  createClearanceRequest,
  createOnboardingRequest,
  createDelegationRequest,
  getEmployeeRequests,
  getEmployeeClearanceRequests,
  getEmployeeOnboardingRequests,
  getAllRecentRequests,
  getRecentPendingRequests,
  getRequestsSummary,
  approveRequest,
  rejectRequest
} from './employee-requests.service';

// Employee endpoints - creating requests
export const createClearanceController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.sub;
    const userEmail = req.auth!.email;
    
    const {
      firstName,
      secondName,
      thirdName,
      employeeNumber,
      email,
      department,
      jobTitle,
      phone,
      reason,
      lastWorkingDay,
      requestDate
    } = req.body;

    // Build employee name
    const employee_name = [firstName, secondName, thirdName].filter(Boolean).join(' ');
    
    const result = await createClearanceRequest({
      employee_email: email || userEmail,
      employee_name,
      employee_dept: department,
      created_by_user: userId,
      request_date: requestDate,
      last_work_day: lastWorkingDay,
      reason,
      payload_json: {
        employeeNumber,
        jobTitle,
        phone,
        firstName,
        secondName,
        thirdName
      }
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء طلب إخلاء الطرف بنجاح',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const createOnboardingController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.sub;
    const userEmail = req.auth!.email;
    
    const {
      firstName,
      secondName,
      thirdName,
      employeeNumber,
      email,
      department,
      jobTitle,
      phone,
      startDate,
      requestDate
    } = req.body;

    // Build employee name
    const employee_name = [firstName, secondName, thirdName].filter(Boolean).join(' ');
    
    const result = await createOnboardingRequest({
      employee_email: email || userEmail,
      employee_name,
      employee_dept: department,
      created_by_user: userId,
      request_date: requestDate,
      payload_json: {
        employeeNumber,
        jobTitle,
        phone,
        firstName,
        secondName,
        thirdName,
        startDate
      }
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء طلب مباشرة العمل بنجاح',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const createDelegationController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.sub;
    const userEmail = req.auth!.email;
    
    const {
      fromEmail,
      toEmail,
      scopes,
      validFrom,
      validTo
    } = req.body;

    const result = await createDelegationRequest({
      created_by_user: userId,
      from_email: fromEmail || userEmail,
      to_email: toEmail,
      scopes_json: scopes,
      valid_from: validFrom,
      valid_to: validTo
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء طلب التفويض بنجاح',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Employee endpoints - reading own requests
export const getMyRequestsController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.sub;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const requests = await getEmployeeRequests(userId, limit);
    
    // Format for frontend compatibility
    const formattedRequests = requests.map((r: any) => ({
      id: r.id,
      type: r.type,
      reference_number: r.reference_number,
      status: r.status,
      request_date: r.request_date,
      created_at: r.created_at,
      employee: {
        name: r.employee_name,
        email: r.employee_email,
        department: r.employee_dept
      },
      ...(r.payload_json ? JSON.parse(r.payload_json) : {})
    }));

    res.json(formattedRequests);
  } catch (error) {
    next(error);
  }
};

export const getMyClearancesController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.sub;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const requests = await getEmployeeClearanceRequests(userId, limit);
    
    const formattedRequests = requests.map((r: any) => ({
      id: r.id,
      type: 'clearance',
      reference_number: r.reference_number,
      status: r.status,
      request_date: r.request_date,
      created_at: r.created_at,
      last_work_day: r.last_work_day,
      reason: r.reason,
      employee: {
        name: r.employee_name,
        email: r.employee_email,
        department: r.employee_dept
      },
      ...(r.payload_json ? JSON.parse(r.payload_json) : {})
    }));

    res.json(formattedRequests);
  } catch (error) {
    next(error);
  }
};

export const getMyOnboardingsController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.sub;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const requests = await getEmployeeOnboardingRequests(userId, limit);
    
    const formattedRequests = requests.map((r: any) => ({
      id: r.id,
      type: 'onboarding',
      reference_number: r.reference_number,
      status: r.status,
      request_date: r.request_date,
      created_at: r.created_at,
      employee: {
        name: r.employee_name,
        email: r.employee_email,
        department: r.employee_dept
      },
      ...(r.payload_json ? JSON.parse(r.payload_json) : {})
    }));

    res.json(formattedRequests);
  } catch (error) {
    next(error);
  }
};

// Admin endpoints - managing all requests
export const getAdminRecentPendingController: RequestHandler = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const onlyPending = req.query.onlyPending === 'true';
    
    if (!onlyPending) {
      // If not only pending, return all recent requests (includes ALL request types including housing_allowance)
      const requests = await getAllRecentRequests(limit);
      return res.json(requests);
    }
    
    const requests = await getRecentPendingRequests(limit);
    
    const formattedRequests = requests.map((r: any) => ({
      id: r.id,
      sourceId: r.id,
      type: r.type,
      _kind: r.type === 'clearance' ? 'إخلاء طرف' : 
             r.type === 'onboarding' ? 'مباشرة عمل' : 
             r.type === 'delegation' ? 'تفويض' :
             r.type === 'housing_allowance' ? 'بدل سكن' :
             r.type === 'certificate' ? 'شهادة تعريف' :
             r.type === 'experience' ? 'شهادة خبرة' :
             r.type === 'exit' ? 'إنهاء عمل' :
             r.type === 'maternity_leave' ? 'إجازة أمومة' : 'غير محدد',
      reference_number: r.reference_number,
      status: r.status,
      request_date: r.request_date,
      created_at: r.created_at,
      createdAt: new Date(r.created_at).getTime(),
      employee: {
        name: r.employee_name,
        email: r.employee_email,
        department: r.employee_dept
      },
      approvers: [{
        name: '-',
        role: '',
        status: 'قيد الاعتماد',
        dueAt: new Date(Date.now() + 3*24*60*60*1000).toISOString()
      }]
    }));

    res.json(formattedRequests);
  } catch (error) {
    next(error);
  }
};

export const getEmployeeSummaryController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.sub;
    
    // Get employee-specific summary data
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'nora', 
      password: 'nora123',
      database: 'nora_database'
    });

    let summaryResult;
    try {
      [summaryResult] = await connection.execute(`
        SELECT 
          COUNT(*) as total_requests,
          COUNT(CASE WHEN status = 'submitted' OR status = 'قيد الاعتماد' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'approved' OR status = 'معتمد' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'rejected' OR status = 'مرفوض' THEN 1 END) as rejected,
          COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_requests
        FROM (
          SELECT status, created_at FROM Clearance_Requests WHERE created_by_user = ?
          UNION ALL
          SELECT status, created_at FROM Onboarding_Requests WHERE created_by_user = ?
          UNION ALL
          SELECT status, created_at FROM Certificate_Requests WHERE created_by = ?
          UNION ALL
          SELECT status, created_at FROM Experience_Certificate_Requests WHERE created_by = ?
          UNION ALL
          SELECT status, created_at FROM Exit_Requests WHERE created_by = ?
          UNION ALL
          SELECT status, created_at FROM Leave_Requests WHERE employee_id = ?
        ) all_requests
      `, [userId, userId, userId, userId, userId, userId]);
    } finally {
      await connection.end();
    }

    const summary = (summaryResult as any[])[0] || {
      total_requests: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      today_requests: 0
    };

    res.json({
      success: true,
      data: {
        summary,
        breakdown_by_type: {
          clearance: { count: 0, pending: 0 },
          onboarding: { count: 0, pending: 0 },
          certificate: { count: 0, pending: 0 },
          experience: { count: 0, pending: 0 },
          exit: { count: 0, pending: 0 },
          leave: { count: 0, pending: 0 }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminSummaryController: RequestHandler = async (req, res, next) => {
  try {
    const summary = await getRequestsSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

export const approveRequestController: RequestHandler = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { note } = req.body;
    const userId = req.auth!.sub;
    
    if (!['onboarding', 'clearance', 'delegation'].includes(type)) {
      return res.status(400).json({ 
        success: false,
        message: 'نوع الطلب غير صحيح' 
      });
    }
    
    const success = await approveRequest(
      type as 'onboarding' | 'clearance' | 'delegation',
      parseInt(id),
      userId,
      note
    );
    
    if (!success) {
      return res.status(409).json({
        success: false,
        message: 'لا يمكن اعتماد الطلب (قد يكون تم اعتماده أو رفضه مسبقاً)'
      });
    }
    
    res.json({
      success: true,
      message: 'تم اعتماد الطلب بنجاح'
    });
  } catch (error) {
    next(error);
  }
};

export const rejectRequestController: RequestHandler = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { note } = req.body;
    const userId = req.auth!.sub;
    
    if (!['onboarding', 'clearance', 'delegation'].includes(type)) {
      return res.status(400).json({ 
        success: false,
        message: 'نوع الطلب غير صحيح' 
      });
    }
    
    const success = await rejectRequest(
      type as 'onboarding' | 'clearance' | 'delegation',
      parseInt(id),
      userId,
      note
    );
    
    if (!success) {
      return res.status(409).json({
        success: false,
        message: 'لا يمكن رفض الطلب (قد يكون تم اعتماده أو رفضه مسبقاً)'
      });
    }
    
    res.json({
      success: true,
      message: 'تم رفض الطلب'
    });
  } catch (error) {
    next(error);
  }
};
