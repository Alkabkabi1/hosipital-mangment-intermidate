// Employee Clearance Detail - View comprehensive clearance request details
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
  loadClearanceDetails(requestId);
}

async function loadClearanceDetails(requestId) {
  // Show loading skeletons
  showLoadingSkeletons();
  
  try {
    console.log('📄 Loading clearance details for ID:', requestId);
    
    const apiClient = window.DetailUtils.getApiClient();
    if (!apiClient) {
      throw new Error('API client not available');
    }
    
    const response = await apiClient.getClearanceById(requestId);
    console.log('📄 Received clearance details:', response);
    
    if (!response) {
      throw new Error('No data received');
    }
    
    // Add smooth reveal animation
    setTimeout(() => {
      displayClearanceDetails(response);
    }, 100);
    
  } catch (error) {
    console.error('Error loading clearance details:', error);
    
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
  const grids = ['employeeInfoGrid', 'clearanceDetailsGrid'];
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

function displayClearanceDetails(data) {
  console.log('📋 Displaying clearance details:', data);
  
  // Update page title
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) {
    pageTitle.textContent = `تفاصيل طلب إخلاء طرف #${data.reference_number || data.id}`;
  }
  
  // Basic information
  const refNum = document.getElementById('referenceNumber');
  if (refNum) refNum.textContent = data.reference_number || `#${data.id}`;
  
  const status = document.getElementById('currentStatus');
  if (status) status.innerHTML = getStatusBadge(data.status);
  
  const reqDate = document.getElementById('requestDate');
  if (reqDate) reqDate.textContent = window.DetailUtils.formatDate(data.request_date || data.created_at);
  
  const lastDay = document.getElementById('lastWorkDay');
  if (lastDay) lastDay.textContent = window.DetailUtils.formatDate(data.last_work_day);
  
  // Employee Information
  displayEmployeeInfo(data);
  
  // Clearance Details
  displayClearanceInfo(data);
  
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
  
  // Employee identification
  if (data.employee_name) {
    items.push({ label: 'اسم الموظف', value: data.employee_name });
  }
  if (data.employee_email) {
    items.push({ label: 'البريد الإلكتروني', value: data.employee_email });
  }
  if (data.employee_dept) {
    items.push({ label: 'القسم', value: data.employee_dept });
  }
  if (data.employeeNumber || data.employee_number) {
    items.push({ label: 'رقم الموظف', value: data.employeeNumber || data.employee_number });
  }
  if (data.jobTitle || data.job_title) {
    items.push({ label: 'المسمى الوظيفي', value: data.jobTitle || data.job_title });
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

function displayClearanceInfo(data) {
  const grid = document.getElementById('clearanceDetailsGrid');
  if (!grid) return;
  
  const items = [];
  
  if (data.clearance_type || data.clearanceType) {
    const type = data.clearance_type || data.clearanceType;
    const typeText = type === 'end_of_service' ? 'إخلاء طرف نهاية خدمة' :
                    type === 'end_mid_service' ? 'إخلاء طرف خدمة متوسطة' :
                    type;
    items.push({ label: 'نوع إخلاء الطرف', value: typeText });
  }
  
  if (data.reason) {
    items.push({ label: 'سبب إخلاء الطرف', value: data.reason });
  }
  
  if (data.specific_reason || data.specificReason) {
    const specific = data.specific_reason || data.specificReason;
    const specificText = specific === 'retirement' ? 'التقاعد' :
                        specific === 'due_to_assignment' ? 'بسبب التكليف' :
                        specific === 'end_of_contract' ? 'انتهاء العقد' :
                        specific === 'resignation' ? 'الاستقالة' :
                        specific === 'death' ? 'الوفاة' :
                        specific === 'disability' ? 'العجز' :
                        specific === 'other' ? 'أخرى' :
                        specific;
    items.push({ label: 'السبب المحدد', value: specificText });
  }
  
  if (data.otherReasonText) {
    items.push({ label: 'تفاصيل السبب', value: data.otherReasonText });
  }
  
  if (data.documentNumber || data.document_number) {
    items.push({ label: 'رقم المستند', value: data.documentNumber || data.document_number });
  }
  
  if (data.last_work_day) {
    items.push({ label: 'آخر يوم عمل', value: window.DetailUtils.formatDate(data.last_work_day) });
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
    'firstName', 'secondName', 'thirdName',
    'employee_name', 'employee_email', 'employee_dept', 'employeeNumber', 'jobTitle', 'phone',
    'clearance_type', 'clearanceType', 'reason', 'specific_reason', 'specificReason', 'otherReasonText',
    'documentNumber', 'document_number', 'last_work_day', 'lastWorkingDay',
    'id', 'reference_number', 'status', 'request_date', 'created_at', 'updated_at', 'type',
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
    event: 'تم إنشاء طلب إخلاء الطرف',
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
  
  // Last working day
  if (data.last_work_day) {
    events.push({
      event: 'آخر يوم عمل محدد',
      date: data.last_work_day + 'T17:00:00',
      user: 'النظام',
      details: 'تاريخ انتهاء الخدمة',
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
    'employeeNumber': 'رقم الموظف',
    'jobTitle': 'المسمى الوظيفي',
    'phone': 'رقم الهاتف',
    'clearanceType': 'نوع إخلاء الطرف',
    'specificReason': 'السبب المحدد',
    'documentNumber': 'رقم المستند',
    'otherReasonText': 'تفاصيل السبب الآخر'
  };
  
  return labels[key] || key;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

console.log('✅ Employee clearance detail script loaded');

