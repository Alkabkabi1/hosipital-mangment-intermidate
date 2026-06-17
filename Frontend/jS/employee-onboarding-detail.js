// Employee Onboarding Detail - View comprehensive onboarding request details
// This page is accessible to both employees (for their own requests) and admins

document.addEventListener('DOMContentLoaded', function() {
  // Wait for dependencies
  if (typeof window.waitForDependencies === 'function') {
    window.waitForDependencies(() => {
      initializePage();
    }, ['apiClient', 'DetailUtils']);
  } else {
    setTimeout(initializePage, 500);
  }
});

function initializePage() {
  // Check authentication
  if (!window.DetailUtils.requireAuth()) return;

  // Get request ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const requestId = urlParams.get('id');
  
  if (!requestId) {
    window.DetailUtils.showError('معرف الطلب غير صحيح');
    setTimeout(() => history.back(), 2000);
    return;
  }

  // Load request details
  loadOnboardingDetails(requestId);
}

async function loadOnboardingDetails(requestId) {
  // Show loading skeletons
  showLoadingSkeletons();
  
  try {
    console.log('📄 Loading onboarding details for ID:', requestId);
    
    const apiClient = window.DetailUtils.getApiClient();
    if (!apiClient) {
      throw new Error('API client not available');
    }
    
    const response = await apiClient.getOnboardingById(requestId);
    console.log('📄 Received onboarding details:', response);
    
    if (!response) {
      throw new Error('No data received');
    }
    
    // Add smooth reveal animation
    setTimeout(() => {
      displayOnboardingDetails(response);
    }, 100);
    
  } catch (error) {
    console.error('Error loading onboarding details:', error);
    
    // Show user-friendly error message
    if (error.status === 404) {
      showEmptyState('📋', 'الطلب غير موجود', 'لم يتم العثور على الطلب المطلوب في قاعدة البيانات');
    } else if (error.status === 403) {
      showEmptyState('🔒', 'غير مصرح', 'ليس لديك صلاحية لعرض هذا الطلب');
    } else {
      showEmptyState('⚠️', 'حدث خطأ', 'حدث خطأ في تحميل تفاصيل الطلب. يرجى المحاولة مرة أخرى.');
    }
    
    // Show option to go back
    setTimeout(() => {
      if (confirm('هل تريد العودة إلى الصفحة السابقة؟')) {
        history.back();
      }
    }, 2000);
  }
}

function showLoadingSkeletons() {
  const grids = ['employeeInfoGrid', 'documentInfoGrid', 'employmentInfoGrid'];
  grids.forEach(gridId => {
    const grid = document.getElementById(gridId);
    if (grid) {
      grid.innerHTML = Array(6).fill(0).map(() => `
        <div class="info-item">
          <div class="skeleton" style="width: 60%; height: 14px;"></div>
          <div class="skeleton" style="width: 85%; height: 18px; margin-top: 6px;"></div>
        </div>
      `).join('');
    }
  });
}

function showEmptyState(icon, title, message) {
  const container = document.querySelector('.container');
  if (container) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 100px 20px; text-align: center;">
        <div class="empty-state-icon" style="font-size: 72px; margin-bottom: 20px;">${icon}</div>
        <h2 style="font-size: 24px; color: var(--text); margin-bottom: 12px;">${title}</h2>
        <p style="font-size: 16px; color: var(--muted); margin-bottom: 32px;">${message}</p>
        <button class="btn btn-primary" onclick="history.back()">← العودة إلى الصفحة السابقة</button>
      </div>
    `;
  }
}

function displayOnboardingDetails(data) {
  console.log('📋 Displaying onboarding details:', data);
  
  // Update page title
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) {
    pageTitle.textContent = `تفاصيل طلب مباشرة العمل #${data.reference_number || data.id}`;
  }
  
  // Basic information
  const refNum = document.getElementById('referenceNumber');
  if (refNum) refNum.textContent = data.reference_number || `#${data.id}`;
  
  const status = document.getElementById('currentStatus');
  if (status) status.innerHTML = getStatusBadge(data.status);
  
  const reqDate = document.getElementById('requestDate');
  if (reqDate) reqDate.textContent = window.DetailUtils.formatDate(data.request_date || data.created_at);
  
  const startDate = document.getElementById('startDate');
  if (startDate) startDate.textContent = window.DetailUtils.formatDate(data.start_date);
  
  // Employee Information
  displayEmployeeInfo(data);
  
  // Document Information
  displayDocumentInfo(data);
  
  // Employment Details
  displayEmploymentInfo(data);
  
  // Additional Details
  displayAdditionalDetails(data);
  
  // Timeline
  displayTimeline(data);
}

function displayEmployeeInfo(data) {
  const grid = document.getElementById('employeeInfoGrid');
  if (!grid) return;
  
  const items = [];
  
  // Names
  if (data.firstName || data.first_name) {
    items.push({ label: 'الاسم الأول', value: data.firstName || data.first_name });
  }
  if (data.secondName || data.second_name) {
    items.push({ label: 'الاسم الثاني', value: data.secondName || data.second_name });
  }
  if (data.thirdName || data.third_name) {
    items.push({ label: 'الاسم الثالث', value: data.thirdName || data.third_name });
  }
  if (data.fourthName) {
    items.push({ label: 'الاسم الرابع', value: data.fourthName });
  }
  if (data.fatherName) {
    items.push({ label: 'اسم الأب', value: data.fatherName });
  }
  if (data.grandpaName) {
    items.push({ label: 'اسم الجد', value: data.grandpaName });
  }
  if (data.familyName) {
    items.push({ label: 'اسم العائلة', value: data.familyName });
  }
  if (data.fullName) {
    items.push({ label: 'الاسم الرباعي الكامل', value: data.fullName });
  }
  
  // Employee identification
  if (data.employee_name) {
    items.push({ label: 'اسم الموظف', value: data.employee_name });
  }
  if (data.employee_email) {
    items.push({ label: 'البريد الإلكتروني', value: data.employee_email });
  }
  if (data.employeeNumber || data.employee_number) {
    items.push({ label: 'رقم الهوية/الإقامة', value: data.employeeNumber || data.employee_number });
  }
  if (data.workId) {
    items.push({ label: 'الرقم الوظيفي', value: data.workId });
  }
  if (data.nationality) {
    items.push({ label: 'الجنسية', value: data.nationality });
  }
  if (data.gender) {
    const genderText = data.gender === 'male' ? 'ذكر' : data.gender === 'female' ? 'أنثى' : data.gender;
    items.push({ label: 'الجنس', value: genderText });
  }
  if (data.birthDate) {
    items.push({ label: 'تاريخ الميلاد', value: window.DetailUtils.formatDate(data.birthDate) });
  }
  
  if (items.length > 0) {
    grid.innerHTML = items.map(item => `
      <div class="info-item">
        <span class="info-label">${item.label}</span>
        <span class="info-value">${escapeHtml(String(item.value))}</span>
      </div>
    `).join('');
  } else {
    grid.innerHTML = '<div class="info-item"><span class="info-label">لا توجد معلومات متاحة</span></div>';
  }
}

function displayDocumentInfo(data) {
  const grid = document.getElementById('documentInfoGrid');
  if (!grid) return;
  
  const items = [];
  
  if (data.documentNumber || data.document_number) {
    items.push({ label: 'رقم المستند', value: data.documentNumber || data.document_number });
  }
  if (data.applicationDate) {
    items.push({ label: 'تاريخ الطلب', value: window.DetailUtils.formatDate(data.applicationDate) });
  }
  if (data.transactionNumber || data.transaction_number) {
    items.push({ label: 'رقم المعاملة', value: data.transactionNumber || data.transaction_number });
  }
  if (data.transactionDate || data.transaction_date) {
    items.push({ label: 'تاريخ المعاملة', value: window.DetailUtils.formatDate(data.transactionDate || data.transaction_date) });
  }
  if (data.appointmentDate) {
    items.push({ label: 'تاريخ التعيين', value: window.DetailUtils.formatDate(data.appointmentDate) });
  }
  
  if (items.length > 0) {
    grid.innerHTML = items.map(item => `
      <div class="info-item">
        <span class="info-label">${item.label}</span>
        <span class="info-value">${escapeHtml(String(item.value))}</span>
      </div>
    `).join('');
  } else {
    grid.innerHTML = '<div class="info-item"><span class="info-label">لا توجد معلومات متاحة</span></div>';
  }
}

function displayEmploymentInfo(data) {
  const grid = document.getElementById('employmentInfoGrid');
  if (!grid) return;
  
  const items = [];
  
  if (data.jobTitle || data.job_title) {
    items.push({ label: 'المسمى الوظيفي', value: data.jobTitle || data.job_title });
  }
  if (data.department || data.employee_dept) {
    items.push({ label: 'القسم', value: data.department || data.employee_dept });
  }
  if (data.employeeStatus || data.employee_status) {
    const statusText = (data.employeeStatus || data.employee_status) === 'full_assignment' ? 'مكلف كامل' : 
                      (data.employeeStatus || data.employee_status) === 'partial_assignment' ? 'مكلف جزئي' :
                      data.employeeStatus || data.employee_status;
    items.push({ label: 'حالة الموظف', value: statusText });
  }
  if (data.employmentType || data.employment_type) {
    const empType = data.employmentType || data.employment_type;
    const typeText = empType === 'civil_service' ? 'خدمة مدنية' :
                    empType === 'self_employment' ? 'عمل حر' :
                    empType === 'surplus_workforce' ? 'قوى عاملة فائضة' :
                    empType === 'locum' ? 'بدل' :
                    empType === 'partial_assignment' ? 'تكليف جزئي' :
                    empType;
    items.push({ label: 'نوع التوظيف', value: typeText });
  }
  if (data.reasonForJob || data.reason_for_job) {
    const reason = data.reasonForJob || data.reason_for_job;
    const reasonText = reason === 'transfer' ? 'النقل' :
                      reason === 'assignment' ? 'التكليف' :
                      reason === 'appointment' ? 'التعيين' :
                      reason === 'secondment' ? 'الايفاد' :
                      reason === 'scholarship' ? 'الابتعاث' :
                      reason;
    items.push({ label: 'سبب إعطاء الوظيفة', value: reasonText });
  }
  if (data.onboardingReason || data.onboarding_reason) {
    const reason = data.onboardingReason || data.onboarding_reason;
    const reasonText = reason === 'transfer' ? 'النقل' :
                      reason === 'assignment' ? 'التكليف' :
                      reason === 'appointment' ? 'التعيين' :
                      reason === 'secondment' ? 'الايفاد' :
                      reason === 'scholarship' ? 'الابتعاث' :
                      reason;
    items.push({ label: 'سبب المباشرة', value: reasonText });
  }
  if (data.group) {
    items.push({ label: 'المجموعة', value: data.group });
  }
  if (data.rank) {
    items.push({ label: 'الرتبة', value: data.rank });
  }
  if (data.phone) {
    items.push({ label: 'رقم الهاتف', value: data.phone });
  }
  
  if (items.length > 0) {
    grid.innerHTML = items.map(item => `
      <div class="info-item">
        <span class="info-label">${item.label}</span>
        <span class="info-value">${escapeHtml(String(item.value))}</span>
      </div>
    `).join('');
  } else {
    grid.innerHTML = '<div class="info-item"><span class="info-label">لا توجد معلومات متاحة</span></div>';
  }
}

function displayAdditionalDetails(data) {
  const card = document.getElementById('additionalDetailsCard');
  const grid = document.getElementById('additionalDetailsGrid');
  if (!card || !grid) return;
  
  const items = [];
  
  // Collect any other fields from payload that weren't shown yet
  const displayedFields = new Set([
    'firstName', 'secondName', 'thirdName', 'fourthName', 'fatherName', 'grandpaName', 'familyName', 'fullName',
    'employee_name', 'employee_email', 'employee_dept', 'employeeNumber', 'workId', 'nationality', 'gender', 'birthDate',
    'documentNumber', 'applicationDate', 'transactionNumber', 'transactionDate', 'appointmentDate',
    'jobTitle', 'department', 'employeeStatus', 'employmentType', 'reasonForJob', 'onboardingReason', 'group', 'rank', 'phone',
    'id', 'reference_number', 'status', 'request_date', 'start_date', 'created_at', 'updated_at', 'type',
    'approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'decision_note', 'created_by_user', 'created_by_name'
  ]);
  
  Object.entries(data).forEach(([key, value]) => {
    if (!displayedFields.has(key) && value !== null && value !== undefined && value !== '') {
      const label = getFieldLabel(key);
      items.push({ label, value: typeof value === 'object' ? JSON.stringify(value) : String(value) });
    }
  });
  
  if (items.length > 0) {
    card.style.display = 'block';
    grid.innerHTML = items.map(item => `
      <div class="info-item">
        <span class="info-label">${item.label}</span>
        <span class="info-value">${escapeHtml(item.value)}</span>
      </div>
    `).join('');
  } else {
    card.style.display = 'none';
  }
}

function displayTimeline(data) {
  const container = document.getElementById('timelineContainer');
  if (!container) return;
  
  const events = [];
  
  // Request created
  events.push({
    event: 'تم إنشاء طلب المباشرة',
    date: data.created_at,
    user: data.created_by_name || data.employee_name || 'الموظف',
    details: `رقم المرجع: ${data.reference_number}`,
    type: 'created'
  });
  
  // Use status history if available (from backend)
  if (data.status_history && Array.isArray(data.status_history)) {
    data.status_history.forEach(historyItem => {
      let eventText = 'تم تحديث الحالة';
      let eventType = 'status_update';
      
      if (historyItem.new_status === 'approved' || historyItem.new_status === 'مكتمل') {
        eventText = 'تمت الموافقة على الطلب';
        eventType = 'approved';
      } else if (historyItem.new_status === 'rejected' || historyItem.new_status === 'مرفوض') {
        eventText = 'تم رفض الطلب';
        eventType = 'rejected';
      } else {
        eventText = `تم تحديث الحالة إلى: ${historyItem.new_status}`;
      }
      
      events.push({
        event: eventText,
        date: historyItem.change_date,
        user: historyItem.changed_by_name || 'المدير',
        details: historyItem.change_note || null,
        type: eventType
      });
    });
  } else {
    // Fallback to basic status info if no history available
    // Status updates
    if (data.status !== 'قيد الاعتماد' && data.status !== 'قيد الانتظار') {
      events.push({
        event: `تم تحديث الحالة إلى: ${data.status}`,
        date: data.updated_at,
        user: 'النظام',
        type: 'status_update'
      });
    }
    
    // Approved
    if (data.approved_at) {
      events.push({
        event: 'تمت الموافقة على الطلب',
        date: data.approved_at,
        user: data.approved_by_name || 'المدير',
        details: data.decision_note || null,
        type: 'approved'
      });
    }
    
    // Rejected
    if (data.rejected_at) {
      events.push({
        event: 'تم رفض الطلب',
        date: data.rejected_at,
        user: data.rejected_by_name || 'المدير',
        details: data.decision_note || null,
        type: 'rejected'
      });
    }
  }
  
  // Scheduled start date
  if (data.start_date) {
    events.push({
      event: 'تاريخ المباشرة المحدد',
      date: data.start_date + 'T08:00:00',
      user: 'النظام',
      details: 'موعد بدء العمل الرسمي',
      type: 'info'
    });
  }
  
  // Sort events by date
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  container.innerHTML = events.map(event => `
    <div class="timeline-item timeline-${event.type}">
      <div class="timeline-event">${event.event}</div>
      <div class="timeline-meta">
        📅 ${window.DetailUtils.formatDateTime(event.date)} 
        • 👤 ${event.user}
        ${event.details ? `<br>💬 ${event.details}` : ''}
      </div>
    </div>
  `).join('');
}

function getStatusBadge(status) {
  const badges = {
    'قيد الاعتماد': '<span class="status-badge status-pending">⏳ قيد الاعتماد</span>',
    'قيد الانتظار': '<span class="status-badge status-pending">⏳ قيد الانتظار</span>',
    'قيد المراجعة': '<span class="status-badge status-pending">🔍 قيد المراجعة</span>',
    'موافق عليه': '<span class="status-badge status-approved">✅ موافق عليه</span>',
    'مرفوض': '<span class="status-badge status-rejected">❌ مرفوض</span>',
    'معلق': '<span class="status-badge status-hold">⏸️ معلق</span>',
    'مكتمل': '<span class="status-badge status-approved">✅ مكتمل</span>'
  };
  
  return badges[status] || `<span class="status-badge">${status}</span>`;
}

function getFieldLabel(key) {
  const labels = {
    'firstName': 'الاسم الأول',
    'secondName': 'الاسم الثاني',
    'thirdName': 'الاسم الثالث',
    'fourthName': 'الاسم الرابع',
    'fatherName': 'اسم الأب',
    'grandpaName': 'اسم الجد',
    'familyName': 'اسم العائلة',
    'fullName': 'الاسم الكامل',
    'jobTitle': 'المسمى الوظيفي',
    'workId': 'الرقم الوظيفي',
    'nationality': 'الجنسية',
    'reasonForJob': 'سبب إعطاء الوظيفة',
    'documentNumber': 'رقم المستند',
    'applicationDate': 'تاريخ الطلب',
    'startDate': 'تاريخ المباشرة',
    'transactionNumber': 'رقم المعاملة',
    'transactionDate': 'تاريخ المعاملة',
    'employeeStatus': 'حالة الموظف',
    'employeeNumber': 'رقم الهوية/الإقامة',
    'department': 'القسم',
    'group': 'المجموعة',
    'rank': 'الرتبة',
    'birthDate': 'تاريخ الميلاد',
    'appointmentDate': 'تاريخ التعيين',
    'employmentType': 'نوع التوظيف',
    'gender': 'الجنس',
    'onboardingReason': 'سبب المباشرة',
    'phone': 'رقم الهاتف'
  };
  
  return labels[key] || key;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

console.log('✅ Employee onboarding detail script loaded');

