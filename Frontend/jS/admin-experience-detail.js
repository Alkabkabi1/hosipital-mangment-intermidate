// Admin Experience Detail JavaScript
// Handles detailed view and management of experience certificate requests

document.addEventListener('DOMContentLoaded', function() {
  // Check if data is already loaded by HTML page (skip API loading)
  if (window.currentExperience) {
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
  if (!canAccessExperienceDetail()) {
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
function canAccessExperienceDetail() {
  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  if (!authUser) return false;
  
  // Check 1: ADMIN role
  if (window.rolePermissions && window.rolePermissions.hasRole('ADMIN')) {
    console.log('✅ Experience access granted: User is ADMIN');
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
             (d.scopes || []).some(s => s.includes('experience') || s.includes('certificate') || s.includes('approve'));
    });
    
    if (hasActiveTicket) {
      console.log('✅ Experience access granted: User is active commissioner');
      return true;
    }
  }
  
  console.log('❌ Experience access denied: User must be ADMIN, MANAGER, or Commissioner');
  console.log('   Current roles:', authUser.roles || [authUser.role]);
  return false;
}

  // Get onboarding ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const experienceId = urlParams.get('id');
  
  if (!experienceId) {
    showError('معرف الطلب غير صحيح');
    setTimeout(() => {
      window.location.href = 'admin-dashboard.html';
    }, 2000);
    return;
  }

  // Initialize page (only if not already loaded by HTML)
  loadExperienceDetails(experienceId);
  setupEventListeners();
}

let currentExperience = null;

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
      window.location.href = 'admin-dashboard.html';
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
      updateExperienceStatus('مكتمل');
    });
  }
  
  if (rejectBtn) {
    // Remove any existing onclick from HTML
    rejectBtn.onclick = null;
    rejectBtn.addEventListener('click', () => {
      console.log('👎 Reject button clicked');
      updateExperienceStatus('مرفوض');
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

async function loadExperienceDetails(experienceId) {
  try {
    window.DetailUtils.showLoading();

    const experience = await window.DetailUtils.loadRequestDetails(
      'experience',
      experienceId,
      async (apiClient) => {
        if (apiClient && typeof apiClient.getExperienceById === 'function') {
          return await apiClient.getExperienceById(experienceId);
        }
        throw new Error('getExperienceById not available');
      }
    );

    currentExperience = experience;
    window.currentExperience = experience; // Make it globally accessible
    
    console.log('✅ currentExperience set:', window.currentExperience);
    
    displayExperienceDetails(experience);
    loadExperienceHistory(experienceId);
    
  } catch (error) {
    console.error('Experience details loading error:', error);
    window.DetailUtils.showError('حدث خطأ في تحميل تفاصيل طلب شهادة الخبرة');
  } finally {
    window.DetailUtils.hideLoading();
  }
}

function displayExperienceDetails(experience) {
  console.log('🎨 displayExperienceDetails called with data:', experience);
  
  // Update page title
  const pageTitle = document.getElementById('pageTitle');
  console.log('📝 pageTitle element:', pageTitle);
  if (pageTitle) {
    pageTitle.textContent = `تفاصيل طلب شهادة خبرة #${experience.id || experience.reference_number}`;
  }

  // Basic information - using IDs from the HTML
  const elements = {
    rid: document.getElementById('rid'),
    rstatus: document.getElementById('rstatus'),
    rname: document.getElementById('rname'),
    rdept: document.getElementById('rdept'),
    remail: document.getElementById('remail'),
    rstartdate: document.getElementById('rstartdate'),
    renddate: document.getElementById('renddate'),
    rposition: document.getElementById('rposition'),
    rservice: document.getElementById('rservice'),
    rnationality: document.getElementById('rnationality'),
    rreason: document.getElementById('rreason'),
    rcreated: document.getElementById('rcreated'),
    rnotes: document.getElementById('rnotes')
  };
  
  console.log('📝 Found elements:', Object.keys(elements).filter(k => elements[k]).length, 'of', Object.keys(elements).length);

  // Populate the basic info fields
  if (elements.rid) {
    elements.rid.textContent = experience.id || experience.reference_number;
    console.log('✅ Set reference number:', elements.rid.textContent);
  }
  
  if (elements.rstatus) {
    const statusBadgeHTML = getExperienceStatusBadge(experience.status);
    elements.rstatus.outerHTML = statusBadgeHTML;
    console.log('✅ Set status:', experience.status);
  }
  
  if (elements.rname) {
    elements.rname.textContent = experience.employee_name || 'غير محدد';
    console.log('✅ Set employee name:', elements.rname.textContent);
  }
  
  if (elements.rdept) {
    elements.rdept.textContent = experience.department || 'غير محدد';
    console.log('✅ Set department:', elements.rdept.textContent);
  }
  
  if (elements.remail) {
    elements.remail.textContent = experience.employee_email || 'غير محدد';
    console.log('✅ Set email:', elements.remail.textContent);
  }
  
  if (elements.rstartdate) {
    elements.rstartdate.textContent = window.DetailUtils.formatDate(experience.start_date);
    console.log('✅ Set start date:', elements.rstartdate.textContent);
  }
  
  if (elements.renddate) {
    elements.renddate.textContent = window.DetailUtils.formatDate(experience.end_date);
    console.log('✅ Set end date:', elements.renddate.textContent);
  }
  
  if (elements.rposition) {
    elements.rposition.textContent = experience.position || 'غير محدد';
    console.log('✅ Set position:', elements.rposition.textContent);
  }
  
  if (elements.rservice) {
    elements.rservice.textContent = experience.service_type || 'غير محدد';
    console.log('✅ Set service type:', elements.rservice.textContent);
  }
  
  if (elements.rnationality) {
    elements.rnationality.textContent = experience.nationality || 'غير محدد';
    console.log('✅ Set nationality:', elements.rnationality.textContent);
  }
  
  if (elements.rreason) {
    elements.rreason.textContent = experience.reason_for_leaving || 'غير محدد';
    console.log('✅ Set reason for leaving:', elements.rreason.textContent);
  }
  
  if (elements.rcreated) {
    elements.rcreated.textContent = window.DetailUtils.formatDate(experience.created_at);
    console.log('✅ Set created date:', elements.rcreated.textContent);
  }
  
  if (elements.rnotes) {
    elements.rnotes.textContent = experience.request_notes || experience.admin_notes || experience.notes || 'لا توجد ملاحظات';
  }

  
  console.log('✅ All basic fields populated successfully!');

  // Update action buttons based on status
  updateActionButtons(experience);

  // Display comprehensive form data in new sections
  if (typeof window.displayEmployeeFormData === 'function') {
    console.log('📊 Calling displayEmployeeFormData...');
    window.displayEmployeeFormData(experience);
  }

  // Display additional information
  console.log('📊 Calling displayAdditionalInfo...');
  displayAdditionalInfo(experience);
  
  // Display timeline
  console.log('📊 Calling displayTimeline...');
  displayTimeline(experience);
  
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

function getExperienceStatusBadge(status) {
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

function updateActionButtons(experience) {
  const approveBtn = document.getElementById('approveBtn');
  const rejectBtn = document.getElementById('rejectBtn');
  const holdBtn = document.getElementById('holdBtn');
  const completeBtn = document.getElementById('completeBtn');
  const createAccountBtn = document.getElementById('createAccountBtn');
  const scheduleBtn = document.getElementById('scheduleBtn');
  
  const canApprove = ['pending', 'قيد الانتظار', 'قيد المراجعة'].includes(experience.status);
  const canReject = ['pending', 'قيد الانتظار', 'قيد المراجعة'].includes(experience.status);
  
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

function displayAdditionalInfo(experience) {
  const additionalInfoContainer = document.getElementById('additionalInfo');
  if (!additionalInfoContainer) return;

  const additionalInfo = `
    <div class="info-section">
      <h4>معلومات إضافية</h4>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">تاريخ الإنشاء:</span>
          <span class="value">${window.DetailUtils.formatDateTime(experience.created_at)}</span>
        </div>
        <div class="info-item">
          <span class="label">آخر تحديث:</span>
          <span class="value">${window.DetailUtils.formatDateTime(experience.updated_at)}</span>
        </div>
        <div class="info-item">
          <span class="label">عمر الطلب:</span>
          <span class="value">${getRequestAge(experience.created_at)}</span>
        </div>
        <div class="info-item">
          <span class="label">مدة الخدمة:</span>
          <span class="value">${getServiceDuration(experience.start_date, experience.end_date)}</span>
        </div>
        <div class="info-item">
          <span class="label">نوع الخدمة:</span>
          <span class="value">${experience.service_type || 'غير محدد'}</span>
        </div>
        ${experience.rejection_reason ? `
          <div class="info-item full-width">
            <span class="label">سبب الرفض:</span>
            <span class="value rejection-reason">${experience.rejection_reason}</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  additionalInfoContainer.innerHTML = additionalInfo;
}

function displayTimeline(experience) {
  const timelineContainer = document.getElementById('timelineContainer');
  if (!timelineContainer) return;

  // Mock timeline data - in real app, this would come from API
  const timelineEvents = [
    {
      date: experience.created_at,
      event: 'تم إنشاء طلب شهادة الخبرة',
      user: experience.employee_name || 'الموظف',
      type: 'created',
      details: `المسمى الوظيفي: ${experience.position}`
    }
  ];

  // Add status updates
  if (experience.status !== 'pending' && experience.status !== 'قيد الانتظار') {
    timelineEvents.push({
      date: experience.updated_at,
      event: `تم تحديث الحالة إلى: ${experience.status}`,
      user: 'المدير',
      type: 'status_update'
    });
  }

  // Add service period
  if (experience.start_date && experience.end_date) {
    timelineEvents.push({
      date: experience.end_date,
      event: 'فترة الخدمة',
      user: 'النظام',
      type: 'scheduled',
      details: `من ${window.DetailUtils.formatDate(experience.start_date)} إلى ${window.DetailUtils.formatDate(experience.end_date)}`
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

async function loadExperienceHistory(experienceId) {
  try {
    // This would typically call an API endpoint for history
    console.log('Loading history for experience:', experienceId);
  } catch (error) {
    console.error('History loading error:', error);
  }
}

function getServiceDuration(startDate, endDate) {
  if (!startDate || !endDate) return 'غير محدد';
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'غير صحيح';
    if (diffDays < 30) return `${diffDays} يوم`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      const days = diffDays % 30;
      return `${months} شهر${days > 0 ? ` و ${days} يوم` : ''}`;
    }
    const years = Math.floor(diffDays / 365);
    const remainingDays = diffDays % 365;
    const months = Math.floor(remainingDays / 30);
    return `${years} سنة${months > 0 ? ` و ${months} شهر` : ''}`;
  } catch (e) {
    return 'غير محدد';
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


async function updateExperienceStatus(newStatus) {
  if (!currentExperience) {
    console.error('❌ No current experience loaded');
    return;
  }

  console.log('🔄 updateExperienceStatus called with status:', newStatus);

  let confirmMessage = `هل أنت متأكد من تحديث حالة طلب شهادة الخبرة إلى "${newStatus}"؟`;
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
      const response = await apiClient.makeRequest(`/requests/experience/${currentExperience.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ note: reason || 'موافقة' })
      });
      console.log('✅ Approve response:', response);
    } else if (newStatus === 'مرفوض') {
      // Reject request
      console.log('👎 Calling reject API...');
      const response = await apiClient.makeRequest(`/requests/experience/${currentExperience.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ note: reason || 'رفض' })
      });
      console.log('✅ Reject response:', response);
    } else {
      // Other status changes (hold, etc.)
      if (typeof apiClient.updateOnboardingStatus === 'function') {
        await apiClient.makeRequest(`/experience-certificate/${currentExperience.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus, rejection_reason: reason })
        });
      } else {
        throw new Error('Cannot update to status: ' + newStatus);
      }
    }
    
    window.DetailUtils.showSuccess(`تم تحديث حالة الطلب إلى "${newStatus}" بنجاح`);
    
    // Set flag to refresh dashboard when user returns
    sessionStorage.setItem('returnedFromDetail', 'true');
    
    // Option 1: Reload page to show updated status
    setTimeout(() => {
      console.log('🔄 Reloading experience details...');
      window.location.reload();
    }, 1500);
    
    // Option 2: Or redirect back to inbox
    // setTimeout(() => {
    //   window.location.href = 'admin-dashboard.html';
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

function printExperience() {
  window.print();
}

function exportExperience() {
  if (!currentExperience) {
    showError('لا توجد بيانات للتصدير');
    return;
  }

  const exportData = {
    id: currentExperience.id || currentExperience.reference_number,
    employee_name: currentExperience.employee_name,
    position: currentExperience.position,
    department: currentExperience.department,
    nationality: currentExperience.nationality,
    service_type: currentExperience.service_type,
    start_date: window.DetailUtils.formatDate(currentExperience.start_date),
    end_date: window.DetailUtils.formatDate(currentExperience.end_date),
    reason_for_leaving: currentExperience.reason_for_leaving || '-',
    created_at: window.DetailUtils.formatDate(currentExperience.created_at),
    status: (window.getStatusDisplay ? window.getStatusDisplay(currentExperience.status) : currentExperience.status)
  };

  const csvContent = Object.keys(exportData).map(key => 
    `"${key}","${exportData[key]}"`
  ).join('\n');

  downloadFile(
    'الحقل,القيمة\n' + csvContent, 
    `experience_${currentExperience.id || currentExperience.reference_number}.csv`, 
    'text/csv'
  );
  
  showSuccess('تم تصدير بيانات طلب شهادة الخبرة بنجاح');
}

// Separate function for print/export listeners (used when data is pre-loaded)
function setupPrintExportListeners() {
  // Print button
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', printExperience);
  }

  // Export button
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportExperience);
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
function exportExperienceExcel() {
  if (!currentExperience) {
    showError('لا توجد بيانات للتصدير');
    return;
  }

  const exportData = {
    id: currentExperience.id || currentExperience.reference_number,
    employee_name: currentExperience.employee_name,
    position: currentExperience.position,
    department: currentExperience.department,
    nationality: currentExperience.nationality,
    service_type: currentExperience.service_type,
    start_date: window.DetailUtils.formatDate(currentExperience.start_date),
    end_date: window.DetailUtils.formatDate(currentExperience.end_date),
    reason_for_leaving: currentExperience.reason_for_leaving || '-',
    created_at: window.DetailUtils.formatDate(currentExperience.created_at),
    status: (window.getStatusDisplay ? window.getStatusDisplay(currentExperience.status) : currentExperience.status)
  };

  const csvContent = Object.keys(exportData).map(key => 
    `"${key}","${exportData[key]}"`
  ).join('\n');

  downloadFile(
    'الحقل,القيمة\n' + csvContent, 
    `experience_${currentExperience.id || currentExperience.reference_number}.csv`, 
    'text/csv'
  );
  
  showSuccess('تم تصدير البيانات بنجاح');
}

function exportExperiencePDF() {
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
