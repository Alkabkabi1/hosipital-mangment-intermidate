// Admin Clearance Detail JavaScript
// Handles detailed view and management of clearance requests

document.addEventListener('DOMContentLoaded', function() {
  // Check if data is already loaded by HTML page (skip API loading)
  if (window.currentClearance) {
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
  if (!canAccessClearanceDetail()) {
    window.DetailUtils.showError('ليس لديك صلاحية للوصول إلى هذه الصفحة. مطلوب: دور ADMIN أو MANAGER أو تفويض نشط.');
    setTimeout(() => {
      window.location.href = window.resolveFrontendPath ? 
        window.resolveFrontendPath('employee-dashboard.html') : 
        'employee-dashboard.html';
    }, 3000);
    return;
  }

/**
 * Check if user can access clearance detail page
 * ONLY: ADMIN, MANAGER, or Active Commissioner
 */
function canAccessClearanceDetail() {
  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  if (!authUser) return false;
  
  // Check 1: ADMIN role
  if (window.rolePermissions && window.rolePermissions.hasRole('ADMIN')) {
    console.log('✅ Clearance access granted: User is ADMIN');
    return true;
  }
  
  // Check 2: MANAGER role
  if (window.rolePermissions && window.rolePermissions.hasRole('MANAGER')) {
    console.log('✅ Clearance access granted: User is MANAGER');
    return true;
  }
  
  // Check 3: Admin role (legacy)
  if (authUser.role === 'admin') {
    console.log('✅ Clearance access granted: User is admin (legacy)');
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
             (d.scopes || []).some(s => s.includes('clearance') || s.includes('approve'));
    });
    
    if (hasActiveTicket) {
      console.log('✅ Clearance access granted: User is active commissioner');
      return true;
    }
  }
  
  console.log('❌ Clearance access denied: User must be ADMIN, MANAGER, or Commissioner');
  console.log('   Current roles:', authUser.roles || [authUser.role]);
  return false;
}

  // Get clearance ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const clearanceId = urlParams.get('id');
  
  if (!clearanceId) {
    showError('معرف الطلب غير صحيح');
    setTimeout(() => {
      window.location.href = 'admin-clearance-inbox.html';
    }, 2000);
    return;
  }

  // Initialize page (only if not already loaded by HTML)
  loadClearanceDetails(clearanceId);
  setupEventListeners();
}

let currentClearance = null;

function setupEventListeners() {
  // Back button
  const backBtn = document.getElementById('backBtn') || document.getElementById('btnBack');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'admin-clearance-inbox.html';
    });
  }

  // Setup print/export listeners
  setupPrintExportListeners();

  // Status update buttons - using correct IDs from HTML
  const approveBtn = document.getElementById('btnApproveReq'); // Updated ID
  const rejectBtn = document.getElementById('btnRejectReq'); // Updated ID
  const holdBtn = document.getElementById('holdBtn');
  
  console.log('🔘 Setting up button listeners...', { approveBtn: !!approveBtn, rejectBtn: !!rejectBtn });
  
  if (approveBtn) {
    // Remove any existing onclick from HTML
    approveBtn.onclick = null;
    approveBtn.addEventListener('click', () => {
      console.log('👍 Approve button clicked');
      updateClearanceStatus('مكتمل');
    });
  }
  
  if (rejectBtn) {
    // Remove any existing onclick from HTML
    rejectBtn.onclick = null;
    rejectBtn.addEventListener('click', () => {
      console.log('👎 Reject button clicked');
      updateClearanceStatus('مرفوض');
    });
  }
  
  if (holdBtn) {
    holdBtn.addEventListener('click', () => updateClearanceStatus('معلق'));
  }

  // Add comment button
  const addCommentBtn = document.getElementById('addCommentBtn');
  if (addCommentBtn) {
    addCommentBtn.addEventListener('click', showAddCommentModal);
  }

  // Add signature button
  const addSignatureBtn = document.getElementById('addSignatureBtn');
  if (addSignatureBtn) {
    addSignatureBtn.addEventListener('click', showAddSignatureModal);
  }
  
  console.log('✅ All button listeners set up');
}

async function loadClearanceDetails(clearanceId) {
  try {
    window.DetailUtils.showLoading();
    
    const clearance = await window.DetailUtils.loadRequestDetails(
      'clearance',
      clearanceId,
      async (apiClient) => {
        if (apiClient && typeof apiClient.getClearanceById === 'function') {
          return await apiClient.getClearanceById(clearanceId);
        }
        throw new Error('getClearanceById not available');
      }
    );
    
    currentClearance = clearance;
    window.currentClearance = clearance; // Make it globally accessible
    
    console.log('✅ currentClearance set:', window.currentClearance);
    
    displayClearanceDetails(clearance);
    loadClearanceHistory(clearanceId);
    loadClearanceSignatures(clearanceId);
    
  } catch (error) {
    console.error('Clearance details loading error:', error);

    // Handle specific error cases
    if (error.message && error.message.includes('Clearance not found')) {
      window.DetailUtils.showError('طلب الإخلاء غير موجود أو تم حذفه');
      // Redirect back to dashboard after a delay
      setTimeout(() => {
        window.location.href = window.resolveFrontendPath ? window.resolveFrontendPath('admin-dashboard.html') : 'admin-dashboard.html';
      }, 3000);
    } else {
      window.DetailUtils.showError('حدث خطأ في تحميل تفاصيل الطلب');
    }
  } finally {
    window.DetailUtils.hideLoading();
  }
}

function displayClearanceDetails(clearance) {
  console.log('🎨 displayClearanceDetails called with data:', clearance);
  
  // Update page title
  const pageTitle = document.getElementById('pageTitle');
  console.log('📝 pageTitle element:', pageTitle);
  if (pageTitle) {
    pageTitle.textContent = `تفاصيل طلب إخلاء طرف #${clearance.reference_number}`;
  }

  // Basic information - using IDs from the HTML
  const elements = {
    rid: document.getElementById('rid'),
    rstatus: document.getElementById('rstatus'),
    rname: document.getElementById('rname'),
    rdept: document.getElementById('rdept'),
    remail: document.getElementById('remail'),
    rlast: document.getElementById('rlast'),
    rtype: document.getElementById('rtype'),
    rreason: document.getElementById('rreason'),
    rdocnum: document.getElementById('rdocnum'),
    rcreated: document.getElementById('rcreated'),
    rnotes: document.getElementById('rnotes')
  };
  
  console.log('📝 Found elements:', Object.keys(elements).filter(k => elements[k]).length, 'of', Object.keys(elements).length);

  // Populate the basic info fields
  if (elements.rid) {
    elements.rid.textContent = clearance.reference_number || clearance.id;
    console.log('✅ Set reference number:', elements.rid.textContent);
  }
  
  if (elements.rstatus) {
    const statusBadgeHTML = getClearanceStatusBadge(clearance.status);
    elements.rstatus.outerHTML = statusBadgeHTML;
    console.log('✅ Set status:', clearance.status);
  }
  
  if (elements.rname) {
    elements.rname.textContent = clearance.employee_name || clearance.firstName + ' ' + clearance.secondName || 'غير محدد';
    console.log('✅ Set employee name:', elements.rname.textContent);
  }
  
  if (elements.rdept) {
    elements.rdept.textContent = clearance.employee_dept || clearance.department_name || 'غير محدد';
    console.log('✅ Set department:', elements.rdept.textContent);
  }
  
  if (elements.remail) {
    elements.remail.textContent = clearance.employee_email || 'غير محدد';
    console.log('✅ Set email:', elements.remail.textContent);
  }
  
  if (elements.rlast) {
    elements.rlast.textContent = window.DetailUtils.formatDate(clearance.last_work_day);
    console.log('✅ Set last work day:', elements.rlast.textContent);
  }
  
  if (elements.rtype) {
    const typeText = clearance.clearance_type === 'end_of_service' ? 'إخلاء طرف نهاية خدمة' :
                    clearance.clearance_type === 'end_mid_service' ? 'إخلاء طرف خدمة متوسطة' :
                    clearance.clearance_type || 'غير محدد';
    elements.rtype.textContent = typeText;
    console.log('✅ Set clearance type:', elements.rtype.textContent);
  }
  
  if (elements.rreason) {
    elements.rreason.textContent = clearance.reason || 'غير محدد';
    console.log('✅ Set reason:', elements.rreason.textContent);
  }
  
  if (elements.rdocnum) {
    elements.rdocnum.textContent = clearance.document_number || clearance.documentNumber || 'غير محدد';
  }
  
  if (elements.rcreated) {
    elements.rcreated.textContent = window.DetailUtils.formatDate(clearance.created_at);
    console.log('✅ Set created date:', elements.rcreated.textContent);
  }
  
  if (elements.rnotes) {
    elements.rnotes.textContent = clearance.decision_note || clearance.notes || 'لا توجد ملاحظات';
  }

  console.log('✅ All basic fields populated successfully!');

  // Update action buttons based on status
  updateActionButtons(clearance.status);

  // Display comprehensive form data in new sections (if functions exist)
  if (typeof window.displayEmployeeFormData === 'function') {
    console.log('📊 Calling displayEmployeeFormData...');
    window.displayEmployeeFormData(clearance);
  }
  if (typeof window.displayClearanceSpecificInfo === 'function') {
    console.log('📊 Calling displayClearanceSpecificInfo...');
    window.displayClearanceSpecificInfo(clearance);
  }

  // Display additional information
  console.log('📊 Calling displayAdditionalInfo...');
  displayAdditionalInfo(clearance);
  
  // Display timeline
  console.log('📊 Calling displayTimeline...');
  displayTimeline(clearance);
  
  console.log('🎉 Clearance page fully rendered with all data!');
}

function getClearanceStatusBadge(status) {
  const statusBadges = {
    'قيد الانتظار': '<span class="status-badge status-pending">قيد الانتظار</span>',
    'قيد المراجعة': '<span class="status-badge status-review">قيد المراجعة</span>',
    'موافق عليه': '<span class="status-badge status-approved">موافق عليه</span>',
    'مرفوض': '<span class="status-badge status-rejected">مرفوض</span>',
    'مكتمل': '<span class="status-badge status-completed">مكتمل</span>',
    'معلق': '<span class="status-badge status-hold">معلق</span>'
  };
  
  return statusBadges[status] || `<span class="status-badge">${status}</span>`;
}

function updateActionButtons(status) {
  const approveBtn = document.getElementById('approveBtn');
  const rejectBtn = document.getElementById('rejectBtn');
  const holdBtn = document.getElementById('holdBtn');
  
  const canUpdate = ['قيد الانتظار', 'قيد المراجعة', 'معلق'].includes(status);
  
  if (approveBtn) approveBtn.disabled = !canUpdate;
  if (rejectBtn) rejectBtn.disabled = !canUpdate;
  if (holdBtn) holdBtn.disabled = !canUpdate || status === 'معلق';
}

function displayAdditionalInfo(clearance) {
  const additionalInfoContainer = document.getElementById('additionalInfo');
  if (!additionalInfoContainer) return;

  const additionalInfo = `
    <div class="info-section">
      <h4>معلومات إضافية</h4>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">تاريخ الإنشاء:</span>
          <span class="value">${window.DetailUtils.formatDateTime(clearance.created_at)}</span>
        </div>
        <div class="info-item">
          <span class="label">آخر تحديث:</span>
          <span class="value">${window.DetailUtils.formatDateTime(clearance.updated_at)}</span>
        </div>
        <div class="info-item">
          <span class="label">عمر الطلب:</span>
          <span class="value">${getRequestAge(clearance.request_date)}</span>
        </div>
        <div class="info-item">
          <span class="label">أيام متبقية:</span>
          <span class="value">${getDaysUntilEffective(clearance.effective_date)}</span>
        </div>
        ${clearance.rejection_reason ? `
          <div class="info-item full-width">
            <span class="label">سبب الرفض:</span>
            <span class="value rejection-reason">${clearance.rejection_reason}</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  additionalInfoContainer.innerHTML = additionalInfo;
}

function displayTimeline(clearance) {
  const timelineContainer = document.getElementById('timelineContainer');
  if (!timelineContainer) return;

  // Mock timeline data - in real app, this would come from API
  const timelineEvents = [
    {
      date: clearance.created_at,
      event: 'تم إنشاء الطلب',
      user: clearance.employee_name,
      type: 'created'
    },
    {
      date: clearance.updated_at,
      event: `تم تحديث الحالة إلى: ${clearance.status}`,
      user: 'النظام',
      type: 'status_update'
    }
  ];

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
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  timelineContainer.innerHTML = timelineHTML;
}

async function loadClearanceHistory(clearanceId) {
  try {
    // This would typically call an API endpoint for history
    // For now, we'll skip or use mock data
    console.log('Loading history for clearance:', clearanceId);
  } catch (error) {
    console.error('History loading error:', error);
  }
}

async function loadClearanceSignatures(clearanceId) {
  try {
    const signaturesContainer = document.getElementById('signaturesContainer');
    if (!signaturesContainer) return;

    // Mock signatures data - replace with actual API call
    const signatures = await getMockSignatures();
    
    if (signatures.length === 0) {
      signaturesContainer.innerHTML = `
        <div class="signatures-section">
          <h4>التوقيعات والموافقات</h4>
          <div class="no-signatures">
            <p>لا توجد توقيعات بعد</p>
            <button class="btn btn-secondary" onclick="showAddSignatureModal()">
              إضافة توقيع
            </button>
          </div>
        </div>
      `;
      return;
    }

    const signaturesHTML = `
      <div class="signatures-section">
        <h4>التوقيعات والموافقات</h4>
        <div class="signatures-list">
          ${signatures.map(signature => `
            <div class="signature-item">
              <div class="signature-info">
                <div class="signature-department">${signature.department}</div>
                <div class="signature-user">${signature.user_name}</div>
                <div class="signature-date">${window.DetailUtils.formatDateTime(signature.created_at)}</div>
              </div>
              <div class="signature-status">
                ${getSignatureStatusBadge(signature.status)}
              </div>
              ${signature.comments ? `
                <div class="signature-comments">
                  <strong>تعليقات:</strong> ${signature.comments}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        <button class="btn btn-secondary" onclick="showAddSignatureModal()">
          إضافة توقيع
        </button>
      </div>
    `;

    signaturesContainer.innerHTML = signaturesHTML;
    
  } catch (error) {
    console.error('Signatures loading error:', error);
  }
}

function getMockSignatures() {
  return Promise.resolve([
    {
      id: 1,
      department: 'الموارد البشرية',
      user_name: 'أحمد محمد',
      status: 'موافق',
      comments: 'تم مراجعة الطلب والموافقة عليه',
      created_at: '2024-01-15T10:30:00'
    },
    {
      id: 2,
      department: 'المالية',
      user_name: 'فاطمة علي',
      status: 'قيد المراجعة',
      comments: null,
      created_at: '2024-01-15T14:20:00'
    }
  ]);
}

function getSignatureStatusBadge(status) {
  const statusBadges = {
    'موافق': '<span class="signature-badge approved">موافق</span>',
    'مرفوض': '<span class="signature-badge rejected">مرفوض</span>',
    'قيد المراجعة': '<span class="signature-badge pending">قيد المراجعة</span>'
  };
  
  return statusBadges[status] || `<span class="signature-badge">${status}</span>`;
}

function getRequestAge(requestDate) {
  let days = 0;
  if (window.DateUtils && typeof window.DateUtils.getDaysDifference === 'function') {
    days = window.DateUtils.getDaysDifference(requestDate, window.DateUtils.getToday());
  } else {
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

function getDaysUntilEffective(effectiveDate) {
  if (!effectiveDate) return 'غير محدد';
  
  let days = 0;
  if (window.DateUtils && typeof window.DateUtils.getDaysDifference === 'function') {
    days = window.DateUtils.getDaysDifference(window.DateUtils.getToday(), effectiveDate);
  } else {
    try {
      const today = new Date();
      const effDate = new Date(effectiveDate);
      const diffTime = effDate - today;
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      return 'غير محدد';
    }
  }
  
  if (days < 0) return 'منتهي';
  if (days === 0) return 'اليوم';
  if (days === 1) return 'غداً';
  return `${days} أيام`;
}

async function updateClearanceStatus(newStatus) {
  if (!currentClearance) {
    console.error('❌ No current clearance loaded');
    return;
  }

  console.log('🔄 updateClearanceStatus called with status:', newStatus);

  let confirmMessage = `هل أنت متأكد من تحديث حالة الطلب إلى "${newStatus}"؟`;
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
      const response = await apiClient.makeRequest(`/requests/clearance/${currentClearance.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ note: reason || 'موافقة' })
      });
      console.log('✅ Approve response:', response);
    } else if (newStatus === 'مرفوض') {
      // Reject request
      console.log('👎 Calling reject API...');
      const response = await apiClient.makeRequest(`/requests/clearance/${currentClearance.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ note: reason || 'رفض' })
      });
      console.log('✅ Reject response:', response);
    } else {
      // Other status changes (hold, etc.) - use old endpoint if available
      if (typeof apiClient.updateClearanceStatus === 'function') {
        await apiClient.updateClearanceStatus(currentClearance.id, { status: newStatus, rejection_reason: reason });
      } else {
        throw new Error('Cannot update to status: ' + newStatus);
      }
    }
    
    window.DetailUtils.showSuccess(`تم تحديث حالة الطلب إلى "${newStatus}" بنجاح`);
    
    // Set flag to refresh dashboard when user returns
    sessionStorage.setItem('returnedFromDetail', 'true');
    
    // Option 1: Reload page to show updated status
    setTimeout(() => {
      console.log('🔄 Reloading clearance details...');
      window.location.reload();
    }, 1500);
    
    // Option 2: Or redirect back to inbox
    // setTimeout(() => {
    //   window.location.href = 'admin-clearance-inbox.html';
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
          <h3>سبب رفض الطلب</h3>
          <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove(); resolve(null);">×</button>
        </div>
        <div class="modal-body">
          <textarea id="rejectionReason" class="textarea" placeholder="يرجى توضيح سبب رفض الطلب..." rows="4" required></textarea>
          
          <div class="common-reasons">
            <h4>أسباب شائعة للرفض:</h4>
            <div class="reason-buttons">
              <button type="button" class="reason-btn" onclick="document.getElementById('rejectionReason').value = this.textContent">
                نقص في الوثائق المطلوبة
              </button>
              <button type="button" class="reason-btn" onclick="document.getElementById('rejectionReason').value = this.textContent">
                فترة الإشعار غير كافية
              </button>
              <button type="button" class="reason-btn" onclick="document.getElementById('rejectionReason').value = this.textContent">
                عدم استكمال المهام المطلوبة
              </button>
              <button type="button" class="reason-btn" onclick="document.getElementById('rejectionReason').value = this.textContent">
                يتطلب موافقة إدارة عليا
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
        window.DetailUtils.showError('يرجى إدخال سبب الرفض');
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
  window.DetailUtils.showInfo('إضافة التعليقات ستكون متاحة قريباً');
}

function showAddSignatureModal() {
  window.DetailUtils.showInfo('إضافة التوقيعات ستكون متاحة قريباً');
}

function printClearance() {
  window.print();
}

function exportClearance() {
  if (!currentClearance) return;

  const exportData = {
    reference_number: currentClearance.reference_number,
    employee_name: currentClearance.employee_name,
    department: currentClearance.department_name,
    position: currentClearance.position,
    request_date: window.DetailUtils.formatDate(currentClearance.request_date),
    effective_date: window.DetailUtils.formatDate(currentClearance.effective_date),
    status: (window.getStatusDisplay ? window.getStatusDisplay(currentClearance.status) : currentClearance.status),
    reason: currentClearance.reason || ''
  };

  const csvContent = Object.keys(exportData).map(key => 
    `"${key}","${exportData[key]}"`
  ).join('\n');

  Utils.downloadFile(
    'الحقل,القيمة\n' + csvContent, 
    `clearance_${currentClearance.reference_number}.csv`, 
    'text/csv'
  );
  
  showSuccess('تم تصدير بيانات الطلب بنجاح');
}

// Separate function for print/export listeners (used when data is pre-loaded)
function setupPrintExportListeners() {
  // Print button
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', printClearance);
  }

  // Export button
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportClearance);
  }
}

// Add clearance detail-specific CSS
const adminClearanceStyles = document.createElement('style');
adminClearanceStyles.textContent = `
  .clearance-detail-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .detail-header {
    background: white;
    border-radius: 12px;
    padding: 25px;
    margin-bottom: 30px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  .detail-title {
    color: #2B6CB0;
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
    min-width: 120px;
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
    background: #2B6CB0;
    border: 3px solid white;
    box-shadow: 0 0 0 2px #e5e7eb;
  }
  
  .timeline-content {
    background: #f9fafb;
    padding: 15px;
    border-radius: 8px;
    border-left: 3px solid #2B6CB0;
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
  }
  
  .signatures-section {
    margin-bottom: 30px;
  }
  
  .signatures-list {
    margin-bottom: 20px;
  }
  
  .signature-item {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
  }
  
  .signature-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .signature-department {
    font-weight: 600;
    color: #374151;
  }
  
  .signature-user {
    color: #6b7280;
    font-size: 14px;
  }
  
  .signature-date {
    color: #6b7280;
    font-size: 14px;
  }
  
  .signature-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .signature-badge.approved { background: #d1fae5; color: #065f46; }
  .signature-badge.rejected { background: #fee2e2; color: #991b1b; }
  .signature-badge.pending { background: #fef3c7; color: #92400e; }
  
  .signature-comments {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #e5e7eb;
    font-size: 14px;
    color: #6b7280;
  }
  
  .no-signatures {
    text-align: center;
    padding: 40px;
    color: #6b7280;
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
  }
  
  @media print {
    .detail-actions,
    .btn {
      display: none !important;
    }
    
    .clearance-detail-container {
      max-width: none;
      margin: 0;
      padding: 0;
    }
    
    .detail-content {
      grid-template-columns: 1fr;
    }
  }
`;
document.head.appendChild(adminClearanceStyles);
