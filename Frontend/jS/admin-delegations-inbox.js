// Admin Delegations Inbox JavaScript
// Handles admin delegation inbox functionality with quick actions

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication and admin role
  if (!requireAuth()) return;
  if (!requireAdmin()) return;

  // Initialize page
  loadDelegationsInbox();
  setupEventListeners();
  setupFilters();
  setupAutoRefresh();
});

let currentDelegations = [];
let selectedDelegations = new Set();
let autoRefreshInterval = null;

function setupEventListeners() {
  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadDelegationsInbox();
      showSuccess('تم تحديث البيانات');
    });
  }

  // Mark all as read button
  const markAllReadBtn = document.getElementById('markAllReadBtn');
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', markAllAsRead);
  }

  // Bulk action buttons
  const bulkApproveBtn = document.getElementById('bulkApproveBtn');
  const bulkRejectBtn = document.getElementById('bulkRejectBtn');
  const bulkArchiveBtn = document.getElementById('bulkArchiveBtn');
  
  if (bulkApproveBtn) bulkApproveBtn.addEventListener('click', handleBulkApproval);
  if (bulkRejectBtn) bulkRejectBtn.addEventListener('click', handleBulkRejection);
  if (bulkArchiveBtn) bulkArchiveBtn.addEventListener('click', handleBulkArchive);

  // Select all checkbox
  const selectAllCheckbox = document.getElementById('selectAll');
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', handleSelectAll);
  }

  // Auto refresh toggle
  const autoRefreshToggle = document.getElementById('autoRefreshToggle');
  if (autoRefreshToggle) {
    autoRefreshToggle.addEventListener('change', handleAutoRefreshToggle);
  }

  // View mode toggle
  const viewModeButtons = document.querySelectorAll('.view-mode-btn');
  viewModeButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      viewModeButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      const viewMode = this.dataset.view;
      toggleViewMode(viewMode);
    });
  });
}

function setupFilters() {
  const priorityFilter = document.getElementById('priorityFilter');
  if (priorityFilter) {
    priorityFilter.addEventListener('change', handleFilters);
  }

  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', handleFilters);
  }

  const typeFilter = document.getElementById('typeFilter');
  if (typeFilter) {
    typeFilter.addEventListener('change', handleFilters);
  }

  const dateRangeFilter = document.getElementById('dateRangeFilter');
  if (dateRangeFilter) {
    dateRangeFilter.addEventListener('change', handleFilters);
  }

  const searchInput = document.getElementById('inboxSearch');
  if (searchInput) {
    searchInput.addEventListener('input', Utils.debounce(handleFilters, 300));
  }
}

function setupAutoRefresh() {
  // Check if auto refresh was previously enabled
  const autoRefreshEnabled = localStorage.getItem('delegationInboxAutoRefresh') === 'true';
  const autoRefreshToggle = document.getElementById('autoRefreshToggle');
  
  if (autoRefreshToggle) {
    autoRefreshToggle.checked = autoRefreshEnabled;
    if (autoRefreshEnabled) {
      startAutoRefresh();
    }
  }
}

function startAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  
  autoRefreshInterval = setInterval(() => {
    loadDelegationsInbox(true); // Silent refresh
  }, 30000); // Refresh every 30 seconds
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}

function handleAutoRefreshToggle(e) {
  const enabled = e.target.checked;
  localStorage.setItem('delegationInboxAutoRefresh', enabled.toString());
  
  if (enabled) {
    startAutoRefresh();
    showInfo('تم تفعيل التحديث التلقائي');
  } else {
    stopAutoRefresh();
    showInfo('تم إيقاف التحديث التلقائي');
  }
}

async function loadDelegationsInbox(silent = false) {
  try {
    if (!silent) {
      LoadingUtils.showPageLoading();
    }
    
    const filters = getCurrentFilters();
    const delegations = await apiClient.makeRequest(`/delegation/admin/inbox?${new URLSearchParams(filters)}`);
    
    // Add computed properties
    currentDelegations = delegations.map(delegation => ({
      ...delegation,
      isNew: isNewDelegation(delegation),
      isUrgent: isUrgentDelegation(delegation),
      urgencyLevel: getDelegationUrgency(delegation),
      timeAgo: getTimeAgo(delegation.created_at),
      daysUntilStart: getDaysUntilStart(delegation.start_date)
    }));

    displayDelegationsInbox(currentDelegations);
    updateInboxStatistics();
    
    if (!silent) {
      updateLastRefreshTime();
    }
    
  } catch (error) {
    console.error('Delegations inbox loading error:', error);
    if (!silent) {
      showError('حدث خطأ في تحميل صندوق الوارد');
    }
  } finally {
    if (!silent) {
      LoadingUtils.hidePageLoading();
    }
  }
}

function displayDelegationsInbox(delegations) {
  const inboxContainer = document.getElementById('inboxContainer');
  if (!inboxContainer) return;

  if (delegations.length === 0) {
    inboxContainer.innerHTML = `
      <div class="empty-inbox">
        <div class="empty-icon">📥</div>
        <h3>لا توجد تفويضات في الصندوق</h3>
        <p>جميع التفويضات تمت معالجتها أو لا توجد تفويضات جديدة</p>
      </div>
    `;
    return;
  }

  const delegationsHTML = delegations.map(delegation => `
    <div class="inbox-item ${delegation.isNew ? 'new' : ''} ${delegation.isUrgent ? 'urgent' : ''}" 
         data-id="${delegation.id}" 
         onclick="selectDelegation(${delegation.id})">
      
      <div class="inbox-item-header">
        <div class="inbox-checkbox">
          <input type="checkbox" class="delegation-checkbox" data-id="${delegation.id}" 
                 onclick="event.stopPropagation()" onchange="handleDelegationSelect(${delegation.id}, this.checked)">
        </div>
        
        <div class="inbox-priority">
          ${getPriorityIndicator(delegation.urgencyLevel)}
        </div>
        
        <div class="inbox-info">
          <div class="inbox-title">
            ${getDelegationTypeDisplayName(delegation.delegation_type)}
            ${delegation.isNew ? '<span class="new-badge">جديد</span>' : ''}
          </div>
          <div class="inbox-reference">#${delegation.reference_number}</div>
          <div class="inbox-from">من: ${delegation.employee_name || 'غير محدد'}</div>
          ${delegation.delegated_to_name ? `<div class="inbox-to">إلى: ${delegation.delegated_to_name}</div>` : ''}
        </div>
        
        <div class="inbox-meta">
          <div class="inbox-time">${delegation.timeAgo}</div>
          <div class="inbox-status">${getDelegationStatusBadge(delegation.status)}</div>
          ${delegation.start_date ? `
            <div class="inbox-start-date">
              <small>يبدأ: ${delegation.daysUntilStart !== null ? 
                (delegation.daysUntilStart === 0 ? 'اليوم' : 
                 delegation.daysUntilStart === 1 ? 'غداً' : 
                 `خلال ${delegation.daysUntilStart} أيام`) : 
                DateUtils.formatShortDate(delegation.start_date)
              }</small>
            </div>
          ` : ''}
        </div>
      </div>
      
      <div class="inbox-preview">
        ${delegation.scope_description ? 
          `<p>${delegation.scope_description.substring(0, 150)}${delegation.scope_description.length > 150 ? '...' : ''}</p>` : 
          '<p class="no-description">لا يوجد وصف للنطاق</p>'
        }
      </div>
      
      <div class="inbox-actions">
        ${delegation.status === 'قيد الانتظار' ? `
          <button class="quick-action-btn approve" onclick="event.stopPropagation(); quickApprove(${delegation.id})" title="موافقة سريعة">
            ✓
          </button>
          <button class="quick-action-btn reject" onclick="event.stopPropagation(); quickReject(${delegation.id})" title="رفض سريع">
            ✗
          </button>
        ` : ''}
        <button class="quick-action-btn view" onclick="event.stopPropagation(); viewDelegation(${delegation.id})" title="عرض التفاصيل">
          👁
        </button>
        <button class="quick-action-btn archive" onclick="event.stopPropagation(); archiveDelegation(${delegation.id})" title="أرشفة">
          📁
        </button>
      </div>
    </div>
  `).join('');

  inboxContainer.innerHTML = delegationsHTML;
  
  // Update selection UI
  updateSelectionUI();
}

function getCurrentFilters() {
  const filters = {};
  
  const priorityFilter = document.getElementById('priorityFilter');
  if (priorityFilter && priorityFilter.value) filters.priority = priorityFilter.value;

  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter && statusFilter.value) filters.status = statusFilter.value;

  const typeFilter = document.getElementById('typeFilter');
  if (typeFilter && typeFilter.value) filters.type = typeFilter.value;

  const dateRangeFilter = document.getElementById('dateRangeFilter');
  if (dateRangeFilter && dateRangeFilter.value) filters.dateRange = dateRangeFilter.value;

  const searchInput = document.getElementById('inboxSearch');
  if (searchInput && searchInput.value.trim()) filters.search = searchInput.value.trim();

  return filters;
}

function handleFilters() {
  loadDelegationsInbox();
}

function isNewDelegation(delegation) {
  const createdAt = new Date(delegation.created_at);
  const now = new Date();
  const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
  return hoursDiff <= 24; // Consider new if created within last 24 hours
}

function isUrgentDelegation(delegation) {
  return getDelegationUrgency(delegation) >= 3;
}

function getDelegationUrgency(delegation) {
  const daysSinceRequest = DateUtils.getDaysDifference(delegation.request_date, DateUtils.getToday());
  const daysUntilStart = getDaysUntilStart(delegation.start_date);
  
  // High priority if starting very soon
  if (daysUntilStart !== null && daysUntilStart <= 2) return 3;
  
  // High priority if old pending request
  if (delegation.status === 'قيد الانتظار' && daysSinceRequest > 7) return 3;
  
  // Medium priority if starting soon
  if (daysUntilStart !== null && daysUntilStart <= 7) return 2;
  
  return 1; // Low priority
}

function getDaysUntilStart(startDate) {
  if (!startDate) return null;
  return DateUtils.getDaysDifference(DateUtils.getToday(), startDate);
}

function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return DateUtils.formatShortDate(dateString);
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
  
  return statusBadges[status] || `<span class="status-badge">${status}</span>`;
}

function getPriorityIndicator(urgencyLevel) {
  const indicators = {
    1: '<span class="priority-indicator low" title="أولوية منخفضة">●</span>',
    2: '<span class="priority-indicator medium" title="أولوية متوسطة">●</span>',
    3: '<span class="priority-indicator high" title="أولوية عالية">●</span>'
  };
  
  return indicators[urgencyLevel] || indicators[1];
}

function selectDelegation(delegationId) {
  // Toggle selection
  if (selectedDelegations.has(delegationId)) {
    selectedDelegations.delete(delegationId);
  } else {
    selectedDelegations.add(delegationId);
  }
  
  updateSelectionUI();
}

function handleDelegationSelect(delegationId, checked) {
  if (checked) {
    selectedDelegations.add(delegationId);
  } else {
    selectedDelegations.delete(delegationId);
  }
  
  updateSelectionUI();
}

function handleSelectAll(e) {
  const checked = e.target.checked;
  const checkboxes = document.querySelectorAll('.delegation-checkbox');
  
  selectedDelegations.clear();
  
  checkboxes.forEach(checkbox => {
    checkbox.checked = checked;
    if (checked) {
      selectedDelegations.add(parseInt(checkbox.dataset.id));
    }
  });
  
  updateSelectionUI();
}

function updateSelectionUI() {
  const selectedCount = selectedDelegations.size;
  const totalCount = currentDelegations.length;
  
  // Update checkboxes
  const checkboxes = document.querySelectorAll('.delegation-checkbox');
  checkboxes.forEach(checkbox => {
    const delegationId = parseInt(checkbox.dataset.id);
    checkbox.checked = selectedDelegations.has(delegationId);
  });
  
  // Update select all checkbox
  const selectAllCheckbox = document.getElementById('selectAll');
  if (selectAllCheckbox) {
    selectAllCheckbox.checked = selectedCount === totalCount && totalCount > 0;
    selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < totalCount;
  }
  
  // Update bulk action buttons
  const bulkButtons = document.querySelectorAll('.bulk-action-btn');
  bulkButtons.forEach(btn => {
    btn.disabled = selectedCount === 0;
    if (btn.textContent.includes('(')) {
      btn.textContent = btn.textContent.split('(')[0] + `(${selectedCount})`;
    }
  });
  
  // Update selection counter
  const selectionCounter = document.getElementById('selectionCounter');
  if (selectionCounter) {
    if (selectedCount > 0) {
      selectionCounter.textContent = `تم تحديد ${selectedCount} من ${totalCount}`;
      selectionCounter.style.display = 'block';
    } else {
      selectionCounter.style.display = 'none';
    }
  }
  
  // Highlight selected items
  const inboxItems = document.querySelectorAll('.inbox-item');
  inboxItems.forEach(item => {
    const delegationId = parseInt(item.dataset.id);
    if (selectedDelegations.has(delegationId)) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

async function quickApprove(delegationId) {
  try {
    await apiClient.updateDelegationStatus(delegationId, 'موافق عليه');
    showSuccess('تم الموافقة على التفويض');
    loadDelegationsInbox();
  } catch (error) {
    console.error('Quick approve error:', error);
    showError('حدث خطأ في الموافقة');
  }
}

async function quickReject(delegationId) {
  const reason = prompt('سبب الرفض (اختياري):');
  
  try {
    await apiClient.updateDelegationStatus(delegationId, 'مرفوض', reason);
    showSuccess('تم رفض التفويض');
    loadDelegationsInbox();
  } catch (error) {
    console.error('Quick reject error:', error);
    showError('حدث خطأ في الرفض');
  }
}

function viewDelegation(delegationId) {
  window.location.href = `admin-delegation-detail.html?id=${delegationId}`;
}

async function archiveDelegation(delegationId) {
  try {
    // This would typically call an archive API endpoint
    await apiClient.makeRequest(`/delegation/${delegationId}/archive`, { method: 'POST' });
    showSuccess('تم أرشفة التفويض');
    loadDelegationsInbox();
  } catch (error) {
    console.error('Archive error:', error);
    showError('حدث خطأ في الأرشفة');
  }
}

async function markAllAsRead() {
  try {
    // This would typically call a mark as read API endpoint
    await apiClient.makeRequest('/delegation/admin/mark-all-read', { method: 'POST' });
    showSuccess('تم وضع علامة مقروء على جميع التفويضات');
    loadDelegationsInbox();
  } catch (error) {
    console.error('Mark all read error:', error);
    showError('حدث خطأ في وضع علامة مقروء');
  }
}

async function handleBulkApproval() {
  if (selectedDelegations.size === 0) return;
  
  if (!confirm(`هل أنت متأكد من الموافقة على ${selectedDelegations.size} تفويض؟`)) {
    return;
  }
  
  LoadingUtils.showPageLoading();
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const delegationId of selectedDelegations) {
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
  
  selectedDelegations.clear();
  loadDelegationsInbox();
}

async function handleBulkRejection() {
  if (selectedDelegations.size === 0) return;
  
  const reason = prompt('سبب الرفض (اختياري):');
  
  if (!confirm(`هل أنت متأكد من رفض ${selectedDelegations.size} تفويض؟`)) {
    return;
  }
  
  LoadingUtils.showPageLoading();
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const delegationId of selectedDelegations) {
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
  
  selectedDelegations.clear();
  loadDelegationsInbox();
}

async function handleBulkArchive() {
  if (selectedDelegations.size === 0) return;
  
  if (!confirm(`هل أنت متأكد من أرشفة ${selectedDelegations.size} تفويض؟`)) {
    return;
  }
  
  LoadingUtils.showPageLoading();
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const delegationId of selectedDelegations) {
    try {
      await apiClient.makeRequest(`/delegation/${delegationId}/archive`, { method: 'POST' });
      successCount++;
    } catch (error) {
      console.error('Bulk archive error:', error);
      errorCount++;
    }
  }
  
  LoadingUtils.hidePageLoading();
  
  if (errorCount === 0) {
    showSuccess(`تم أرشفة جميع التفويضات (${successCount} تفويض)`);
  } else {
    showError(`تم أرشفة ${successCount} تفويض، فشل في ${errorCount} تفويض`);
  }
  
  selectedDelegations.clear();
  loadDelegationsInbox();
}

function toggleViewMode(viewMode) {
  const inboxContainer = document.getElementById('inboxContainer');
  if (!inboxContainer) return;
  
  // Remove existing view mode classes
  inboxContainer.classList.remove('compact-view', 'detailed-view');
  
  // Add new view mode class
  if (viewMode === 'compact') {
    inboxContainer.classList.add('compact-view');
  } else if (viewMode === 'detailed') {
    inboxContainer.classList.add('detailed-view');
  }
  
  // Save preference
  localStorage.setItem('delegationInboxViewMode', viewMode);
}

function updateInboxStatistics() {
  const stats = {
    total: currentDelegations.length,
    new: currentDelegations.filter(d => d.isNew).length,
    urgent: currentDelegations.filter(d => d.isUrgent).length,
    pending: currentDelegations.filter(d => d.status === 'قيد الانتظار').length
  };

  // Update statistics cards
  const statElements = {
    totalInbox: document.getElementById('totalInbox'),
    newDelegations: document.getElementById('newDelegations'),
    urgentDelegations: document.getElementById('urgentDelegations'),
    pendingDelegations: document.getElementById('pendingDelegations')
  };

  Object.keys(statElements).forEach(key => {
    const element = statElements[key];
    const statKey = key.replace('Inbox', '').replace('Delegations', '').toLowerCase();
    if (element && stats[statKey] !== undefined) {
      element.textContent = stats[statKey];
    }
  });
}

function updateLastRefreshTime() {
  const lastRefreshElement = document.getElementById('lastRefresh');
  if (lastRefreshElement) {
    lastRefreshElement.textContent = `آخر تحديث: ${DateUtils.formatTime(new Date().toISOString())}`;
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  stopAutoRefresh();
});

// Add inbox-specific CSS
const style = document.createElement('style');
style.textContent = `
  .inbox-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .inbox-header {
    background: white;
    border-radius: 12px;
    padding: 25px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .inbox-title {
    font-size: 24px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 20px;
  }
  
  .inbox-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .inbox-filters {
    display: flex;
    gap: 15px;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .inbox-actions {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .view-mode-buttons {
    display: flex;
    gap: 5px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    overflow: hidden;
  }
  
  .view-mode-btn {
    padding: 8px 12px;
    border: none;
    background: white;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s;
  }
  
  .view-mode-btn.active,
  .view-mode-btn:hover {
    background: #2B6CB0;
    color: white;
  }
  
  .auto-refresh-control {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #6b7280;
  }
  
  .bulk-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    padding: 15px 20px;
    background: #f8f9fa;
    border-radius: 8px;
    align-items: center;
  }
  
  .bulk-actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .selection-counter {
    margin-left: auto;
    font-size: 14px;
    color: #6b7280;
    display: none;
  }
  
  .inbox-item {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
  }
  
  .inbox-item:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transform: translateY(-1px);
  }
  
  .inbox-item.selected {
    border-color: #2B6CB0;
    background: #eff6ff;
  }
  
  .inbox-item.new {
    border-left: 4px solid #10b981;
  }
  
  .inbox-item.urgent {
    border-left: 4px solid #ef4444;
    background: linear-gradient(to right, #fef2f2, white);
  }
  
  .inbox-item-header {
    display: flex;
    align-items: flex-start;
    gap: 15px;
    margin-bottom: 12px;
  }
  
  .inbox-checkbox {
    margin-top: 2px;
  }
  
  .inbox-priority {
    margin-top: 2px;
  }
  
  .priority-indicator {
    font-size: 12px;
  }
  
  .priority-indicator.low { color: #10b981; }
  .priority-indicator.medium { color: #f59e0b; }
  .priority-indicator.high { color: #ef4444; }
  
  .inbox-info {
    flex: 1;
  }
  
  .inbox-title {
    font-weight: 600;
    color: #374151;
    font-size: 16px;
    margin-bottom: 5px;
  }
  
  .new-badge {
    background: #10b981;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    margin-left: 8px;
    font-weight: 600;
  }
  
  .inbox-reference {
    color: #6b7280;
    font-size: 14px;
    margin-bottom: 3px;
  }
  
  .inbox-from,
  .inbox-to {
    color: #374151;
    font-size: 14px;
    margin-bottom: 2px;
  }
  
  .inbox-meta {
    text-align: right;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 5px;
  }
  
  .inbox-time {
    font-size: 13px;
    color: #9ca3af;
  }
  
  .inbox-start-date {
    font-size: 12px;
    color: #6b7280;
  }
  
  .status-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .status-pending { background: #fef3c7; color: #92400e; }
  .status-approved { background: #dbeafe; color: #1e40af; }
  .status-rejected { background: #fee2e2; color: #991b1b; }
  .status-active { background: #d1fae5; color: #065f46; }
  .status-completed { background: #e0e7ff; color: #3730a3; }
  .status-cancelled { background: #f3f4f6; color: #374151; }
  .status-suspended { background: #fed7aa; color: #9a3412; }
  
  .inbox-preview {
    margin-bottom: 15px;
    padding-left: 40px;
  }
  
  .inbox-preview p {
    color: #6b7280;
    font-size: 14px;
    line-height: 1.5;
    margin: 0;
  }
  
  .no-description {
    font-style: italic;
    color: #9ca3af;
  }
  
  .inbox-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding-left: 40px;
  }
  
  .quick-action-btn {
    width: 32px;
    height: 32px;
    border: 1px solid #e5e7eb;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
  }
  
  .quick-action-btn:hover {
    background: #f3f4f6;
  }
  
  .quick-action-btn.approve:hover {
    background: #d1fae5;
    border-color: #10b981;
  }
  
  .quick-action-btn.reject:hover {
    background: #fee2e2;
    border-color: #ef4444;
  }
  
  .quick-action-btn.view:hover {
    background: #dbeafe;
    border-color: #3b82f6;
  }
  
  .quick-action-btn.archive:hover {
    background: #f3f4f6;
    border-color: #6b7280;
  }
  
  .empty-inbox {
    text-align: center;
    padding: 80px 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .empty-icon {
    font-size: 4em;
    margin-bottom: 20px;
  }
  
  .empty-inbox h3 {
    color: #374151;
    margin-bottom: 10px;
  }
  
  .empty-inbox p {
    color: #6b7280;
  }
  
  /* Compact view */
  .compact-view .inbox-item {
    padding: 12px 20px;
  }
  
  .compact-view .inbox-preview {
    display: none;
  }
  
  .compact-view .inbox-actions {
    padding-left: 0;
  }
  
  /* Detailed view */
  .detailed-view .inbox-item {
    padding: 25px;
  }
  
  .detailed-view .inbox-preview {
    background: #f9fafb;
    padding: 15px;
    border-radius: 6px;
    margin-left: 40px;
  }
  
  .inbox-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .stat-card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    text-align: center;
  }
  
  .stat-number {
    font-size: 24px;
    font-weight: bold;
    color: #2B6CB0;
    margin-bottom: 5px;
  }
  
  .stat-label {
    color: #6b7280;
    font-size: 14px;
  }
  
  @media (max-width: 768px) {
    .inbox-controls {
      flex-direction: column;
      align-items: stretch;
    }
    
    .inbox-filters {
      justify-content: center;
    }
    
    .inbox-item-header {
      flex-direction: column;
      gap: 10px;
    }
    
    .inbox-meta {
      align-items: flex-start;
    }
    
    .inbox-actions {
      justify-content: flex-start;
      padding-left: 0;
    }
    
    .bulk-actions {
      flex-direction: column;
      align-items: stretch;
    }
  }
`;
document.head.appendChild(style);
