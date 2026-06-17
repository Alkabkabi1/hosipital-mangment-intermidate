// Admin Direct Detail JavaScript
// Handles detailed view and management of onboarding/direct requests

document.addEventListener('DOMContentLoaded', function() {
  // Check if data is already loaded by HTML page (skip API loading)
  if (window.currentOnboarding) {
    // Data already loaded by HTML, just setup print/export listeners
    setupPrintExportListeners();
    return;
  }

  // Wait for dependencies
  if (typeof window.DetailUtils === 'undefined') {
    console.error('DetailUtils not loaded');
    setTimeout(() => {
      if (typeof window.DetailUtils === 'undefined') {
        alert('خطأ: لم يتم تحميل المكتبات المطلوبة');
        return;
      }
      initializePage();
    }, 500);
  } else {
    initializePage();
  }
});

function initializePage() {
  // Check authentication
  if (!window.DetailUtils.requireAuth()) return;
  
  // Check authorization - ONLY ADMIN, MANAGER, or Commissioners
  if (!canAccessOnboardingDetail()) {
    window.DetailUtils.showError('ليس لديك صلاحية للوصول إلى هذه الصفحة. مطلوب: دور ADMIN أو MANAGER أو تفويض نشط.');
    setTimeout(() => {
      window.location.href = window.resolveFrontendPath ? 
        window.resolveFrontendPath('employee-dashboard.html') : 
        'employee-dashboard.html';
    }, 3000);
    return;
  }

/**
 * Check if user can access onboarding detail page
 * ONLY: ADMIN, MANAGER, or Active Commissioner
 */
function canAccessOnboardingDetail() {
  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  if (!authUser) return false;
  
  // Check 1: ADMIN role
  if (window.rolePermissions && window.rolePermissions.hasRole('ADMIN')) {
    console.log('✅ Onboarding access granted: User is ADMIN');
    return true;
  }
  
  // Check 2: MANAGER role
  if (window.rolePermissions && window.rolePermissions.hasRole('MANAGER')) {
    console.log('✅ Onboarding access granted: User is MANAGER');
    return true;
  }
  
  // Check 3: Admin role (legacy)
  if (authUser.role === 'admin') {
    console.log('✅ Onboarding access granted: User is admin (legacy)');
    return true;
  }
  
  // Check 4: Active commissioner
  const urlParams = new URLSearchParams(window.location.search);
  const isCommissionerAccess = urlParams.get('commissioner') === 'true';
  
  if (isCommissionerAccess) {
    const delegations = JSON.parse(localStorage.getItem('delegations') || '[]');
    const userEmail = authUser?.email?.toLowerCase();
    
    const hasActiveTicket = delegations.some(d => {
      return d.status === 'active' && 
             (d.to || '').toLowerCase() === userEmail &&
             d.active &&
             (!d.validTo || d.validTo >= Date.now()) &&
             (d.scopes || []).some(s => s.includes('onboarding') || s.includes('direct') || s.includes('approve'));
    });
    
    if (hasActiveTicket) {
      console.log('✅ Onboarding access granted: User is active commissioner');
      return true;
    }
  }
  
  console.log('❌ Onboarding access denied: User must be ADMIN, MANAGER, or Commissioner');
  console.log('   Current roles:', authUser.roles || [authUser.role]);
  return false;
}

  // Get onboarding ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const onboardingId = urlParams.get('id');
  
  if (!onboardingId) {
    showError('معرف الطلب غير صحيح');
    setTimeout(() => {
      window.location.href = 'admin-direct-inbox.html';
    }, 2000);
    return;
  }

  // Initialize page (only if not already loaded by HTML)
  loadOnboardingDetails(onboardingId);
  setupEventListeners();
}

let currentOnboarding = null;

// Department Admin Configuration
const DEPARTMENT_ADMINS = {
  'الموارد البشرية': ['hr.admin1@example.com', 'hr.director@example.com'], // HR
  'تقنية المعلومات': ['it.admin@example.com', 'it.director@example.com'], // IT
  'الإدارة': ['upper.admin@example.com', 'ceo@example.com'] // Upper Management
};

// Enhanced role-based access control functions (kept for backwards compatibility)
function isDepartmentAdmin(userEmail) {
  if (!userEmail) return false;
  return Object.values(DEPARTMENT_ADMINS).some(emails => emails.includes(userEmail));
}

function canAccessAdminPage(user) {
  if (!user) return false;
  // Allow system admins
  if (user.role === 'admin') return true;
  // Allow department-specific admins
  if (isDepartmentAdmin(user.email)) return true;
  return false;
}

function requireEnhancedAdminAccess() {
  return window.DetailUtils.requireAdmin();
}

function canUserManageDepartment(departmentName) {
  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  const userEmail = authUser?.email;
  if (!userEmail || !departmentName) return false;
  
  const allowedEmails = DEPARTMENT_ADMINS[departmentName];
  return allowedEmails && allowedEmails.includes(userEmail);
}

function setupEventListeners() {
  // Back button
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'admin-direct-inbox.html';
    });
  }

  // Setup print/export listeners
  setupPrintExportListeners();

  // Status update buttons - using correct IDs from HTML
  const approveBtn = document.getElementById('btnApproveReq'); // Updated ID
  const rejectBtn = document.getElementById('btnRejectReq'); // Updated ID
  const holdBtn = document.getElementById('holdBtn');
  const completeBtn = document.getElementById('completeBtn');
  
  console.log('🔘 Setting up onboarding button listeners...', { approveBtn: !!approveBtn, rejectBtn: !!rejectBtn });
  
  if (approveBtn) {
    // Remove any existing onclick from HTML
    approveBtn.onclick = null;
    approveBtn.addEventListener('click', () => {
      console.log('👍 Approve button clicked');
      updateOnboardingStatus('مكتمل');
    });
  }
  
  if (rejectBtn) {
    // Remove any existing onclick from HTML
    rejectBtn.onclick = null;
    rejectBtn.addEventListener('click', () => {
      console.log('👎 Reject button clicked');
      updateOnboardingStatus('مرفوض');
    });
  }
  
  if (holdBtn) holdBtn.addEventListener('click', () => updateOnboardingStatus('معلق'));
  if (completeBtn) completeBtn.addEventListener('click', () => updateOnboardingStatus('مكتمل'));

  // Add comment button
  const addCommentBtn = document.getElementById('addCommentBtn');
  if (addCommentBtn) {
    addCommentBtn.addEventListener('click', showAddCommentModal);
  }

  // Create employee account button
  const createAccountBtn = document.getElementById('createAccountBtn');
  if (createAccountBtn) {
    createAccountBtn.addEventListener('click', showCreateAccountModal);
  }

  // Schedule onboarding button
  const scheduleBtn = document.getElementById('scheduleBtn');
  if (scheduleBtn) {
    scheduleBtn.addEventListener('click', showScheduleModal);
  }
}

async function loadOnboardingDetails(onboardingId) {
  try {
    window.DetailUtils.showLoading();
    
    const onboarding = await window.DetailUtils.loadRequestDetails(
      'onboarding',
      onboardingId,
      async (apiClient) => {
        if (apiClient && typeof apiClient.getOnboardingById === 'function') {
          return await apiClient.getOnboardingById(onboardingId);
        }
        throw new Error('getOnboardingById not available');
      }
    );
    
    currentOnboarding = onboarding;
    window.currentOnboarding = onboarding; // Make it globally accessible
    
    // Add computed properties
    currentOnboarding.urgencyLevel = getOnboardingUrgency(onboarding);
    currentOnboarding.daysUntilStart = getDaysUntilStart(onboarding.start_date);
    
    console.log('✅ currentOnboarding set:', window.currentOnboarding);
    
    displayOnboardingDetails(onboarding);
    loadOnboardingHistory(onboardingId);
    loadOnboardingChecklist(onboardingId);
    
  } catch (error) {
    console.error('Onboarding details loading error:', error);
    window.DetailUtils.showError('حدث خطأ في تحميل تفاصيل طلب المباشرة');
  } finally {
    window.DetailUtils.hideLoading();
  }
}

function displayOnboardingDetails(onboarding) {
  console.log('🎨 displayOnboardingDetails called with data:', onboarding);
  
  // Update page title
  const pageTitle = document.getElementById('pageTitle');
  console.log('📝 pageTitle element:', pageTitle);
  if (pageTitle) {
    pageTitle.textContent = `تفاصيل طلب مباشرة #${onboarding.reference_number}`;
  }

  // Basic information - using IDs from the HTML
  const elements = {
    rid: document.getElementById('rid'),
    rstatus: document.getElementById('rstatus'),
    rname: document.getElementById('rname'),
    rdept: document.getElementById('rdept'),
    remail: document.getElementById('remail'),
    rstartdate: document.getElementById('rstartdate'),
    rposition: document.getElementById('rposition'),
    rcontract: document.getElementById('rcontract'),
    rsalary: document.getElementById('rsalary'),
    rcreated: document.getElementById('rcreated'),
    rnotes: document.getElementById('rnotes')
  };
  
  console.log('📝 Found elements:', Object.keys(elements).filter(k => elements[k]).length, 'of', Object.keys(elements).length);

  // Populate the basic info fields
  if (elements.rid) {
    elements.rid.textContent = onboarding.reference_number || onboarding.id;
    console.log('✅ Set reference number:', elements.rid.textContent);
  }
  
  if (elements.rstatus) {
    const statusBadgeHTML = getOnboardingStatusBadge(onboarding.status);
    elements.rstatus.outerHTML = statusBadgeHTML;
    console.log('✅ Set status:', onboarding.status);
  }
  
  if (elements.rname) {
    elements.rname.textContent = onboarding.employee_name || onboarding.firstName + ' ' + onboarding.secondName || 'غير محدد';
    console.log('✅ Set employee name:', elements.rname.textContent);
  }
  
  if (elements.rdept) {
    elements.rdept.textContent = onboarding.employee_dept || onboarding.department || 'غير محدد';
    console.log('✅ Set department:', elements.rdept.textContent);
  }
  
  if (elements.remail) {
    elements.remail.textContent = onboarding.employee_email || 'غير محدد';
    console.log('✅ Set email:', elements.remail.textContent);
  }
  
  if (elements.rstartdate) {
    elements.rstartdate.textContent = window.DetailUtils.formatDate(onboarding.start_date);
    console.log('✅ Set start date:', elements.rstartdate.textContent);
  }
  
  if (elements.rposition) {
    elements.rposition.textContent = onboarding.jobTitle || onboarding.job_title || 'غير محدد';
    console.log('✅ Set position:', elements.rposition.textContent);
  }
  
  if (elements.rcontract) {
    elements.rcontract.textContent = getContractTypeDisplayName(onboarding.employment_type || onboarding.contract_type);
    console.log('✅ Set contract type:', elements.rcontract.textContent);
  }
  
  if (elements.rsalary) {
    elements.rsalary.textContent = onboarding.salary ? window.DetailUtils.formatCurrency(onboarding.salary) : 'غير محدد';
  }
  
  if (elements.rcreated) {
    elements.rcreated.textContent = window.DetailUtils.formatDate(onboarding.created_at);
    console.log('✅ Set created date:', elements.rcreated.textContent);
  }
  
  if (elements.rnotes) {
    elements.rnotes.textContent = onboarding.decision_note || onboarding.notes || 'لا توجد ملاحظات';
  }

  
  console.log('✅ All basic fields populated successfully!');

  // Update action buttons based on status
  updateActionButtons(onboarding);

  // Display comprehensive form data in new sections
  if (typeof window.displayEmployeeFormData === 'function') {
    console.log('📊 Calling displayEmployeeFormData...');
    window.displayEmployeeFormData(onboarding);
  }
  if (typeof window.displayDocumentInfo === 'function') {
    console.log('📊 Calling displayDocumentInfo...');
    window.displayDocumentInfo(onboarding);
  }
  if (typeof window.displayEmploymentDetails === 'function') {
    console.log('📊 Calling displayEmploymentDetails...');
    window.displayEmploymentDetails(onboarding);
  }

  // Display additional information
  console.log('📊 Calling displayAdditionalInfo...');
  displayAdditionalInfo(onboarding);
  
  // Display timeline
  console.log('📊 Calling displayTimeline...');
  displayTimeline(onboarding);
  
  // Render department status if function exists
  if (typeof window.renderDepartmentStatus === 'function') {
    console.log('📊 Calling renderDepartmentStatus...');
    setTimeout(() => {
      window.renderDepartmentStatus();
    }, 200);
  }
  
  console.log('🎉 Page fully rendered with all data!');
}

function getContractTypeDisplayName(type) {
  const typeNames = {
    permanent: 'دائم',
    temporary: 'مؤقت',
    contract: 'عقد',
    internship: 'تدريب',
    part_time: 'جزئي'
  };
  
  return typeNames[type] || type;
}

function getOnboardingStatusBadge(status) {
  const statusBadges = {
    'قيد الانتظار': '<span class="status-badge status-pending">قيد الانتظار</span>',
    'قيد المراجعة': '<span class="status-badge status-review">قيد المراجعة</span>',
    'موافق عليه': '<span class="status-badge status-approved">موافق عليه</span>',
    'مرفوض': '<span class="status-badge status-rejected">مرفوض</span>',
    'مكتمل': '<span class="status-badge status-completed">مكتمل</span>',
    'معلق': '<span class="status-badge status-hold">معلق</span>',
    'قيد التنفيذ': '<span class="status-badge status-in-progress">قيد التنفيذ</span>'
  };
  
  return statusBadges[status] || `<span class="status-badge">${status}</span>`;
}

function updateActionButtons(onboarding) {
  const approveBtn = document.getElementById('approveBtn');
  const rejectBtn = document.getElementById('rejectBtn');
  const holdBtn = document.getElementById('holdBtn');
  const completeBtn = document.getElementById('completeBtn');
  const createAccountBtn = document.getElementById('createAccountBtn');
  const scheduleBtn = document.getElementById('scheduleBtn');
  
  const canApprove = ['قيد الانتظار', 'قيد المراجعة'].includes(onboarding.status);
  const canReject = ['قيد الانتظار', 'قيد المراجعة'].includes(onboarding.status);
  const canHold = ['قيد الانتظار', 'قيد المراجعة', 'موافق عليه'].includes(onboarding.status);
  const canComplete = ['موافق عليه', 'قيد التنفيذ'].includes(onboarding.status);
  const canCreateAccount = onboarding.status === 'موافق عليه' && !onboarding.employee_id;
  const canSchedule = ['موافق عليه', 'قيد التنفيذ'].includes(onboarding.status);
  
  if (approveBtn) {
    approveBtn.disabled = !canApprove;
    approveBtn.style.display = canApprove ? 'inline-flex' : 'none';
  }
  
  if (rejectBtn) {
    rejectBtn.disabled = !canReject;
    rejectBtn.style.display = canReject ? 'inline-flex' : 'none';
  }
  
  if (holdBtn) {
    holdBtn.disabled = !canHold;
    holdBtn.style.display = canHold ? 'inline-flex' : 'none';
  }
  
  if (completeBtn) {
    completeBtn.disabled = !canComplete;
    completeBtn.style.display = canComplete ? 'inline-flex' : 'none';
  }
  
  if (createAccountBtn) {
    createAccountBtn.disabled = !canCreateAccount;
    createAccountBtn.style.display = canCreateAccount ? 'inline-flex' : 'none';
  }
  
  if (scheduleBtn) {
    scheduleBtn.disabled = !canSchedule;
    scheduleBtn.style.display = canSchedule ? 'inline-flex' : 'none';
  }
}

function displayAdditionalInfo(onboarding) {
  const additionalInfoContainer = document.getElementById('additionalInfo');
  if (!additionalInfoContainer) return;

  const additionalInfo = `
    <div class="info-section">
      <h4>معلومات إضافية</h4>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">تاريخ الإنشاء:</span>
          <span class="value">${window.DetailUtils.formatDateTime(onboarding.created_at)}</span>
        </div>
        <div class="info-item">
          <span class="label">آخر تحديث:</span>
          <span class="value">${window.DetailUtils.formatDateTime(onboarding.updated_at)}</span>
        </div>
        <div class="info-item">
          <span class="label">عمر الطلب:</span>
          <span class="value">${getRequestAge(onboarding.request_date)}</span>
        </div>
        <div class="info-item">
          <span class="label">أيام حتى المباشرة:</span>
          <span class="value ${onboarding.daysUntilStart <= 3 ? 'urgent' : ''}">${getDaysUntilStartText(onboarding.daysUntilStart)}</span>
        </div>
        <div class="info-item">
          <span class="label">مستوى الأولوية:</span>
          <span class="value">${getUrgencyText(onboarding.urgencyLevel)}</span>
        </div>
        <div class="info-item">
          <span class="label">نوع العقد:</span>
          <span class="value">${getContractTypeDisplayName(onboarding.contract_type)}</span>
        </div>
        ${onboarding.rejection_reason ? `
          <div class="info-item full-width">
            <span class="label">سبب الرفض:</span>
            <span class="value rejection-reason">${onboarding.rejection_reason}</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  additionalInfoContainer.innerHTML = additionalInfo;
}

function displayTimeline(onboarding) {
  const timelineContainer = document.getElementById('timelineContainer');
  if (!timelineContainer) return;

  // Mock timeline data - in real app, this would come from API
  const timelineEvents = [
    {
      date: onboarding.created_at,
      event: 'تم إنشاء طلب المباشرة',
      user: onboarding.requested_by_name || 'مدير الموارد البشرية',
      type: 'created',
      details: `المسمى الوظيفي: ${onboarding.position}`
    }
  ];

  // Add status updates
  if (onboarding.status !== 'قيد الانتظار') {
    timelineEvents.push({
      date: onboarding.updated_at,
      event: `تم تحديث الحالة إلى: ${onboarding.status}`,
      user: 'المدير',
      type: 'status_update'
    });
  }

  // Add scheduled start date
  if (onboarding.start_date) {
    const startDateTime = onboarding.start_date + 'T08:00:00';
    timelineEvents.push({
      date: startDateTime,
      event: 'تاريخ المباشرة المجدول',
      user: 'النظام',
      type: 'scheduled',
      details: 'تاريخ بداية العمل الرسمي'
    });
  }

  const timelineHTML = `
    <div class="timeline-section">
      <h4>سجل الأحداث</h4>
      <div class="timeline">
        ${timelineEvents.map(event => `
          <div class="timeline-item ${event.type}">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-event">${event.event}</span>
                <span class="timeline-date">${window.DetailUtils.formatDateTime(event.date)}</span>
              </div>
              <div class="timeline-user">بواسطة: ${event.user}</div>
              ${event.details ? `<div class="timeline-details">${event.details}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  timelineContainer.innerHTML = timelineHTML;
}

async function loadOnboardingHistory(onboardingId) {
  try {
    // This would typically call an API endpoint for history
    console.log('Loading history for onboarding:', onboardingId);
  } catch (error) {
    console.error('History loading error:', error);
  }
}

async function loadOnboardingChecklist(onboardingId) {
  try {
    const checklistContainer = document.getElementById('checklistContainer');
    if (!checklistContainer) return;

    // Mock checklist data - replace with actual API call
    const checklist = await getMockChecklist();
    
    const checklistHTML = `
      <div class="checklist-section">
        <h4>قائمة مهام المباشرة</h4>
        <div class="checklist-list">
          ${checklist.map(item => `
            <div class="checklist-item ${item.completed ? 'completed' : ''}">
              <div class="checklist-checkbox">
                <input type="checkbox" ${item.completed ? 'checked' : ''} 
                       onchange="updateChecklistItem(${item.id}, this.checked)">
              </div>
              <div class="checklist-content">
                <div class="checklist-title">${item.title}</div>
                <div class="checklist-description">${item.description}</div>
                ${item.due_date ? `
                  <div class="checklist-due">مطلوب بتاريخ: ${window.DetailUtils.formatDate(item.due_date)}</div>
                ` : ''}
                ${item.assigned_to ? `
                  <div class="checklist-assigned">مسؤول: ${item.assigned_to}</div>
                ` : ''}
              </div>
              <div class="checklist-status">
                ${item.completed ? 
                  `<span class="checklist-badge completed">مكتمل</span>` : 
                  `<span class="checklist-badge pending">معلق</span>`
                }
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="checklist-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${getChecklistProgress(checklist)}%"></div>
          </div>
          <div class="progress-text">
            ${checklist.filter(item => item.completed).length} من ${checklist.length} مكتمل 
            (${Math.round(getChecklistProgress(checklist))}%)
          </div>
        </div>
      </div>
    `;

    checklistContainer.innerHTML = checklistHTML;
    
  } catch (error) {
    console.error('Checklist loading error:', error);
  }
}

function getMockChecklist() {
  return Promise.resolve([
    {
      id: 1,
      title: 'إنشاء حساب موظف',
      description: 'إنشاء حساب في النظام وإرسال بيانات الدخول',
      completed: false,
      due_date: null,
      assigned_to: 'قسم تقنية المعلومات'
    },
    {
      id: 2,
      title: 'تجهيز مكتب العمل',
      description: 'تجهيز المكتب والأدوات المكتبية اللازمة',
      completed: true,
      due_date: '2024-01-20',
      assigned_to: 'الخدمات العامة'
    },
    {
      id: 3,
      title: 'برنامج التوجيه',
      description: 'تنظيم جلسة توجيه للموظف الجديد',
      completed: false,
      due_date: '2024-01-22',
      assigned_to: 'الموارد البشرية'
    },
    {
      id: 4,
      title: 'تسليم الأجهزة',
      description: 'تسليم الحاسوب والهاتف والأدوات التقنية',
      completed: false,
      due_date: '2024-01-20',
      assigned_to: 'قسم تقنية المعلومات'
    },
    {
      id: 5,
      title: 'التدريب الأولي',
      description: 'تدريب الموظف على الأنظمة والإجراءات',
      completed: false,
      due_date: '2024-01-25',
      assigned_to: 'المدير المباشر'
    }
  ]);
}

function getChecklistProgress(checklist) {
  if (checklist.length === 0) return 0;
  const completedCount = checklist.filter(item => item.completed).length;
  return (completedCount / checklist.length) * 100;
}

function updateChecklistItem(itemId, completed) {
  // This would typically update the item via API
  console.log('Updating checklist item:', itemId, 'completed:', completed);
  showSuccess(completed ? 'تم وضع علامة على المهمة كمكتملة' : 'تم إلغاء علامة الإكمال');
}

function getOnboardingUrgency(onboarding) {
  if (window.DateUtils && typeof window.DateUtils.getDaysDifference === 'function') {
    const daysSinceRequest = window.DateUtils.getDaysDifference(onboarding.request_date, window.DateUtils.getToday());
    const daysUntilStart = window.DateUtils.getDaysDifference(window.DateUtils.getToday(), onboarding.start_date);
    
    if (daysUntilStart <= 3) return 3; // High - starting very soon
    if (daysSinceRequest > 14) return 3; // High - old request
    if (daysUntilStart <= 7) return 2; // Medium - starting soon
    return 1; // Low
  }
  // Fallback
  return 1;
}

function getDaysUntilStart(startDate) {
  if (!startDate) return null;
  if (window.DateUtils && typeof window.DateUtils.getDaysDifference === 'function') {
    return window.DateUtils.getDaysDifference(window.DateUtils.getToday(), startDate);
  }
  // Fallback calculation
  try {
    const today = new Date();
    const start = new Date(startDate);
    const diffTime = start - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (e) {
    return null;
  }
}

function getRequestAge(requestDate) {
  let days = 0;
  if (window.DateUtils && typeof window.DateUtils.getDaysDifference === 'function') {
    days = window.DateUtils.getDaysDifference(requestDate, window.DateUtils.getToday());
  } else {
    // Fallback
    try {
      const today = new Date();
      const reqDate = new Date(requestDate);
      const diffTime = today - reqDate;
      days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      return 'غير محدد';
    }
  }
  
  if (days === 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 7) return `${days} أيام`;
  if (days < 30) return `${Math.floor(days / 7)} أسابيع`;
  return `${Math.floor(days / 30)} شهور`;
}

function getDaysUntilStartText(days) {
  if (days === null) return 'غير محدد';
  if (days < 0) return 'تأخر في المباشرة';
  if (days === 0) return 'اليوم';
  if (days === 1) return 'غداً';
  return `${days} أيام`;
}

function getUrgencyText(level) {
  const urgencyTexts = {
    1: 'منخفض',
    2: 'متوسط',
    3: 'عالي'
  };
  
  return urgencyTexts[level] || 'غير محدد';
}

async function updateOnboardingStatus(newStatus) {
  if (!currentOnboarding) {
    console.error('❌ No current onboarding loaded');
    return;
  }

  console.log('🔄 updateOnboardingStatus called with status:', newStatus);

  let confirmMessage = `هل أنت متأكد من تحديث حالة طلب المباشرة إلى "${newStatus}"؟`;
  let reason = null;

  if (newStatus === 'مرفوض') {
    reason = await showRejectModal();
    if (!reason) return;
  }

  if (!confirm(confirmMessage)) return;

  try {
    console.log('📡 Sending approval/rejection request to API...');
    
    const apiClient = window.DetailUtils.getApiClient();
    if (!apiClient) {
      throw new Error('API client not available');
    }

    // Use multi-approval API endpoints
    if (newStatus === 'مكتمل' || newStatus === 'موافق عليه') {
      // Approve request
      console.log('👍 Calling approve API...');
      const response = await apiClient.makeRequest(`/requests/onboarding/${currentOnboarding.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ note: reason || 'موافقة' })
      });
      console.log('✅ Approve response:', response);
    } else if (newStatus === 'مرفوض') {
      // Reject request
      console.log('👎 Calling reject API...');
      const response = await apiClient.makeRequest(`/requests/onboarding/${currentOnboarding.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ note: reason || 'رفض' })
      });
      console.log('✅ Reject response:', response);
    } else {
      // Other status changes (hold, etc.)
      if (typeof apiClient.updateOnboardingStatus === 'function') {
        await apiClient.updateOnboardingStatus(currentOnboarding.id, { status: newStatus, rejection_reason: reason });
      } else {
        throw new Error('Cannot update to status: ' + newStatus);
      }
    }
    
    window.DetailUtils.showSuccess(`تم تحديث حالة الطلب إلى "${newStatus}" بنجاح`);
    
    // Set flag to refresh dashboard when user returns
    sessionStorage.setItem('returnedFromDetail', 'true');
    
    // Option 1: Reload page to show updated status
    setTimeout(() => {
      console.log('🔄 Reloading onboarding details...');
      window.location.reload();
    }, 1500);
    
    // Option 2: Or redirect back to inbox
    // setTimeout(() => {
    //   window.location.href = 'admin-direct-inbox.html';
    // }, 1500);
    
  } catch (error) {
    console.error('❌ Status update error:', error);
    window.DetailUtils.showError('حدث خطأ في تحديث حالة الطلب: ' + (error.message || 'خطأ غير معروف'));
  }
}

function showRejectModal() {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>سبب رفض طلب المباشرة</h3>
          <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove(); resolve(null);">×</button>
        </div>
        <div class="modal-body">
          <textarea id="rejectionReason" class="textarea" placeholder="يرجى توضيح سبب رفض الطلب..." rows="4" required></textarea>
          
          <div class="common-reasons">
            <h4>أسباب شائعة للرفض:</h4>
            <div class="reason-buttons">
              <button type="button" class="reason-btn" onclick="document.getElementById('rejectionReason').value = this.textContent">
                عدم توفر الميزانية
              </button>
              <button type="button" class="reason-btn" onclick="document.getElementById('rejectionReason').value = this.textContent">
                عدم وجود شاغر وظيفي
              </button>
              <button type="button" class="reason-btn" onclick="document.getElementById('rejectionReason').value = this.textContent">
                عدم استيفاء المتطلبات
              </button>
              <button type="button" class="reason-btn" onclick="document.getElementById('rejectionReason').value = this.textContent">
                تأجيل التوظيف
              </button>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-danger" onclick="submitRejection()">
              تأكيد الرفض
            </button>
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove(); resolve(null);">
              إلغاء
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus on textarea
    setTimeout(() => {
      document.getElementById('rejectionReason').focus();
    }, 100);
    
    // Submit function
    window.submitRejection = function() {
      const reason = document.getElementById('rejectionReason').value.trim();
      if (!reason) {
        showError('يرجى إدخال سبب الرفض');
        return;
      }
      
      modal.remove();
      resolve(reason);
    };
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.remove();
        resolve(null);
      }
    });
  });
}

function showAddCommentModal() {
  showInfo('إضافة التعليقات ستكون متاحة قريباً');
}

function showCreateAccountModal() {
  showInfo('إنشاء حساب الموظف سيكون متاحاً قريباً');
}

function showScheduleModal() {
  showInfo('جدولة المباشرة ستكون متاحة قريباً');
}

function printOnboarding() {
  window.print();
}

function exportOnboarding() {
  if (!currentOnboarding) {
    showError('لا توجد بيانات للتصدير');
    return;
  }

  const exportData = {
    reference_number: currentOnboarding.reference_number,
    position: currentOnboarding.position,
    department: currentOnboarding.department_name,
    contract_type: getContractTypeDisplayName(currentOnboarding.contract_type),
    salary: currentOnboarding.salary ? (typeof Utils !== 'undefined' ? Utils.formatCurrency(currentOnboarding.salary) : `${currentOnboarding.salary} ريال`) : '',
    request_date: window.DetailUtils.formatDate(currentOnboarding.request_date),
    start_date: window.DetailUtils.formatDate(currentOnboarding.start_date),
    status: (window.getStatusDisplay ? window.getStatusDisplay(currentOnboarding.status) : currentOnboarding.status),
    requested_by: currentOnboarding.requested_by_name || ''
  };

  const csvContent = Object.keys(exportData).map(key => 
    `"${key}","${exportData[key]}"`
  ).join('\n');

  downloadFile(
    'الحقل,القيمة\n' + csvContent, 
    `onboarding_${currentOnboarding.reference_number}.csv`, 
    'text/csv'
  );
  
  showSuccess('تم تصدير بيانات طلب المباشرة بنجاح');
}

// Separate function for print/export listeners (used when data is pre-loaded)
function setupPrintExportListeners() {
  // Print button
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', printOnboarding);
  }

  // Export button
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportOnboarding);
  }
}

// Add onboarding detail-specific CSS
const adminDetailStyles = document.createElement('style');
adminDetailStyles.textContent = `
  .onboarding-detail-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .detail-header {
    background: linear-gradient(135deg, #059669, #10b981);
    color: white;
    border-radius: 12px;
    padding: 25px;
    margin-bottom: 30px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  .detail-title {
    margin-bottom: 20px;
    font-size: 24px;
    font-weight: 600;
  }
  
  .detail-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    flex-wrap: wrap;
  }
  
  .detail-actions .btn {
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.3);
    color: white;
  }
  
  .detail-actions .btn:hover {
    background: rgba(255,255,255,0.3);
  }
  
  .detail-actions .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .detail-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 30px;
  }
  
  .main-details,
  .side-details {
    background: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  .side-details {
    height: fit-content;
  }
  
  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #e5e7eb;
  }
  
  .detail-field {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 12px 0;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .detail-field:last-child {
    border-bottom: none;
  }
  
  .detail-field .label {
    font-weight: 600;
    color: #374151;
    min-width: 140px;
  }
  
  .detail-field .value {
    color: #6b7280;
    text-align: left;
    flex: 1;
  }
  
  .status-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
  }
  
  .status-pending { background: #fef3c7; color: #92400e; }
  .status-review { background: #dbeafe; color: #1e40af; }
  .status-approved { background: #d1fae5; color: #065f46; }
  .status-rejected { background: #fee2e2; color: #991b1b; }
  .status-completed { background: #e0e7ff; color: #3730a3; }
  .status-hold { background: #fed7aa; color: #9a3412; }
  .status-in-progress { background: #bfdbfe; color: #1e40af; }
  
  .info-section {
    margin-bottom: 30px;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
  }
  
  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    background: #f9fafb;
    border-radius: 6px;
  }
  
  .info-item.full-width {
    grid-column: 1 / -1;
    flex-direction: column;
    gap: 5px;
  }
  
  .rejection-reason {
    color: #dc2626;
    font-weight: 600;
  }
  
  .urgent {
    color: #dc2626;
    font-weight: 600;
  }
  
  .timeline-section {
    margin-bottom: 30px;
  }
  
  .timeline {
    position: relative;
    padding-left: 30px;
  }
  
  .timeline::before {
    content: '';
    position: absolute;
    left: 10px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #e5e7eb;
  }
  
  .timeline-item {
    position: relative;
    margin-bottom: 20px;
  }
  
  .timeline-marker {
    position: absolute;
    left: -25px;
    top: 5px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #059669;
    border: 3px solid white;
    box-shadow: 0 0 0 2px #e5e7eb;
  }
  
  .timeline-item.created .timeline-marker { background: #10b981; }
  .timeline-item.status_update .timeline-marker { background: #f59e0b; }
  .timeline-item.scheduled .timeline-marker { background: #3b82f6; }
  
  .timeline-content {
    background: #f9fafb;
    padding: 15px;
    border-radius: 8px;
    border-left: 3px solid #059669;
  }
  
  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
  }
  
  .timeline-event {
    font-weight: 600;
    color: #374151;
  }
  
  .timeline-date {
    font-size: 14px;
    color: #6b7280;
  }
  
  .timeline-user {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 5px;
  }
  
  .timeline-details {
    font-size: 14px;
    color: #4b5563;
    font-style: italic;
  }
  
  .checklist-section {
    margin-bottom: 30px;
  }
  
  .checklist-list {
    margin-bottom: 20px;
  }
  
  .checklist-item {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    display: flex;
    align-items: flex-start;
    gap: 15px;
    transition: all 0.3s;
  }
  
  .checklist-item.completed {
    background: #f0fdf4;
    border-color: #bbf7d0;
  }
  
  .checklist-checkbox input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
  
  .checklist-content {
    flex: 1;
  }
  
  .checklist-title {
    font-weight: 600;
    color: #374151;
    margin-bottom: 5px;
  }
  
  .checklist-item.completed .checklist-title {
    text-decoration: line-through;
    color: #6b7280;
  }
  
  .checklist-description {
    color: #6b7280;
    font-size: 14px;
    margin-bottom: 8px;
    line-height: 1.4;
  }
  
  .checklist-due {
    font-size: 13px;
    color: #f59e0b;
    font-weight: 600;
  }
  
  .checklist-assigned {
    font-size: 13px;
    color: #6b7280;
    margin-top: 3px;
  }
  
  .checklist-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .checklist-badge.completed { background: #d1fae5; color: #065f46; }
  .checklist-badge.pending { background: #fef3c7; color: #92400e; }
  
  .checklist-progress {
    background: #f3f4f6;
    padding: 15px;
    border-radius: 8px;
    text-align: center;
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 10px;
  }
  
  .progress-fill {
    height: 100%;
    background: #10b981;
    transition: width 0.5s ease;
  }
  
  .progress-text {
    color: #374151;
    font-weight: 600;
    font-size: 14px;
  }
  
  .reason-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
    margin: 15px 0;
  }
  
  .reason-btn {
    padding: 10px;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    text-align: right;
    transition: all 0.3s;
  }
  
  .reason-btn:hover {
    background: #e5e7eb;
  }
  
  @media (max-width: 768px) {
    .detail-content {
      grid-template-columns: 1fr;
    }
    
    .detail-actions {
      justify-content: center;
    }
    
    .info-grid {
      grid-template-columns: 1fr;
    }
    
    .checklist-item {
      flex-direction: column;
      gap: 10px;
    }
  }
  
  @media print {
    .detail-actions,
    .btn,
    .checklist-checkbox {
      display: none !important;
    }
    
    .onboarding-detail-container {
      max-width: none;
      margin: 0;
      padding: 0;
    }
    
    .detail-content {
      grid-template-columns: 1fr;
    }
    
    .detail-header {
      background: #f3f4f6 !important;
      color: #374151 !important;
    }
  }
`;
document.head.appendChild(adminDetailStyles);

// Utility functions (from inbox pattern)
function downloadFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

function showSuccess(message) {
  window.DetailUtils.showSuccess(message);
}

function showError(message) {
  window.DetailUtils.showError(message);
}

function showInfo(message) {
  window.DetailUtils.showInfo(message);
}

// Enhanced export functions (from inbox pattern)
function exportOnboardingExcel() {
  if (!currentOnboarding) {
    showError('لا توجد بيانات للتصدير');
    return;
  }

  const exportData = {
    reference_number: currentOnboarding.reference_number,
    position: currentOnboarding.position,
    department: currentOnboarding.department_name,
    contract_type: getContractTypeDisplayName(currentOnboarding.contract_type),
    salary: currentOnboarding.salary ? window.DetailUtils.formatCurrency(currentOnboarding.salary) : '',
    request_date: window.DetailUtils.formatDate(currentOnboarding.request_date),
    start_date: window.DetailUtils.formatDate(currentOnboarding.start_date),
    status: (window.getStatusDisplay ? window.getStatusDisplay(currentOnboarding.status) : currentOnboarding.status),
    requested_by: currentOnboarding.requested_by_name || ''
  };

  const csvContent = Object.keys(exportData).map(key => 
    `"${key}","${exportData[key]}"`
  ).join('\n');

  downloadFile(
    'الحقل,القيمة\n' + csvContent, 
    `onboarding_${currentOnboarding.reference_number}.csv`, 
    'text/csv'
  );
  
  showSuccess('تم تصدير البيانات بنجاح');
}

function exportOnboardingPDF() {
  // PDF export functionality from inbox pattern
  showInfo('تصدير PDF سيكون متاحاً قريباً');
}

// Debug function to test role-based access control
function testRoleBasedAccess() {
  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  console.log('=== Testing Role-Based Access Control (JS) ===');
  console.log('Current user:', authUser);
  console.log('Current user email:', authUser?.email);
  console.log('User role:', authUser?.role);
  console.log('Can access admin page:', canAccessAdminPage(authUser));
  console.log('Is department admin:', isDepartmentAdmin(authUser?.email));
  console.log('Department permissions:');
  
  Object.keys(DEPARTMENT_ADMINS).forEach(dept => {
    const canManage = canUserManageDepartment(dept);
    console.log(`- ${dept}: ${canManage ? '✅ Authorized' : '❌ Not authorized'}`);
  });
  
  console.log('Department configuration:', DEPARTMENT_ADMINS);
  console.log('===========================================');
}

// Run test on load (can be removed in production)
if (typeof window !== 'undefined') {
  setTimeout(testRoleBasedAccess, 500);
}
