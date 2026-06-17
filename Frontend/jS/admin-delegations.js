// Admin Delegations JavaScript
// Handles admin delegation management and oversight

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication and admin role
  if (!requireAuth()) return;
  if (!requireAdmin()) return;

  // Initialize page
  loadDelegations();
  setupEventListeners();
  setupFilters();
});

let currentDelegations = [];
let currentPage = 1;
let totalPages = 1;
const itemsPerPage = 10;

// Simple loading utilities
function showLoading() {
  const container = document.getElementById('delegationsContainer');
  if (container) {
    container.innerHTML = '<div style="text-align:center;padding:3rem;color:#64748b;">جاري التحميل...</div>';
  }
}

function hideLoading() {
  // Loading is hidden when content is displayed
}

function setupEventListeners() {
  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadDelegations();
      showSuccess('تم تحديث البيانات');
    });
  }

  // Export button
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportDelegations);
  }

  // Bulk actions
  const bulkApproveBtn = document.getElementById('bulkApproveBtn');
  const bulkRejectBtn = document.getElementById('bulkRejectBtn');
  
  if (bulkApproveBtn) bulkApproveBtn.addEventListener('click', handleBulkApproval);
  if (bulkRejectBtn) bulkRejectBtn.addEventListener('click', handleBulkRejection);

  // Select all checkbox
  const selectAllCheckbox = document.getElementById('selectAll');
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', handleSelectAll);
  }

  // Pagination
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  
  if (prevPageBtn) prevPageBtn.addEventListener('click', () => changePage(currentPage - 1));
  if (nextPageBtn) nextPageBtn.addEventListener('click', () => changePage(currentPage + 1));
}

function setupFilters() {
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', handleFilters);
  }

  const typeFilter = document.getElementById('typeFilter');
  if (typeFilter) {
    typeFilter.addEventListener('change', handleFilters);
  }

  const urgencyFilter = document.getElementById('urgencyFilter');
  if (urgencyFilter) {
    urgencyFilter.addEventListener('change', handleFilters);
  }

  const searchInput = document.getElementById('delegationSearch');
  if (searchInput) {
    searchInput.addEventListener('input', Utils.debounce(handleFilters, 300));
  }

  const dateRangeFilter = document.getElementById('dateRangeFilter');
  if (dateRangeFilter) {
    dateRangeFilter.addEventListener('change', handleFilters);
  }
}

async function loadDelegations(page = 1, filters = {}) {
  try {
    showLoading();
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: itemsPerPage.toString(),
      ...filters
    });

    const response = await apiClient.makeRequest(`/delegation/admin/all?${params}`);
    
    currentDelegations = response.delegations || [];
    currentPage = response.pagination?.page || 1;
    totalPages = response.pagination?.totalPages || 1;
    
    // Add computed properties
    currentDelegations = currentDelegations.map(delegation => ({
      ...delegation,
      isActive: isDelegationActive(delegation),
      isExpired: isDelegationExpired(delegation),
      urgencyLevel: getDelegationUrgency(delegation),
      daysRemaining: getDaysRemaining(delegation)
    }));

    displayDelegations(currentDelegations);
    updatePagination();
    updateStatistics();
    
  } catch (error) {
    console.error('Delegations loading error:', error);
    showError('حدث خطأ في تحميل التفويضات');
  } finally {
    hideLoading();
  }
}

function displayDelegations(delegations) {
  const delegationsContainer = document.getElementById('delegationsContainer');
  if (!delegationsContainer) return;

  if (delegations.length === 0) {
    delegationsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔄</div>
        <h3>لا توجد تفويضات</h3>
        <p>لا توجد تفويضات تطابق المعايير المحددة</p>
      </div>
    `;
    return;
  }

  const delegationsHTML = delegations.map(delegation => `
    <div class="delegation-card ${getDelegationCardClass(delegation)}" data-id="${delegation.id}">
      <div class="delegation-header">
        <div class="delegation-checkbox">
          <input type="checkbox" class="delegation-select" data-id="${delegation.id}" 
                 ${delegation.status === 'قيد الانتظار' ? '' : 'disabled'}>
        </div>
        
        <div class="delegation-info">
          <div class="delegation-type">${getDelegationTypeDisplayName(delegation.delegation_type)}</div>
          <div class="delegation-reference">#${delegation.reference_number}</div>
          <div class="delegation-employee">
            <strong>من:</strong> ${delegation.employee_name || 'غير محدد'}
            ${delegation.delegated_to_name ? `<br><strong>إلى:</strong> ${delegation.delegated_to_name}` : ''}
          </div>
        </div>
        
        <div class="delegation-status">
          ${getDelegationStatusBadge(delegation)}
          ${getUrgencyBadge(delegation)}
          ${delegation.isActive ? `
            <div class="time-remaining">
              ${delegation.daysRemaining > 0 ? 
                `متبقي ${delegation.daysRemaining} يوم` : 
                'ينتهي اليوم'
              }
            </div>
          ` : ''}
        </div>
      </div>
      
      <div class="delegation-details">
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">تاريخ الطلب:</span>
            <span class="value">${DateUtils.formatDate(delegation.request_date)}</span>
          </div>
          
          ${delegation.start_date ? `
            <div class="detail-item">
              <span class="label">تاريخ البداية:</span>
              <span class="value">${DateUtils.formatDate(delegation.start_date)}</span>
            </div>
          ` : ''}
          
          ${delegation.end_date ? `
            <div class="detail-item">
              <span class="label">تاريخ الانتهاء:</span>
              <span class="value">${DateUtils.formatDate(delegation.end_date)}</span>
            </div>
          ` : ''}
          
          <div class="detail-item">
            <span class="label">عمر الطلب:</span>
            <span class="value">${getRequestAge(delegation.request_date)}</span>
          </div>
        </div>
        
        ${delegation.scope_description ? `
          <div class="delegation-scope">
            <strong>نطاق التفويض:</strong>
            <p>${delegation.scope_description}</p>
          </div>
        ` : ''}
      </div>
      
      <div class="delegation-actions">
        ${delegation.status === 'قيد الانتظار' ? `
          <button class="btn btn-success" onclick="approveDelegation(${delegation.id})">
            موافقة
          </button>
          <button class="btn btn-danger" onclick="rejectDelegation(${delegation.id})">
            رفض
          </button>
        ` : ''}
        
        <button class="btn btn-info" onclick="viewDelegationDetails(${delegation.id})">
          عرض التفاصيل
        </button>
        
        ${delegation.isActive ? `
          <button class="btn btn-warning" onclick="suspendDelegation(${delegation.id})">
            تعليق
          </button>
          <button class="btn btn-secondary" onclick="terminateDelegation(${delegation.id})">
            إنهاء
          </button>
        ` : ''}
        
        <button class="btn btn-secondary" onclick="addComment(${delegation.id})">
          تعليق
        </button>
      </div>
    </div>
  `).join('');

  delegationsContainer.innerHTML = delegationsHTML;
}

function handleFilters() {
  const filters = {};
  
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter && statusFilter.value) {
    filters.status = statusFilter.value;
  }

  const typeFilter = document.getElementById('typeFilter');
  if (typeFilter && typeFilter.value) {
    filters.type = typeFilter.value;
  }

  const urgencyFilter = document.getElementById('urgencyFilter');
  if (urgencyFilter && urgencyFilter.value) {
    filters.urgency = urgencyFilter.value;
  }

  const searchInput = document.getElementById('delegationSearch');
  if (searchInput && searchInput.value.trim()) {
    filters.search = searchInput.value.trim();
  }

  const dateRangeFilter = document.getElementById('dateRangeFilter');
  if (dateRangeFilter && dateRangeFilter.value) {
    filters.dateRange = dateRangeFilter.value;
  }

  loadDelegations(1, filters); // Reset to first page
}

function changePage(newPage) {
  if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
    const filters = getCurrentFilters();
    loadDelegations(newPage, filters);
  }
}

function getCurrentFilters() {
  const filters = {};
  
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter && statusFilter.value) filters.status = statusFilter.value;

  const typeFilter = document.getElementById('typeFilter');
  if (typeFilter && typeFilter.value) filters.type = typeFilter.value;

  const urgencyFilter = document.getElementById('urgencyFilter');
  if (urgencyFilter && urgencyFilter.value) filters.urgency = urgencyFilter.value;

  const searchInput = document.getElementById('delegationSearch');
  if (searchInput && searchInput.value.trim()) filters.search = searchInput.value.trim();

  const dateRangeFilter = document.getElementById('dateRangeFilter');
  if (dateRangeFilter && dateRangeFilter.value) filters.dateRange = dateRangeFilter.value;

  return filters;
}

function updatePagination() {
  const paginationInfo = document.getElementById('paginationInfo');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');

  if (paginationInfo) {
    paginationInfo.textContent = `صفحة ${currentPage} من ${totalPages}`;
  }

  if (prevPageBtn) {
    prevPageBtn.disabled = currentPage <= 1;
  }

  if (nextPageBtn) {
    nextPageBtn.disabled = currentPage >= totalPages;
  }
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

function getDelegationCardClass(delegation) {
  if (delegation.isExpired) return 'delegation-expired';
  if (delegation.isActive) return 'delegation-active';
  if (delegation.status === 'قيد الانتظار' && delegation.urgencyLevel >= 3) return 'delegation-urgent';
  if (delegation.status === 'قيد الانتظار') return 'delegation-pending';
  if (delegation.status === 'مرفوض') return 'delegation-rejected';
  return 'delegation-default';
}

function getDelegationStatusBadge(delegation) {
  const statusBadges = {
    'قيد الانتظار': '<span class="status-badge status-pending">قيد الانتظار</span>',
    'موافق عليه': '<span class="status-badge status-approved">موافق عليه</span>',
    'مرفوض': '<span class="status-badge status-rejected">مرفوض</span>',
    'نشط': '<span class="status-badge status-active">نشط</span>',
    'مكتمل': '<span class="status-badge status-completed">مكتمل</span>',
    'ملغي': '<span class="status-badge status-cancelled">ملغي</span>',
    'معلق': '<span class="status-badge status-suspended">معلق</span>'
  };
  
  let badge = statusBadges[delegation.status] || `<span class="status-badge">${delegation.status}</span>`;
  
  if (delegation.isExpired) {
    badge += '<span class="status-badge status-expired">منتهي</span>';
  }
  
  return badge;
}

function getUrgencyBadge(delegation) {
  const urgencyBadges = {
    1: '',
    2: '<span class="urgency-badge medium">متوسط الأولوية</span>',
    3: '<span class="urgency-badge high">عالي الأولوية</span>'
  };
  
  return urgencyBadges[delegation.urgencyLevel] || '';
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

function getRequestAge(requestDate) {
  const days = DateUtils.getDaysDifference(requestDate, DateUtils.getToday());
  
  if (days === 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 7) return `${days} أيام`;
  if (days < 30) return `${Math.floor(days / 7)} أسابيع`;
  return `${Math.floor(days / 30)} شهور`;
}

async function approveDelegation(delegationId) {
  if (!confirm('هل أنت متأكد من الموافقة على هذا التفويض؟')) {
    return;
  }

  try {
    await apiClient.updateDelegationStatus(delegationId, 'موافق عليه');
    showSuccess('تم الموافقة على التفويض بنجاح');
    loadDelegations(currentPage, getCurrentFilters());
  } catch (error) {
    console.error('Delegation approval error:', error);
    showError('حدث خطأ في الموافقة على التفويض');
  }
}

async function rejectDelegation(delegationId) {
  // Show rejection reason modal (reuse from employee-approvals.js)
  const reason = await showRejectModal();
  if (!reason) return;

  try {
    await apiClient.updateDelegationStatus(delegationId, 'مرفوض', reason);
    showSuccess('تم رفض التفويض');
    loadDelegations(currentPage, getCurrentFilters());
  } catch (error) {
    console.error('Delegation rejection error:', error);
    showError('حدث خطأ في رفض التفويض');
  }
}

function showRejectModal() {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>سبب الرفض</h3>
          <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove(); resolve(null);">×</button>
        </div>
        <div class="modal-body">
          <textarea id="rejectionReason" class="textarea" placeholder="يرجى توضيح سبب الرفض..." rows="4" required></textarea>
          
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

function viewDelegationDetails(delegationId) {
  window.location.href = `admin-delegation-detail.html?id=${delegationId}`;
}

async function suspendDelegation(delegationId) {
  if (!confirm('هل أنت متأكد من تعليق هذا التفويض؟')) {
    return;
  }

  try {
    await apiClient.updateDelegationStatus(delegationId, 'معلق');
    showSuccess('تم تعليق التفويض بنجاح');
    loadDelegations(currentPage, getCurrentFilters());
  } catch (error) {
    console.error('Delegation suspension error:', error);
    showError('حدث خطأ في تعليق التفويض');
  }
}

async function terminateDelegation(delegationId) {
  if (!confirm('هل أنت متأكد من إنهاء هذا التفويض؟')) {
    return;
  }

  try {
    await apiClient.updateDelegationStatus(delegationId, 'مكتمل');
    showSuccess('تم إنهاء التفويض بنجاح');
    loadDelegations(currentPage, getCurrentFilters());
  } catch (error) {
    console.error('Delegation termination error:', error);
    showError('حدث خطأ في إنهاء التفويض');
  }
}

function addComment(delegationId) {
  showInfo('إضافة التعليقات ستكون متاحة قريباً');
}

function handleSelectAll(e) {
  const checkboxes = document.querySelectorAll('.delegation-select:not(:disabled)');
  checkboxes.forEach(checkbox => {
    checkbox.checked = e.target.checked;
  });
  
  updateBulkButtons();
}

function updateBulkButtons() {
  const selectedCheckboxes = document.querySelectorAll('.delegation-select:checked');
  const bulkApproveBtn = document.getElementById('bulkApproveBtn');
  const bulkRejectBtn = document.getElementById('bulkRejectBtn');
  
  const hasSelection = selectedCheckboxes.length > 0;
  
  if (bulkApproveBtn) {
    bulkApproveBtn.disabled = !hasSelection;
    bulkApproveBtn.textContent = `موافقة (${selectedCheckboxes.length})`;
  }
  
  if (bulkRejectBtn) {
    bulkRejectBtn.disabled = !hasSelection;
    bulkRejectBtn.textContent = `رفض (${selectedCheckboxes.length})`;
  }
}

async function handleBulkApproval() {
  const selectedCheckboxes = document.querySelectorAll('.delegation-select:checked');
  if (selectedCheckboxes.length === 0) return;
  
  if (!confirm(`هل أنت متأكد من الموافقة على ${selectedCheckboxes.length} تفويض؟`)) {
    return;
  }
  
  LoadingUtils.showPageLoading();
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const checkbox of selectedCheckboxes) {
    const delegationId = checkbox.dataset.id;
    
    try {
      await apiClient.updateDelegationStatus(delegationId, 'موافق عليه');
      successCount++;
    } catch (error) {
      console.error('Bulk approval error:', error);
      errorCount++;
    }
  }
  
  LoadingUtils.hidePageLoading();
  
  if (errorCount === 0) {
    showSuccess(`تم الموافقة على جميع التفويضات (${successCount} تفويض)`);
  } else {
    showError(`تم الموافقة على ${successCount} تفويض، فشل في ${errorCount} تفويض`);
  }
  
  loadDelegations(currentPage, getCurrentFilters());
}

async function handleBulkRejection() {
  const selectedCheckboxes = document.querySelectorAll('.delegation-select:checked');
  if (selectedCheckboxes.length === 0) return;
  
  const reason = await showRejectModal();
  if (!reason) return;
  
  LoadingUtils.showPageLoading();
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const checkbox of selectedCheckboxes) {
    const delegationId = checkbox.dataset.id;
    
    try {
      await apiClient.updateDelegationStatus(delegationId, 'مرفوض', reason);
      successCount++;
    } catch (error) {
      console.error('Bulk rejection error:', error);
      errorCount++;
    }
  }
  
  LoadingUtils.hidePageLoading();
  
  if (errorCount === 0) {
    showSuccess(`تم رفض جميع التفويضات (${successCount} تفويض)`);
  } else {
    showError(`تم رفض ${successCount} تفويض، فشل في ${errorCount} تفويض`);
  }
  
  loadDelegations(currentPage, getCurrentFilters());
}

function exportDelegations() {
  const csvContent = generateCSV(currentDelegations);
  Utils.downloadFile(csvContent, 'delegations.csv', 'text/csv');
  showSuccess('تم تصدير البيانات بنجاح');
}

function generateCSV(delegations) {
  const headers = ['الرقم المرجعي', 'نوع التفويض', 'اسم الموظف', 'المفوض إليه', 'تاريخ الطلب', 'تاريخ البداية', 'تاريخ الانتهاء', 'الحالة'];
  const rows = delegations.map(delegation => [
    delegation.reference_number,
    getDelegationTypeDisplayName(delegation.delegation_type),
    delegation.employee_name || '',
    delegation.delegated_to_name || '',
    DateUtils.formatDate(delegation.request_date),
    delegation.start_date ? DateUtils.formatDate(delegation.start_date) : '',
    delegation.end_date ? DateUtils.formatDate(delegation.end_date) : '',
    (window.getStatusDisplay ? window.getStatusDisplay(delegation.status) : delegation.status)
  ]);
  
  return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
}

function updateStatistics() {
  const stats = {
    total: currentDelegations.length,
    pending: currentDelegations.filter(d => d.status === 'قيد الانتظار').length,
    active: currentDelegations.filter(d => d.isActive).length,
    expired: currentDelegations.filter(d => d.isExpired).length,
    urgent: currentDelegations.filter(d => d.urgencyLevel >= 3).length
  };

  // Update statistics cards
  const statElements = {
    totalDelegations: document.getElementById('totalDelegations'),
    pendingDelegations: document.getElementById('pendingDelegations'),
    activeDelegations: document.getElementById('activeDelegations'),
    expiredDelegations: document.getElementById('expiredDelegations')
  };

  Object.keys(statElements).forEach(key => {
    const element = statElements[key];
    const statKey = key.replace('Delegations', '').toLowerCase();
    if (element && stats[statKey] !== undefined) {
      element.textContent = stats[statKey];
    }
  });
}

// Add event listener for checkbox changes
document.addEventListener('change', function(e) {
  if (e.target.classList.contains('delegation-select')) {
    updateBulkButtons();
  }
});

// Add admin delegations-specific CSS
const style = document.createElement('style');
style.textContent = `
  .delegation-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 15px;
    transition: all 0.3s;
  }
  
  .delegation-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
  
  .delegation-active {
    border-left: 4px solid #10b981;
    background: linear-gradient(to right, #ecfdf5, white);
  }
  
  .delegation-expired {
    border-left: 4px solid #ef4444;
    background: linear-gradient(to right, #fef2f2, white);
  }
  
  .delegation-urgent {
    border-left: 4px solid #f59e0b;
    background: linear-gradient(to right, #fffbeb, white);
  }
  
  .delegation-pending {
    border-left: 4px solid #6b7280;
  }
  
  .delegation-rejected {
    border-left: 4px solid #9ca3af;
    background: linear-gradient(to right, #f9fafb, white);
  }
  
  .delegation-header {
    display: flex;
    align-items: flex-start;
    gap: 15px;
    margin-bottom: 15px;
  }
  
  .delegation-info {
    flex: 1;
  }
  
  .delegation-type {
    font-weight: 600;
    color: #2B6CB0;
    font-size: 16px;
    margin-bottom: 5px;
  }
  
  .delegation-reference {
    color: #6b7280;
    font-size: 14px;
    margin-bottom: 5px;
  }
  
  .delegation-employee {
    color: #374151;
    font-size: 14px;
    line-height: 1.4;
  }
  
  .delegation-status {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 5px;
  }
  
  .time-remaining {
    font-size: 12px;
    color: #059669;
    font-weight: 600;
  }
  
  .status-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    margin: 2px;
  }
  
  .status-pending { background: #fef3c7; color: #92400e; }
  .status-approved { background: #dbeafe; color: #1e40af; }
  .status-rejected { background: #fee2e2; color: #991b1b; }
  .status-active { background: #d1fae5; color: #065f46; }
  .status-completed { background: #e0e7ff; color: #3730a3; }
  .status-cancelled { background: #f3f4f6; color: #374151; }
  .status-suspended { background: #fed7aa; color: #9a3412; }
  .status-expired { background: #fecaca; color: #7f1d1d; }
  
  .urgency-badge {
    padding: 3px 6px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 600;
  }
  
  .urgency-badge.medium { background: #fef3c7; color: #92400e; }
  .urgency-badge.high { background: #fed7aa; color: #9a3412; }
  
  .delegation-details {
    margin-bottom: 15px;
    padding: 15px;
    background: #f9fafb;
    border-radius: 8px;
  }
  
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
    margin-bottom: 15px;
  }
  
  .detail-item {
    display: flex;
    justify-content: space-between;
  }
  
  .detail-item .label {
    font-weight: 600;
    color: #374151;
  }
  
  .detail-item .value {
    color: #6b7280;
  }
  
  .delegation-scope {
    margin-top: 10px;
  }
  
  .delegation-scope p {
    margin: 5px 0 0 0;
    color: #6b7280;
    line-height: 1.5;
  }
  
  .delegation-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .filters-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .bulk-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    padding: 15px 20px;
    background: #f8f9fa;
    border-radius: 12px;
    align-items: center;
  }
  
  .bulk-actions input[type="checkbox"] {
    margin-right: 10px;
  }
  
  .bulk-actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .pagination-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin-top: 20px;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .pagination-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .empty-state {
    text-align: center;
    padding: 60px 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .empty-icon {
    font-size: 4em;
    margin-bottom: 20px;
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
`;
document.head.appendChild(style);
