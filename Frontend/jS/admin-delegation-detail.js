// Admin Delegation Detail JavaScript
// Handles detailed view and management of delegation requests

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication and admin role
  if (!requireAuth()) return;
  if (!requireAdmin()) return;

  // Get delegation ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const delegationId = urlParams.get('id');
  
  if (!delegationId) {
    showError('معرف التفويض غير صحيح');
    setTimeout(() => {
      window.location.href = 'admin-delegations-inbox.html';
    }, 2000);
    return;
  }

  // Initialize page
  loadDelegationDetails(delegationId);
  setupEventListeners();
});

let currentDelegation = null;

function setupEventListeners() {
  // Back button
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'admin-delegations-inbox.html';
    });
  }

  // Print button
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', printDelegation);
  }

  // Export button
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportDelegation);
  }

  // Status update buttons
  const approveBtn = document.getElementById('approveBtn');
  const rejectBtn = document.getElementById('rejectBtn');
  const suspendBtn = document.getElementById('suspendBtn');
  const terminateBtn = document.getElementById('terminateBtn');
  
  if (approveBtn) approveBtn.addEventListener('click', () => updateDelegationStatus('موافق عليه'));
  if (rejectBtn) rejectBtn.addEventListener('click', () => updateDelegationStatus('مرفوض'));
  if (suspendBtn) suspendBtn.addEventListener('click', () => updateDelegationStatus('معلق'));
  if (terminateBtn) terminateBtn.addEventListener('click', () => updateDelegationStatus('مكتمل'));

  // Add comment button
  const addCommentBtn = document.getElementById('addCommentBtn');
  if (addCommentBtn) {
    addCommentBtn.addEventListener('click', showAddCommentModal);
  }

  // Extend delegation button
  const extendBtn = document.getElementById('extendBtn');
  if (extendBtn) {
    extendBtn.addEventListener('click', showExtendDelegationModal);
  }

  // Modify delegation button
  const modifyBtn = document.getElementById('modifyBtn');
  if (modifyBtn) {
    modifyBtn.addEventListener('click', showModifyDelegationModal);
  }
}

async function loadDelegationDetails(delegationId) {
  try {
    LoadingUtils.showPageLoading();
    
    const delegation = await apiClient.getDelegationById(delegationId);
    currentDelegation = delegation;
    
    // Add computed properties
    currentDelegation.isActive = isDelegationActive(delegation);
    currentDelegation.isExpired = isDelegationExpired(delegation);
    currentDelegation.daysRemaining = getDaysRemaining(delegation);
    currentDelegation.urgencyLevel = getDelegationUrgency(delegation);
    
    displayDelegationDetails(delegation);
    loadDelegationHistory(delegationId);
    loadDelegationActivities(delegationId);
    
  } catch (error) {
    console.error('Delegation details loading error:', error);
    showError('حدث خطأ في تحميل تفاصيل التفويض');
  } finally {
    LoadingUtils.hidePageLoading();
  }
}

function displayDelegationDetails(delegation) {
  // Update page title
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) {
    pageTitle.textContent = `تفاصيل التفويض #${delegation.reference_number}`;
  }

  // Basic information
  const elements = {
    referenceNumber: document.getElementById('referenceNumber'),
    delegationType: document.getElementById('delegationType'),
    employeeName: document.getElementById('employeeName'),
    employeeId: document.getElementById('employeeId'),
    department: document.getElementById('department'),
    position: document.getElementById('position'),
    delegatedToName: document.getElementById('delegatedToName'),
    delegatedToId: document.getElementById('delegatedToId'),
    requestDate: document.getElementById('requestDate'),
    startDate: document.getElementById('startDate'),
    endDate: document.getElementById('endDate'),
    currentStatus: document.getElementById('currentStatus'),
    scopeDescription: document.getElementById('scopeDescription'),
    limitations: document.getElementById('limitations'),
    reason: document.getElementById('reason')
  };

  if (elements.referenceNumber) elements.referenceNumber.textContent = delegation.reference_number;
  if (elements.delegationType) elements.delegationType.textContent = getDelegationTypeDisplayName(delegation.delegation_type);
  if (elements.employeeName) elements.employeeName.textContent = delegation.employee_name || 'غير محدد';
  if (elements.employeeId) elements.employeeId.textContent = delegation.employee_id || 'غير محدد';
  if (elements.department) elements.department.textContent = delegation.department_name || 'غير محدد';
  if (elements.position) elements.position.textContent = delegation.position || 'غير محدد';
  if (elements.delegatedToName) elements.delegatedToName.textContent = delegation.delegated_to_name || 'غير محدد';
  if (elements.delegatedToId) elements.delegatedToId.textContent = delegation.delegated_to_employee_id || 'غير محدد';
  if (elements.requestDate) elements.requestDate.textContent = DateUtils.formatDate(delegation.request_date);
  if (elements.startDate) elements.startDate.textContent = delegation.start_date ? DateUtils.formatDate(delegation.start_date) : 'غير محدد';
  if (elements.endDate) elements.endDate.textContent = delegation.end_date ? DateUtils.formatDate(delegation.end_date) : 'غير محدد';
  if (elements.scopeDescription) elements.scopeDescription.textContent = delegation.scope_description || 'لم يتم تحديد النطاق';
  if (elements.limitations) elements.limitations.textContent = delegation.limitations || 'لا توجد قيود';
  if (elements.reason) elements.reason.textContent = delegation.reason || 'لم يتم تحديد السبب';

  // Status with styling
  if (elements.currentStatus) {
    elements.currentStatus.innerHTML = getDelegationStatusBadge(delegation.status);
  }

  // Update action buttons based on status and dates
  updateActionButtons(delegation);

  // Display additional information
  displayAdditionalInfo(delegation);
  
  // Display timeline
  displayTimeline(delegation);
}

function getDelegationTypeDisplayName(type) {
  const typeNames = {
    authority: 'تفويض سلطة',
    responsibility: 'تفويض مسؤولية',
    signature: 'تفويض توقيع',
    approval: 'تفويض موافقة',
    other: 'تفويض آخر'
  };
  
  return typeNames[type] || type;
}

function getDelegationStatusBadge(status) {
  const statusBadges = {
    'قيد الانتظار': '<span class="status-badge status-pending">قيد الانتظار</span>',
    'موافق عليه': '<span class="status-badge status-approved">موافق عليه</span>',
    'مرفوض': '<span class="status-badge status-rejected">مرفوض</span>',
    'نشط': '<span class="status-badge status-active">نشط</span>',
    'مكتمل': '<span class="status-badge status-completed">مكتمل</span>',
    'ملغي': '<span class="status-badge status-cancelled">ملغي</span>',
    'معلق': '<span class="status-badge status-suspended">معلق</span>'
  };
  
  let badge = statusBadges[status] || `<span class="status-badge">${status}</span>`;
  
  if (currentDelegation && currentDelegation.isExpired) {
    badge += '<span class="status-badge status-expired">منتهي</span>';
  }
  
  return badge;
}

function updateActionButtons(delegation) {
  const approveBtn = document.getElementById('approveBtn');
  const rejectBtn = document.getElementById('rejectBtn');
  const suspendBtn = document.getElementById('suspendBtn');
  const terminateBtn = document.getElementById('terminateBtn');
  const extendBtn = document.getElementById('extendBtn');
  const modifyBtn = document.getElementById('modifyBtn');
  
  const canApprove = delegation.status === 'قيد الانتظار';
  const canReject = delegation.status === 'قيد الانتظار';
  const canSuspend = delegation.isActive;
  const canTerminate = delegation.isActive || delegation.status === 'معلق';
  const canExtend = delegation.isActive || delegation.status === 'موافق عليه';
  const canModify = delegation.status === 'قيد الانتظار' || delegation.status === 'معلق';
  
  if (approveBtn) {
    approveBtn.disabled = !canApprove;
    approveBtn.style.display = canApprove ? 'inline-flex' : 'none';
  }
  
  if (rejectBtn) {
    rejectBtn.disabled = !canReject;
    rejectBtn.style.display = canReject ? 'inline-flex' : 'none';
  }
  
  if (suspendBtn) {
    suspendBtn.disabled = !canSuspend;
    suspendBtn.style.display = canSuspend ? 'inline-flex' : 'none';
  }
  
  if (terminateBtn) {
    terminateBtn.disabled = !canTerminate;
    terminateBtn.style.display = canTerminate ? 'inline-flex' : 'none';
  }
  
  if (extendBtn) {
    extendBtn.disabled = !canExtend;
    extendBtn.style.display = canExtend ? 'inline-flex' : 'none';
  }
  
  if (modifyBtn) {
    modifyBtn.disabled = !canModify;
    modifyBtn.style.display = canModify ? 'inline-flex' : 'none';
  }
}

function displayAdditionalInfo(delegation) {
  const additionalInfoContainer = document.getElementById('additionalInfo');
  if (!additionalInfoContainer) return;

  const additionalInfo = `
    <div class="info-section">
      <h4>معلومات إضافية</h4>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">تاريخ الإنشاء:</span>
          <span class="value">${DateUtils.formatDateTime(delegation.created_at)}</span>
        </div>
        <div class="info-item">
          <span class="label">آخر تحديث:</span>
          <span class="value">${DateUtils.formatDateTime(delegation.updated_at)}</span>
        </div>
        <div class="info-item">
          <span class="label">عمر التفويض:</span>
          <span class="value">${getRequestAge(delegation.request_date)}</span>
        </div>
        ${delegation.end_date ? `
          <div class="info-item">
            <span class="label">أيام متبقية:</span>
            <span class="value ${delegation.daysRemaining <= 7 ? 'urgent' : ''}">${getDaysRemainingText(delegation.daysRemaining)}</span>
          </div>
        ` : ''}
        <div class="info-item">
          <span class="label">مستوى الأولوية:</span>
          <span class="value">${getUrgencyText(delegation.urgencyLevel)}</span>
        </div>
        ${delegation.rejection_reason ? `
          <div class="info-item full-width">
            <span class="label">سبب الرفض:</span>
            <span class="value rejection-reason">${delegation.rejection_reason}</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  additionalInfoContainer.innerHTML = additionalInfo;
}

function displayTimeline(delegation) {
  const timelineContainer = document.getElementById('timelineContainer');
  if (!timelineContainer) return;

  // Mock timeline data - in real app, this would come from API
  const timelineEvents = [
    {
      date: delegation.created_at,
      event: 'تم إنشاء التفويض',
      user: delegation.employee_name,
      type: 'created',
      details: `نوع التفويض: ${getDelegationTypeDisplayName(delegation.delegation_type)}`
    }
  ];

  // Add status updates
  if (delegation.status !== 'قيد الانتظار') {
    timelineEvents.push({
      date: delegation.updated_at,
      event: `تم تحديث الحالة إلى: ${delegation.status}`,
      user: 'المدير',
      type: 'status_update'
    });
  }

  // Add start date if active
  if (delegation.start_date && delegation.isActive) {
    timelineEvents.push({
      date: delegation.start_date + 'T00:00:00',
      event: 'بدء التفويض',
      user: 'النظام',
      type: 'started'
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
                <span class="timeline-date">${DateUtils.formatDateTime(event.date)}</span>
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

async function loadDelegationHistory(delegationId) {
  try {
    // This would typically call an API endpoint for history
    console.log('Loading history for delegation:', delegationId);
  } catch (error) {
    console.error('History loading error:', error);
  }
}

async function loadDelegationActivities(delegationId) {
  try {
    const activitiesContainer = document.getElementById('activitiesContainer');
    if (!activitiesContainer) return;

    // Mock activities data - replace with actual API call
    const activities = await getMockActivities();
    
    if (activities.length === 0) {
      activitiesContainer.innerHTML = `
        <div class="activities-section">
          <h4>الأنشطة والاستخدامات</h4>
          <div class="no-activities">
            <p>لا توجد أنشطة مسجلة لهذا التفويض</p>
          </div>
        </div>
      `;
      return;
    }

    const activitiesHTML = `
      <div class="activities-section">
        <h4>الأنشطة والاستخدامات</h4>
        <div class="activities-list">
          ${activities.map(activity => `
            <div class="activity-item">
              <div class="activity-info">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-description">${activity.description}</div>
                <div class="activity-meta">
                  <span class="activity-date">${DateUtils.formatDateTime(activity.date)}</span>
                  <span class="activity-user">بواسطة: ${activity.user}</span>
                </div>
              </div>
              <div class="activity-status">
                ${getActivityStatusBadge(activity.status)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    activitiesContainer.innerHTML = activitiesHTML;
    
  } catch (error) {
    console.error('Activities loading error:', error);
  }
}

function getMockActivities() {
  return Promise.resolve([
    {
      id: 1,
      title: 'موافقة على طلب إجازة',
      description: 'تم استخدام التفويض للموافقة على طلب إجازة للموظف أحمد محمد',
      date: '2024-01-16T09:30:00',
      user: 'فاطمة علي',
      status: 'مكتمل'
    },
    {
      id: 2,
      title: 'توقيع عقد مورد',
      description: 'تم توقيع عقد مع مورد المكتبية باستخدام التفويض',
      date: '2024-01-17T14:20:00',
      user: 'فاطمة علي',
      status: 'مكتمل'
    }
  ]);
}

function getActivityStatusBadge(status) {
  const statusBadges = {
    'مكتمل': '<span class="activity-badge completed">مكتمل</span>',
    'قيد التنفيذ': '<span class="activity-badge in-progress">قيد التنفيذ</span>',
    'معلق': '<span class="activity-badge pending">معلق</span>'
  };
  
  return statusBadges[status] || `<span class="activity-badge">${status}</span>`;
}

function isDelegationActive(delegation) {
  if (delegation.status !== 'موافق عليه' && delegation.status !== 'نشط') {
    return false;
  }
  
  if (!delegation.start_date || !delegation.end_date) {
    return delegation.status === 'نشط';
  }
  
  const today = new Date();
  const startDate = new Date(delegation.start_date);
  const endDate = new Date(delegation.end_date);
  
  return today >= startDate && today <= endDate;
}

function isDelegationExpired(delegation) {
  if (!delegation.end_date) return false;
  
  const today = new Date();
  const endDate = new Date(delegation.end_date);
  
  return today > endDate;
}

function getDelegationUrgency(delegation) {
  const daysSinceRequest = DateUtils.getDaysDifference(delegation.request_date, DateUtils.getToday());
  
  if (daysSinceRequest > 30) return 3; // High
  if (daysSinceRequest > 14) return 2; // Medium
  return 1; // Low
}

function getDaysRemaining(delegation) {
  if (!delegation.end_date || !isDelegationActive(delegation)) {
    return 0;
  }
  
  return DateUtils.getDaysDifference(DateUtils.getToday(), delegation.end_date);
}

function getRequestAge(requestDate) {
  const days = DateUtils.getDaysDifference(requestDate, DateUtils.getToday());
  
  if (days === 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 7) return `${days} أيام`;
  if (days < 30) return `${Math.floor(days / 7)} أسابيع`;
  return `${Math.floor(days / 30)} شهور`;
}

function getDaysRemainingText(days) {
  if (days < 0) return 'منتهي';
  if (days === 0) return 'ينتهي اليوم';
  if (days === 1) return 'ينتهي غداً';
  return `${days} أيام متبقية`;
}

function getUrgencyText(level) {
  const urgencyTexts = {
    1: 'منخفض',
    2: 'متوسط',
    3: 'عالي'
  };
  
  return urgencyTexts[level] || 'غير محدد';
}

async function updateDelegationStatus(newStatus) {
  if (!currentDelegation) return;

  let confirmMessage = `هل أنت متأكد من تحديث حالة التفويض إلى "${newStatus}"؟`;
  let reason = null;

  if (newStatus === 'مرفوض') {
    reason = await showRejectModal();
    if (!reason) return;
  }

  if (!confirm(confirmMessage)) return;

  try {
    await apiClient.updateDelegationStatus(currentDelegation.id, newStatus, reason);
    
    showSuccess(`تم تحديث حالة التفويض إلى "${newStatus}" بنجاح`);
    
    // Reload the page to show updated data
    loadDelegationDetails(currentDelegation.id);
    
  } catch (error) {
    console.error('Status update error:', error);
    showError('حدث خطأ في تحديث حالة التفويض');
  }
}

function showRejectModal() {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>سبب رفض التفويض</h3>
          <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove(); resolve(null);">×</button>
        </div>
        <div class="modal-body">
          <textarea id="rejectionReason" class="textarea" placeholder="يرجى توضيح سبب رفض التفويض..." rows="4" required></textarea>
          
          <div class="common-reasons">
            <h4>أسباب شائعة للرفض:</h4>
            <div class="reason-buttons">
              <button type="button" class="reason-btn" onclick="document.getElementById('rejectionReason').value = this.textContent">
                نطاق التفويض غير واضح
              </button>
              <button type="button" class="reason-btn" onclick="document.getElementById('rejectionReason').value = this.textContent">
                المفوض إليه غير مؤهل
              </button>
              <button type="button" class="reason-btn" onclick="document.getElementById('rejectionReason').value = this.textContent">
                فترة التفويض مفرطة
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

function showExtendDelegationModal() {
  showInfo('تمديد التفويض سيكون متاحاً قريباً');
}

function showModifyDelegationModal() {
  showInfo('تعديل التفويض سيكون متاحاً قريباً');
}

function printDelegation() {
  window.print();
}

function exportDelegation() {
  if (!currentDelegation) return;

  const exportData = {
    reference_number: currentDelegation.reference_number,
    delegation_type: getDelegationTypeDisplayName(currentDelegation.delegation_type),
    employee_name: currentDelegation.employee_name,
    delegated_to_name: currentDelegation.delegated_to_name,
    department: currentDelegation.department_name,
    request_date: DateUtils.formatDate(currentDelegation.request_date),
    start_date: currentDelegation.start_date ? DateUtils.formatDate(currentDelegation.start_date) : '',
    end_date: currentDelegation.end_date ? DateUtils.formatDate(currentDelegation.end_date) : '',
    status: (window.getStatusDisplay ? window.getStatusDisplay(currentDelegation.status) : currentDelegation.status),
    scope_description: currentDelegation.scope_description || '',
    limitations: currentDelegation.limitations || ''
  };

  const csvContent = Object.keys(exportData).map(key => 
    `"${key}","${exportData[key]}"`
  ).join('\n');

  Utils.downloadFile(
    'الحقل,القيمة\n' + csvContent, 
    `delegation_${currentDelegation.reference_number}.csv`, 
    'text/csv'
  );
  
  showSuccess('تم تصدير بيانات التفويض بنجاح');
}

// Add delegation detail-specific CSS
const style = document.createElement('style');
style.textContent = `
  .delegation-detail-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .detail-header {
    background: linear-gradient(135deg, #2B6CB0, #60a5fa);
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
  .status-approved { background: #dbeafe; color: #1e40af; }
  .status-rejected { background: #fee2e2; color: #991b1b; }
  .status-active { background: #d1fae5; color: #065f46; }
  .status-completed { background: #e0e7ff; color: #3730a3; }
  .status-cancelled { background: #f3f4f6; color: #374151; }
  .status-suspended { background: #fed7aa; color: #9a3412; }
  .status-expired { background: #fecaca; color: #7f1d1d; }
  
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
    background: #2B6CB0;
    border: 3px solid white;
    box-shadow: 0 0 0 2px #e5e7eb;
  }
  
  .timeline-item.created .timeline-marker { background: #10b981; }
  .timeline-item.status_update .timeline-marker { background: #f59e0b; }
  .timeline-item.started .timeline-marker { background: #3b82f6; }
  
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
    margin-bottom: 5px;
  }
  
  .timeline-details {
    font-size: 14px;
    color: #4b5563;
    font-style: italic;
  }
  
  .activities-section {
    margin-bottom: 30px;
  }
  
  .activities-list {
    margin-bottom: 20px;
  }
  
  .activity-item {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  
  .activity-info {
    flex: 1;
  }
  
  .activity-title {
    font-weight: 600;
    color: #374151;
    margin-bottom: 5px;
  }
  
  .activity-description {
    color: #6b7280;
    font-size: 14px;
    margin-bottom: 8px;
    line-height: 1.4;
  }
  
  .activity-meta {
    display: flex;
    gap: 15px;
    font-size: 13px;
    color: #9ca3af;
  }
  
  .activity-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .activity-badge.completed { background: #d1fae5; color: #065f46; }
  .activity-badge.in-progress { background: #dbeafe; color: #1e40af; }
  .activity-badge.pending { background: #fef3c7; color: #92400e; }
  
  .no-activities {
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
    
    .activity-item {
      flex-direction: column;
      gap: 10px;
    }
  }
  
  @media print {
    .detail-actions,
    .btn {
      display: none !important;
    }
    
    .delegation-detail-container {
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
document.head.appendChild(style);
