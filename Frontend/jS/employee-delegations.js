// Employee Delegations JavaScript
// Handles employee delegation management and viewing

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  if (!requireAuth()) return;

  // Initialize page
  loadDelegations();
  setupEventListeners();
  setupFilters();
});

let currentDelegations = [];
let currentView = 'all'; // all, active, expired, pending

function setupEventListeners() {
  // New delegation button
  const newDelegationBtn = document.getElementById('newDelegationBtn');
  if (newDelegationBtn) {
    newDelegationBtn.addEventListener('click', () => {
      window.location.href = 'delegation-request.html';
    });
  }

  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadDelegations();
      showSuccess('تم تحديث البيانات');
    });
  }

  // View toggle buttons
  const viewButtons = document.querySelectorAll('.view-btn');
  viewButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      viewButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      currentView = this.dataset.view;
      filterDelegations();
    });
  });
}

function setupFilters() {
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', filterDelegations);
  }

  const typeFilter = document.getElementById('typeFilter');
  if (typeFilter) {
    typeFilter.addEventListener('change', filterDelegations);
  }

  const searchInput = document.getElementById('delegationSearch');
  if (searchInput) {
    searchInput.addEventListener('input', Utils.debounce(filterDelegations, 300));
  }
}

async function loadDelegations() {
  try {
    LoadingUtils.showPageLoading();
    
    const response = await apiClient.getMyDelegations();
    
    // Extract data from API response object { success: true, data: [] }
    const delegations = response?.data || response;
    
    // Ensure delegations is an array
    if (!Array.isArray(delegations)) {
      console.warn('Delegations is not an array:', response);
      currentDelegations = [];
      displayDelegations([]);
      updateStatistics();
      return;
    }
    
    // Add additional computed properties
    currentDelegations = delegations.map(delegation => ({
      ...delegation,
      isActive: isDelegationActive(delegation),
      isExpired: isDelegationExpired(delegation),
      daysRemaining: getDaysRemaining(delegation),
      statusClass: getDelegationStatusClass(delegation)
    }));

    displayDelegations(currentDelegations);
    updateStatistics();
    
  } catch (error) {
    console.error('Delegations loading error:', error);
    showError('حدث خطأ في تحميل التفويضات');
  } finally {
    LoadingUtils.hidePageLoading();
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
        <p>${getEmptyStateMessage()}</p>
        <button class="btn btn-primary" onclick="window.location.href='delegation-request.html'">
          إنشاء تفويض جديد
        </button>
      </div>
    `;
    return;
  }

  const delegationsHTML = delegations.map(delegation => `
    <div class="delegation-card ${delegation.statusClass}" data-id="${delegation.id}">
      <div class="delegation-header">
        <div class="delegation-info">
          <h3 class="delegation-title">${getDelegationTypeDisplayName(delegation.delegation_type)}</h3>
          <div class="delegation-reference">#${delegation.reference_number}</div>
          <div class="delegation-dates">
            ${delegation.start_date && delegation.end_date ? 
              `${DateUtils.formatShortDate(delegation.start_date)} - ${DateUtils.formatShortDate(delegation.end_date)}` :
              `طلب في ${DateUtils.formatShortDate(delegation.request_date)}`
            }
          </div>
        </div>
        
        <div class="delegation-status">
          ${getDelegationStatusBadge(delegation)}
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
        ${delegation.scope_description ? `
          <div class="delegation-scope">
            <strong>نطاق التفويض:</strong>
            <p>${delegation.scope_description}</p>
          </div>
        ` : ''}
        
        ${delegation.delegated_to_name ? `
          <div class="delegation-to">
            <strong>مفوض إلى:</strong> ${delegation.delegated_to_name}
          </div>
        ` : ''}
        
        ${delegation.limitations ? `
          <div class="delegation-limitations">
            <strong>القيود:</strong>
            <p>${delegation.limitations}</p>
          </div>
        ` : ''}
      </div>
      
      <div class="delegation-actions">
        <button class="btn btn-info" onclick="viewDelegationDetails(${delegation.id})">
          عرض التفاصيل
        </button>
        
        ${delegation.status === 'قيد الانتظار' ? `
          <button class="btn btn-secondary" onclick="editDelegation(${delegation.id})">
            تعديل
          </button>
          <button class="btn btn-danger" onclick="cancelDelegation(${delegation.id})">
            إلغاء
          </button>
        ` : ''}
        
        ${delegation.isActive ? `
          <button class="btn btn-warning" onclick="suspendDelegation(${delegation.id})">
            تعليق
          </button>
          <button class="btn btn-danger" onclick="terminateDelegation(${delegation.id})">
            إنهاء
          </button>
        ` : ''}
        
        ${delegation.status === 'مكتمل' || delegation.status === 'ملغي' ? `
          <button class="btn btn-success" onclick="renewDelegation(${delegation.id})">
            تجديد
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');

  delegationsContainer.innerHTML = delegationsHTML;
}

function filterDelegations() {
  const statusFilter = document.getElementById('statusFilter');
  const typeFilter = document.getElementById('typeFilter');
  const searchInput = document.getElementById('delegationSearch');
  
  let filteredDelegations = [...currentDelegations];

  // Filter by view
  switch (currentView) {
    case 'active':
      filteredDelegations = filteredDelegations.filter(d => d.isActive);
      break;
    case 'expired':
      filteredDelegations = filteredDelegations.filter(d => d.isExpired);
      break;
    case 'pending':
      filteredDelegations = filteredDelegations.filter(d => d.status === 'قيد الانتظار');
      break;
  }

  // Filter by status
  if (statusFilter && statusFilter.value) {
    filteredDelegations = filteredDelegations.filter(d => d.status === statusFilter.value);
  }

  // Filter by type
  if (typeFilter && typeFilter.value) {
    filteredDelegations = filteredDelegations.filter(d => d.delegation_type === typeFilter.value);
  }

  // Filter by search
  if (searchInput && searchInput.value.trim()) {
    const searchTerm = searchInput.value.trim().toLowerCase();
    filteredDelegations = filteredDelegations.filter(d => 
      d.reference_number.toLowerCase().includes(searchTerm) ||
      d.delegation_type.toLowerCase().includes(searchTerm) ||
      (d.scope_description && d.scope_description.toLowerCase().includes(searchTerm)) ||
      (d.delegated_to_name && d.delegated_to_name.toLowerCase().includes(searchTerm))
    );
  }

  displayDelegations(filteredDelegations);
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

function getDaysRemaining(delegation) {
  if (!delegation.end_date || !isDelegationActive(delegation)) {
    return 0;
  }
  
  return DateUtils.getDaysDifference(DateUtils.getToday(), delegation.end_date);
}

function getDelegationStatusClass(delegation) {
  if (delegation.isExpired) return 'delegation-expired';
  if (delegation.isActive) return 'delegation-active';
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
    'ملغي': '<span class="status-badge status-cancelled">ملغي</span>'
  };
  
  let badge = statusBadges[delegation.status] || `<span class="status-badge">${delegation.status}</span>`;
  
  if (delegation.isExpired) {
    badge += '<span class="status-badge status-expired">منتهي</span>';
  }
  
  return badge;
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

function getEmptyStateMessage() {
  switch (currentView) {
    case 'active':
      return 'لا توجد تفويضات نشطة حالياً';
    case 'expired':
      return 'لا توجد تفويضات منتهية الصلاحية';
    case 'pending':
      return 'لا توجد تفويضات معلقة';
    default:
      return 'لم تقم بإنشاء أي تفويضات بعد';
  }
}

function viewDelegationDetails(delegationId) {
  // Use employee delegation detail page if it exists, otherwise admin page
  window.location.href = `admin-delegation-detail.html?id=${delegationId}`;
}

function editDelegation(delegationId) {
  window.location.href = `delegation-request.html?edit=${delegationId}`;
}

async function cancelDelegation(delegationId) {
  if (!confirm('هل أنت متأكد من إلغاء هذا التفويض؟')) {
    return;
  }

  try {
    await apiClient.updateDelegationStatus(delegationId, 'ملغي');
    showSuccess('تم إلغاء التفويض بنجاح');
    loadDelegations();
  } catch (error) {
    console.error('Cancel delegation error:', error);
    showError('حدث خطأ في إلغاء التفويض');
  }
}

async function suspendDelegation(delegationId) {
  if (!confirm('هل أنت متأكد من تعليق هذا التفويض مؤقتاً؟')) {
    return;
  }

  try {
    await apiClient.updateDelegationStatus(delegationId, 'معلق');
    showSuccess('تم تعليق التفويض بنجاح');
    loadDelegations();
  } catch (error) {
    console.error('Suspend delegation error:', error);
    showError('حدث خطأ في تعليق التفويض');
  }
}

async function terminateDelegation(delegationId) {
  if (!confirm('هل أنت متأكد من إنهاء هذا التفويض نهائياً؟')) {
    return;
  }

  try {
    await apiClient.updateDelegationStatus(delegationId, 'مكتمل');
    showSuccess('تم إنهاء التفويض بنجاح');
    loadDelegations();
  } catch (error) {
    console.error('Terminate delegation error:', error);
    showError('حدث خطأ في إنهاء التفويض');
  }
}

function renewDelegation(delegationId) {
  window.location.href = `delegation-request.html?renew=${delegationId}`;
}

function updateStatistics() {
  const stats = {
    total: currentDelegations.length,
    active: currentDelegations.filter(d => d.isActive).length,
    pending: currentDelegations.filter(d => d.status === 'قيد الانتظار').length,
    expired: currentDelegations.filter(d => d.isExpired).length
  };

  // Update statistics cards
  const statElements = {
    totalDelegations: document.getElementById('totalDelegations'),
    activeDelegations: document.getElementById('activeDelegations'),
    pendingDelegations: document.getElementById('pendingDelegations'),
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

// Admin delegation management functionality
let hasAdminDelegationAccess = false;
let adminDelegationSection = null;

// Check if user has delegation management permissions
function checkAdminDelegationAccess() {
  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  if (!authUser) return false;
  
  // Check if user has accepted delegation with manage_delegations scope
  const delegations = JSON.parse(localStorage.getItem('delegations') || '[]');
  const userEmail = authUser.email?.toLowerCase();
  
  return delegations.some(d => {
    return d.status === 'active' && 
           (d.to || '').toLowerCase() === userEmail &&
           isDelegationActive(d) &&
           (d.scopes || []).includes('manage_delegations');
  });
}

// Initialize admin delegation section
function initializeAdminDelegationSection() {
  hasAdminDelegationAccess = checkAdminDelegationAccess();
  adminDelegationSection = document.getElementById('adminDelegationSection');
  
  if (hasAdminDelegationAccess && adminDelegationSection) {
    adminDelegationSection.style.display = 'block';
    setupAdminDelegationEvents();
    loadAdminDelegations();
  }
}

// Setup admin delegation event listeners
function setupAdminDelegationEvents() {
  // Form submission
  const saveBtn = document.getElementById('btnSave');
  if (saveBtn) {
    saveBtn.addEventListener('click', handleSaveAdminDelegation);
  }

  // Form reset
  const resetBtn = document.getElementById('btnReset');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetAdminDelegationForm);
  }

  // Custom scope addition
  const addScopeBtn = document.getElementById('btnAddScope');
  if (addScopeBtn) {
    addScopeBtn.addEventListener('click', addCustomScope);
  }

  // Management filters
  const statusFilter = document.getElementById('flStatus');
  const searchFilter = document.getElementById('flSearch');
  
  if (statusFilter) statusFilter.addEventListener('change', filterAdminDelegations);
  if (searchFilter) searchFilter.addEventListener('input', Utils.debounce(filterAdminDelegations, 300));
}

// Handle save admin delegation
function handleSaveAdminDelegation() {
  const formData = validateAdminDelegationForm();
  if (!formData) return;

  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  const delegations = JSON.parse(localStorage.getItem('delegations') || '[]');
  
  const newDelegation = {
    id: Date.now(),
    from: formData.from,
    to: formData.to,
    scopes: formData.scopes,
    note: formData.note,
    active: formData.active,
    validFrom: formData.validFrom,
    validTo: formData.validTo,
    createdAt: Date.now(),
    createdBy: authUser.email?.toLowerCase(),
    status: formData.requiresAcceptance ? 'pending' : 'active'
  };

  delegations.push(newDelegation);
  localStorage.setItem('delegations', JSON.stringify(delegations));

  // Send notifications
  sendDelegationNotification(newDelegation.to, `تم تفويضك بصلاحيات جديدة (#${newDelegation.id})`);
  
  // Trigger storage event
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'delegations',
    newValue: JSON.stringify(delegations)
  }));

  showSuccess('تم إنشاء التفويض بنجاح');
  resetAdminDelegationForm();
  loadAdminDelegations();
}

// Validate admin delegation form
function validateAdminDelegationForm() {
  const fromInput = document.getElementById('fFrom');
  const toInput = document.getElementById('fTo');
  const noteInput = document.getElementById('fNote');
  const activeSelect = document.getElementById('fActive');
  const validFromInput = document.getElementById('fValidFrom');
  const validToInput = document.getElementById('fValidTo');
  const requiresAcceptanceSelect = document.getElementById('fRequiresAcceptance');

  const from = fromInput?.value?.trim().toLowerCase();
  const to = toInput?.value?.trim().toLowerCase();

  if (!from || !to) {
    showError('يرجى إدخال بريديْ المفوِّض والمفوَّض له');
    return null;
  }

  if (from === to) {
    showError('لا يمكن تفويض نفس الشخص لنفسه');
    return null;
  }

  const scopes = getSelectedScopes();
  if (scopes.length === 0) {
    showError('اختر صلاحية واحدة على الأقل');
    return null;
  }

  return {
    from,
    to,
    scopes,
    note: noteInput?.value?.trim() || '',
    active: activeSelect?.value === 'true',
    validFrom: validFromInput?.value ? new Date(validFromInput.value).getTime() : Date.now(),
    validTo: validToInput?.value ? new Date(validToInput.value).getTime() : null,
    requiresAcceptance: requiresAcceptanceSelect?.value === 'true'
  };
}

// Get selected scopes
function getSelectedScopes() {
  const scopeBox = document.getElementById('scopeBox');
  if (!scopeBox) return [];
  
  return Array.from(scopeBox.querySelectorAll('input[type="checkbox"]:checked'))
    .map(checkbox => checkbox.value);
}

// Add custom scope
function addCustomScope() {
  const customScopeInput = document.getElementById('fCustomScope');
  const scopeBox = document.getElementById('scopeBox');
  
  if (!customScopeInput || !scopeBox) return;
  
  const value = customScopeInput.value.trim();
  if (!value) return;

  const label = document.createElement('label');
  label.className = 'scope';
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.value = value;
  checkbox.checked = true;
  
  label.appendChild(checkbox);
  label.appendChild(document.createTextNode(' ' + value));
  
  scopeBox.insertBefore(label, scopeBox.lastElementChild);
  customScopeInput.value = '';
}

// Reset admin delegation form
function resetAdminDelegationForm() {
  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  
  const formTitle = document.getElementById('formTitle');
  const fromInput = document.getElementById('fFrom');
  const toInput = document.getElementById('fTo');
  const noteInput = document.getElementById('fNote');
  const activeSelect = document.getElementById('fActive');
  const validFromInput = document.getElementById('fValidFrom');
  const validToInput = document.getElementById('fValidTo');

  if (formTitle) formTitle.textContent = 'إنشاء تفويض';
  if (fromInput) fromInput.value = authUser?.email || '';
  if (toInput) toInput.value = '';
  if (noteInput) noteInput.value = '';
  if (activeSelect) activeSelect.value = 'true';
  if (validFromInput) validFromInput.value = new Date().toISOString().slice(0, 10);
  if (validToInput) validToInput.value = '';

  // Clear scope selections
  const scopeBox = document.getElementById('scopeBox');
  if (scopeBox) {
    scopeBox.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
    });
  }
}

// Load admin delegations
function loadAdminDelegations() {
  const delegations = JSON.parse(localStorage.getItem('delegations') || '[]');
  displayAdminDelegations(delegations);
  updateAdminDelegationKPIs(delegations);
}

// Display admin delegations
function displayAdminDelegations(delegations) {
  const managementRows = document.getElementById('managementRows');
  if (!managementRows) return;

  if (delegations.length === 0) {
    managementRows.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center;color:#64748b">لا توجد بيانات</td>
      </tr>
    `;
    return;
  }

  const rows = delegations.map(delegation => {
    const isActive = isDelegationActive(delegation);
    const badge = isActive ? 'b-act' : 'b-exp';
    const scopes = (delegation.scopes || []).join('، ');
    const duration = `${DateUtils.formatShortDate(delegation.validFrom)} — ${delegation.validTo ? DateUtils.formatShortDate(delegation.validTo) : '—'}`;
    
    let acceptanceStatus = '';
    if (delegation.status === 'rejected') {
      acceptanceStatus = '<span class="badge b-rej">مرفوض</span>';
    } else if (delegation.status === 'active') {
      acceptanceStatus = '<span class="badge b-act">مقبول</span>';
    } else if (delegation.status === 'pending') {
      acceptanceStatus = '<span class="badge b-pend">في الانتظار</span>';
    } else {
      acceptanceStatus = '<span class="badge">غير محدد</span>';
    }

    return `
      <tr>
        <td>${delegation.id}</td>
        <td>${delegation.from || '-'}</td>
        <td>${delegation.to || '-'}</td>
        <td>${scopes || '—'}${delegation.note ? '<br><small style="color:#64748b">' + delegation.note + '</small>' : ''}</td>
        <td>${duration}</td>
        <td><span class="badge ${badge}">${isActive ? 'فعّال' : 'منتهي/موقوف'}</span></td>
        <td>${acceptanceStatus}</td>
        <td>${DateUtils.formatShortDate(delegation.createdAt)}</td>
        <td class="row-actions">
          <button class="btn" onclick="editAdminDelegation(${delegation.id})">تعديل</button>
          <button class="btn warn" onclick="extendAdminDelegation(${delegation.id}, 7)">تمديد 7 أيام</button>
          <button class="btn" onclick="toggleAdminDelegation(${delegation.id})">${isActive ? 'إيقاف' : 'تفعيل'}</button>
          <button class="btn danger" onclick="removeAdminDelegation(${delegation.id})">حذف</button>
        </td>
      </tr>
    `;
  }).join('');

  managementRows.innerHTML = rows;
}

// Update admin delegation KPIs
function updateAdminDelegationKPIs(delegations) {
  const active = delegations.filter(d => isDelegationActive(d)).length;
  const expiringSoon = delegations.filter(d => isExpiringSoon(d)).length;
  const inactive = delegations.length - active;
  const total = delegations.length;

  const kActiveEl = document.getElementById('kActive');
  const kSoonEl = document.getElementById('kSoon');
  const kInactiveEl = document.getElementById('kInactive');
  const kAllEl = document.getElementById('kAll');

  if (kActiveEl) kActiveEl.textContent = active;
  if (kSoonEl) kSoonEl.textContent = expiringSoon;
  if (kInactiveEl) kInactiveEl.textContent = inactive;
  if (kAllEl) kAllEl.textContent = total;
}

// Check if delegation is expiring soon (within 3 days)
function isExpiringSoon(delegation) {
  if (!delegation.validTo) return false;
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  const diff = delegation.validTo - Date.now();
  return diff > 0 && diff <= threeDays;
}

// Filter admin delegations
function filterAdminDelegations() {
  const statusFilter = document.getElementById('flStatus');
  const searchFilter = document.getElementById('flSearch');
  
  const status = statusFilter?.value || '';
  const search = searchFilter?.value?.toLowerCase().trim() || '';
  
  const delegations = JSON.parse(localStorage.getItem('delegations') || '[]');
  
  let filteredDelegations = delegations.filter(delegation => {
    if (status === 'active' && !isDelegationActive(delegation)) return false;
    if (status === 'expired' && isDelegationActive(delegation)) return false;
    if (status === 'soon' && !isExpiringSoon(delegation)) return false;
    
    if (search) {
      const searchText = `${delegation.id} ${delegation.from || ''} ${delegation.to || ''} ${(delegation.scopes || []).join(' ')} ${delegation.note || ''}`.toLowerCase();
      if (!searchText.includes(search)) return false;
    }
    
    return true;
  });
  
  displayAdminDelegations(filteredDelegations);
}

// Admin delegation action functions
window.editAdminDelegation = function(id) {
  showInfo('تعديل التفويض سيكون متاحاً قريباً');
};

window.extendAdminDelegation = function(id, days) {
  const delegations = JSON.parse(localStorage.getItem('delegations') || '[]');
  const delegation = delegations.find(d => d.id === id);
  
  if (!delegation) return;
  
  const base = delegation.validTo && delegation.validTo > Date.now() ? delegation.validTo : Date.now();
  delegation.validTo = base + days * 24 * 60 * 60 * 1000;
  
  localStorage.setItem('delegations', JSON.stringify(delegations));
  
  sendDelegationNotification(delegation.to, `تم تمديد تفويضك #${delegation.id} ${days} يوم`);
  
  showSuccess(`تم تمديد التفويض ${days} أيام`);
  loadAdminDelegations();
};

window.toggleAdminDelegation = function(id) {
  const delegations = JSON.parse(localStorage.getItem('delegations') || '[]');
  const delegation = delegations.find(d => d.id === id);
  
  if (!delegation) return;
  
  delegation.active = !delegation.active;
  localStorage.setItem('delegations', JSON.stringify(delegations));
  
  const message = delegation.active ? 'تم تفعيل' : 'تم إيقاف';
  sendDelegationNotification(delegation.to, `${message} تفويضك #${delegation.id}`);
  
  showSuccess(`${message} التفويض`);
  loadAdminDelegations();
};

window.removeAdminDelegation = function(id) {
  if (!confirm('هل أنت متأكد من حذف هذا التفويض نهائياً؟')) return;
  
  const delegations = JSON.parse(localStorage.getItem('delegations') || '[]');
  const delegationIndex = delegations.findIndex(d => d.id === id);
  
  if (delegationIndex === -1) return;
  
  const delegation = delegations[delegationIndex];
  delegations.splice(delegationIndex, 1);
  localStorage.setItem('delegations', JSON.stringify(delegations));
  
  sendDelegationNotification(delegation.to, `تم حذف تفويضك #${delegation.id}`);
  
  showSuccess('تم حذف التفويض');
  loadAdminDelegations();
};

// Export management CSV
window.exportManagementCSV = function() {
  const delegations = JSON.parse(localStorage.getItem('delegations') || '[]');
  const headers = ['ID', 'From', 'To', 'Scopes', 'Note', 'Active', 'ValidFrom', 'ValidTo', 'CreatedAt', 'CreatedBy'];
  
  const csvData = [headers];
  delegations.forEach(d => {
    csvData.push([
      d.id || '',
      d.from || '',
      d.to || '',
      (d.scopes || []).join('|'),
      d.note || '',
      isDelegationActive(d),
      d.validFrom || '',
      d.validTo || '',
      d.createdAt || '',
      d.createdBy || ''
    ]);
  });
  
  const csvContent = csvData.map(row => 
    row.map(cell => String(cell).includes(',') ? `"${cell}"` : cell).join(',')
  ).join('\n');
  
  Utils.downloadFile(csvContent, 'managed_delegations.csv', 'text/csv');
  showSuccess('تم تصدير البيانات بنجاح');
};

// Send delegation notification
function sendDelegationNotification(toEmail, message) {
  try {
    NotificationStore.add({
      title: message,
      time: new Date().toLocaleString('ar-SA'),
      createdAt: Date.now(),
      unread: true,
      recipient: (toEmail || '').toLowerCase(),
      type: 'delegation_management'
    });
  } catch (error) {
    console.error('Error sending delegation notification:', error);
  }
}


// Override the original acceptance function to trigger admin section
const originalAcceptDelegation = window.acceptDelegation;
window.acceptDelegation = function(id) {
  if (originalAcceptDelegation) {
    originalAcceptDelegation(id);
  }
  
  // Check and initialize admin section after accepting
  setTimeout(() => {
    initializeAdminDelegationSection();
  }, 1000);
};

// Initialize admin delegation section on page load
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    initializeAdminDelegationSection();
  }, 500);
});

// Monitor delegation changes
window.addEventListener('storage', function(e) {
  if (e.key === 'delegations') {
    setTimeout(() => {
      initializeAdminDelegationSection();
      if (hasAdminDelegationAccess) {
        loadAdminDelegations();
      }
    }, 100);
  }
});

// Add delegation-specific CSS
const employeeDelegationsStyles = document.createElement('style');
employeeDelegationsStyles.textContent = `
  .delegation-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
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
  
  .delegation-pending {
    border-left: 4px solid #f59e0b;
    background: linear-gradient(to right, #fffbeb, white);
  }
  
  .delegation-rejected {
    border-left: 4px solid #6b7280;
    background: linear-gradient(to right, #f9fafb, white);
  }
  
  .delegation-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
  }
  
  .delegation-info {
    flex: 1;
  }
  
  .delegation-title {
    color: #2B6CB0;
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
  }
  
  .delegation-reference {
    color: #6b7280;
    font-size: 14px;
    margin-bottom: 4px;
  }
  
  .delegation-dates {
    color: #374151;
    font-size: 14px;
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
  .status-expired { background: #fecaca; color: #7f1d1d; }
  
  .delegation-details {
    margin-bottom: 15px;
    padding: 15px;
    background: #f9fafb;
    border-radius: 8px;
  }
  
  .delegation-scope,
  .delegation-to,
  .delegation-limitations {
    margin-bottom: 10px;
  }
  
  .delegation-scope p,
  .delegation-limitations p {
    margin: 5px 0 0 0;
    color: #6b7280;
    line-height: 1.5;
  }
  
  .delegation-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  
  .view-controls {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    align-items: center;
    flex-wrap: wrap;
  }
  
  .view-btn {
    padding: 8px 16px;
    border: 1px solid #e5e7eb;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .view-btn.active,
  .view-btn:hover {
    background: #2B6CB0;
    color: white;
    border-color: #2B6CB0;
  }
  
  .delegation-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .stat-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    text-align: center;
  }
  
  .stat-number {
    font-size: 2em;
    font-weight: bold;
    color: #2B6CB0;
    margin-bottom: 5px;
  }
  
  .stat-label {
    color: #6b7280;
    font-size: 14px;
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
  
  .empty-state h3 {
    color: #374151;
    margin-bottom: 10px;
  }
  
  .empty-state p {
    color: #6b7280;
    margin-bottom: 20px;
  }
`;
document.head.appendChild(employeeDelegationsStyles);