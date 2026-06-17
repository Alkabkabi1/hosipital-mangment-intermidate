// Employee Approvals JavaScript
// Handles employee approvals and workflow management

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  if (!requireAuth()) return;

  const user = apiClient.getCurrentUser();
  
  // Check if user has approval permissions
  if (!hasApprovalPermissions(user)) {
    showError('ليس لديك صلاحية للوصول إلى صفحة الموافقات');
    setTimeout(() => {
      window.location.href = 'employee-dashboard.html';
    }, 2000);
    return;
  }

  // Initialize page
  loadApprovals();
  setupEventListeners();
  setupFilters();
});

let currentApprovals = [];
let currentFilter = 'all';

function hasApprovalPermissions(user) {
  // Users with admin, hr, or manager roles can approve
  return ['admin', 'hr', 'manager'].includes(user.role);
}

function setupEventListeners() {
  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadApprovals();
      showSuccess('تم تحديث البيانات');
    });
  }

  // Bulk approval buttons
  const approveAllBtn = document.getElementById('approveAllBtn');
  const rejectAllBtn = document.getElementById('rejectAllBtn');
  
  if (approveAllBtn) {
    approveAllBtn.addEventListener('click', handleBulkApproval);
  }
  
  if (rejectAllBtn) {
    rejectAllBtn.addEventListener('click', handleBulkRejection);
  }

  // Select all checkbox
  const selectAllCheckbox = document.getElementById('selectAll');
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', handleSelectAll);
  }
}

function setupFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      // Update active filter button
      filterButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      currentFilter = this.dataset.filter;
      filterApprovals();
    });
  });

  const typeFilter = document.getElementById('typeFilter');
  if (typeFilter) {
    typeFilter.addEventListener('change', filterApprovals);
  }

  const urgencyFilter = document.getElementById('urgencyFilter');
  if (urgencyFilter) {
    urgencyFilter.addEventListener('change', filterApprovals);
  }
}

async function loadApprovals() {
  try {
    LoadingUtils.showPageLoading();
    
    // Load different types of approvals
    const [clearances, onboardings, delegations] = await Promise.all([
      loadPendingClearances(),
      loadPendingOnboardings(), 
      loadPendingDelegations()
    ]);

    // Combine all approvals
    currentApprovals = [
      ...clearances.map(item => ({ ...item, type: 'clearance', type_ar: 'إخلاء طرف' })),
      ...onboardings.map(item => ({ ...item, type: 'onboarding', type_ar: 'مباشرة عمل' })),
      ...delegations.map(item => ({ ...item, type: 'delegation', type_ar: 'تفويض' }))
    ];

    // Sort by urgency and date
    currentApprovals.sort((a, b) => {
      // First by urgency
      const urgencyA = getUrgencyLevel(a);
      const urgencyB = getUrgencyLevel(b);
      if (urgencyA !== urgencyB) return urgencyB - urgencyA;
      
      // Then by date (oldest first for urgent items)
      return new Date(a.request_date) - new Date(b.request_date);
    });

    displayApprovals(currentApprovals);
    updateStatistics();
    
  } catch (error) {
    console.error('Approvals loading error:', error);
    showError('حدث خطأ في تحميل الموافقات');
  } finally {
    LoadingUtils.hidePageLoading();
  }
}

// Enhanced commissioner-aware loading functions
async function loadPendingClearances() {
  try {
    // Try API first, fallback to localStorage
    const apiData = await apiClient.makeRequest('/clearance/admin/pending');
    return apiData;
  } catch (error) {
    console.warn('API not available, loading from localStorage');
    return JSON.parse(localStorage.getItem('requestsClearance') || '[]')
      .filter(r => r.status === 'قيد الاعتماد');
  }
}

async function loadPendingOnboardings() {
  try {
    // Try API first, fallback to localStorage
    const apiData = await apiClient.makeRequest('/onboarding/admin/pending');
    return apiData;
  } catch (error) {
    console.warn('API not available, loading from localStorage');
    return JSON.parse(localStorage.getItem('requestsOnboarding') || '[]')
      .filter(r => r.status === 'قيد الاعتماد');
  }
}

async function loadPendingDelegations() {
  try {
    // Try API first, fallback to localStorage
    const apiData = await apiClient.makeRequest('/delegation/admin/pending');
    return apiData;
  } catch (error) {
    console.warn('API not available, loading from localStorage');
    return JSON.parse(localStorage.getItem('delegations') || '[]')
      .filter(r => r.status === 'pending');
  }
}

function displayApprovals(approvals) {
  const approvalsContainer = document.getElementById('approvalsContainer');
  if (!approvalsContainer) return;

  if (approvals.length === 0) {
    approvalsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✅</div>
        <h3>لا توجد موافقات معلقة</h3>
        <p>جميع الطلبات تمت معالجتها</p>
      </div>
    `;
    return;
  }

  const approvalsHTML = approvals.map(approval => `
    <div class="approval-card ${getUrgencyClass(approval)}" data-type="${approval.type}" data-id="${approval.id}">
      <div class="approval-header">
        <div class="approval-checkbox">
          <input type="checkbox" class="approval-select" data-type="${approval.type}" data-id="${approval.id}">
        </div>
        
        <div class="approval-info">
          <div class="approval-type">${approval.type_ar}</div>
          <div class="approval-reference">#${approval.reference_number}</div>
          <div class="approval-employee">${approval.employee_name || 'غير محدد'}</div>
        </div>
        
        <div class="approval-urgency">
          ${getUrgencyBadge(approval)}
        </div>
      </div>
      
      <div class="approval-details">
        <div class="detail-row">
          <span class="label">تاريخ الطلب:</span>
          <span class="value">${DateUtils.formatDate(approval.request_date)}</span>
        </div>
        
        ${approval.effective_date ? `
          <div class="detail-row">
            <span class="label">تاريخ السريان:</span>
            <span class="value">${DateUtils.formatDate(approval.effective_date)}</span>
          </div>
        ` : ''}
        
        ${approval.start_date ? `
          <div class="detail-row">
            <span class="label">تاريخ البداية:</span>
            <span class="value">${DateUtils.formatDate(approval.start_date)}</span>
          </div>
        ` : ''}
        
        <div class="detail-row">
          <span class="label">عمر الطلب:</span>
          <span class="value">${getRequestAge(approval.request_date)}</span>
        </div>
      </div>
      
      <div class="approval-actions">
        <button class="btn btn-success" onclick="approveRequest('${approval.type}', ${approval.id})">
          موافقة
        </button>
        <button class="btn btn-danger" onclick="rejectRequest('${approval.type}', ${approval.id})">
          رفض
        </button>
        <button class="btn btn-info" onclick="viewRequestDetails('${approval.type}', ${approval.id})">
          عرض التفاصيل
        </button>
        <button class="btn btn-secondary" onclick="addComment('${approval.type}', ${approval.id})">
          إضافة تعليق
        </button>
      </div>
    </div>
  `).join('');

  approvalsContainer.innerHTML = approvalsHTML;
}

function filterApprovals() {
  const typeFilter = document.getElementById('typeFilter');
  const urgencyFilter = document.getElementById('urgencyFilter');
  
  let filteredApprovals = [...currentApprovals];

  // Filter by status
  if (currentFilter !== 'all') {
    filteredApprovals = filteredApprovals.filter(approval => {
      switch (currentFilter) {
        case 'urgent':
          return getUrgencyLevel(approval) >= 3;
        case 'normal':
          return getUrgencyLevel(approval) < 3;
        case 'old':
          return DateUtils.getDaysDifference(approval.request_date, DateUtils.getToday()) > 7;
        default:
          return true;
      }
    });
  }

  // Filter by type
  if (typeFilter && typeFilter.value) {
    filteredApprovals = filteredApprovals.filter(approval => approval.type === typeFilter.value);
  }

  // Filter by urgency
  if (urgencyFilter && urgencyFilter.value) {
    const urgencyLevel = parseInt(urgencyFilter.value);
    filteredApprovals = filteredApprovals.filter(approval => getUrgencyLevel(approval) === urgencyLevel);
  }

  displayApprovals(filteredApprovals);
}

function getUrgencyLevel(approval) {
  const daysSinceRequest = DateUtils.getDaysDifference(approval.request_date, DateUtils.getToday());
  
  // High urgency for clearances (resignation)
  if (approval.type === 'clearance') {
    if (daysSinceRequest > 14) return 4; // Critical
    if (daysSinceRequest > 7) return 3;  // High
    return 2; // Medium
  }
  
  // Medium urgency for onboarding
  if (approval.type === 'onboarding') {
    if (daysSinceRequest > 21) return 3; // High
    if (daysSinceRequest > 10) return 2; // Medium
    return 1; // Low
  }
  
  // Variable urgency for delegations
  if (approval.type === 'delegation') {
    if (daysSinceRequest > 30) return 3; // High
    if (daysSinceRequest > 14) return 2; // Medium
    return 1; // Low
  }
  
  return 1; // Default low
}

function getUrgencyClass(approval) {
  const level = getUrgencyLevel(approval);
  const classes = ['', 'low-urgency', 'medium-urgency', 'high-urgency', 'critical-urgency'];
  return classes[level] || '';
}

function getUrgencyBadge(approval) {
  const level = getUrgencyLevel(approval);
  const badges = {
    1: '<span class="urgency-badge low">عادي</span>',
    2: '<span class="urgency-badge medium">متوسط</span>',
    3: '<span class="urgency-badge high">عاجل</span>',
    4: '<span class="urgency-badge critical">حرج</span>'
  };
  return badges[level] || badges[1];
}

function getRequestAge(requestDate) {
  const days = DateUtils.getDaysDifference(requestDate, DateUtils.getToday());
  
  if (days === 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 7) return `${days} أيام`;
  if (days < 30) return `${Math.floor(days / 7)} أسابيع`;
  return `${Math.floor(days / 30)} شهور`;
}

async function approveRequest(type, id) {
  if (!confirm('هل أنت متأكد من الموافقة على هذا الطلب؟')) {
    return;
  }

  try {
    await apiClient.makeRequest(`/${type}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'موافق عليه' })
    });
    
    showSuccess('تم الموافقة على الطلب بنجاح');
    loadApprovals(); // Refresh the list
    
  } catch (error) {
    console.error('Approval error:', error);
    showError('حدث خطأ في الموافقة على الطلب');
  }
}

async function rejectRequest(type, id) {
  // Show rejection reason modal
  const reason = await showRejectModal();
  if (!reason) return;

  try {
    await apiClient.makeRequest(`/${type}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ 
        status: 'مرفوض',
        rejection_reason: reason 
      })
    });
    
    showSuccess('تم رفض الطلب');
    loadApprovals(); // Refresh the list
    
  } catch (error) {
    console.error('Rejection error:', error);
    showError('حدث خطأ في رفض الطلب');
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
            <h4>أسباب شائعة:</h4>
            <div class="reason-buttons">
              <button type="button" class="reason-btn" onclick="document.getElementById('rejectionReason').value = this.textContent">
                نقص في الوثائق المطلوبة
              </button>
              <button type="button" class="reason-btn" onclick="document.getElementById('rejectionReason').value = this.textContent">
                عدم استيفاء الشروط
              </button>
              <button type="button" class="reason-btn" onclick="document.getElementById('rejectionReason').value = this.textContent">
                خطأ في البيانات المدخلة
              </button>
              <button type="button" class="reason-btn" onclick="document.getElementById('rejectionReason').value = this.textContent">
                يتطلب موافقة إضافية
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

function viewRequestDetails(type, id) {
  // Admin detail pages for approval context (approvers see admin views)
  const detailPages = {
    clearance: 'admin-clearance-detail.html',
    onboarding: 'admin-direct-detail.html',
    delegation: 'admin-delegation-detail.html'
  };
  
  const page = detailPages[type];
  if (page) {
    window.location.href = `${page}?id=${id}`;
  } else {
    console.warn('⚠️ No detail page found for type:', type);
  }
}

function addComment(type, id) {
  showInfo('إضافة التعليقات ستكون متاحة قريباً');
}

function handleSelectAll(e) {
  const checkboxes = document.querySelectorAll('.approval-select');
  checkboxes.forEach(checkbox => {
    checkbox.checked = e.target.checked;
  });
  
  updateBulkButtons();
}

function updateBulkButtons() {
  const selectedCheckboxes = document.querySelectorAll('.approval-select:checked');
  const approveAllBtn = document.getElementById('approveAllBtn');
  const rejectAllBtn = document.getElementById('rejectAllBtn');
  
  const hasSelection = selectedCheckboxes.length > 0;
  
  if (approveAllBtn) {
    approveAllBtn.disabled = !hasSelection;
    approveAllBtn.textContent = `موافقة (${selectedCheckboxes.length})`;
  }
  
  if (rejectAllBtn) {
    rejectAllBtn.disabled = !hasSelection;
    rejectAllBtn.textContent = `رفض (${selectedCheckboxes.length})`;
  }
}

async function handleBulkApproval() {
  const selectedCheckboxes = document.querySelectorAll('.approval-select:checked');
  if (selectedCheckboxes.length === 0) return;
  
  if (!confirm(`هل أنت متأكد من الموافقة على ${selectedCheckboxes.length} طلب؟`)) {
    return;
  }
  
  LoadingUtils.showPageLoading();
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const checkbox of selectedCheckboxes) {
    const type = checkbox.dataset.type;
    const id = checkbox.dataset.id;
    
    try {
      await apiClient.makeRequest(`/${type}/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'موافق عليه' })
      });
      successCount++;
    } catch (error) {
      console.error('Bulk approval error:', error);
      errorCount++;
    }
  }
  
  LoadingUtils.hidePageLoading();
  
  if (errorCount === 0) {
    showSuccess(`تم الموافقة على جميع الطلبات (${successCount} طلب)`);
  } else {
    showError(`تم الموافقة على ${successCount} طلب، فشل في ${errorCount} طلب`);
  }
  
  loadApprovals();
}

async function handleBulkRejection() {
  const selectedCheckboxes = document.querySelectorAll('.approval-select:checked');
  if (selectedCheckboxes.length === 0) return;
  
  const reason = await showRejectModal();
  if (!reason) return;
  
  LoadingUtils.showPageLoading();
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const checkbox of selectedCheckboxes) {
    const type = checkbox.dataset.type;
    const id = checkbox.dataset.id;
    
    try {
      await apiClient.makeRequest(`/${type}/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          status: 'مرفوض',
          rejection_reason: reason 
        })
      });
      successCount++;
    } catch (error) {
      console.error('Bulk rejection error:', error);
      errorCount++;
    }
  }
  
  LoadingUtils.hidePageLoading();
  
  if (errorCount === 0) {
    showSuccess(`تم رفض جميع الطلبات (${successCount} طلب)`);
  } else {
    showError(`تم رفض ${successCount} طلب، فشل في ${errorCount} طلب`);
  }
  
  loadApprovals();
}

function updateStatistics() {
  const stats = {
    total: currentApprovals.length,
    urgent: currentApprovals.filter(a => getUrgencyLevel(a) >= 3).length,
    clearance: currentApprovals.filter(a => a.type === 'clearance').length,
    onboarding: currentApprovals.filter(a => a.type === 'onboarding').length,
    delegation: currentApprovals.filter(a => a.type === 'delegation').length
  };

  // Update statistics cards
  const statElements = {
    totalApprovals: document.getElementById('totalApprovals'),
    urgentApprovals: document.getElementById('urgentApprovals'),
    clearanceApprovals: document.getElementById('clearanceApprovals'),
    onboardingApprovals: document.getElementById('onboardingApprovals')
  };

  Object.keys(statElements).forEach(key => {
    const element = statElements[key];
    const statKey = key.replace('Approvals', '').toLowerCase();
    if (element && stats[statKey] !== undefined) {
      element.textContent = stats[statKey];
    }
  });
}

// Add approval-specific CSS
const style = document.createElement('style');
style.textContent = `
  .approval-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 15px;
    transition: all 0.3s;
  }
  
  .approval-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
  
  .high-urgency {
    border-left: 4px solid #f59e0b;
  }
  
  .critical-urgency {
    border-left: 4px solid #ef4444;
    background: #fef2f2;
  }
  
  .approval-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
  }
  
  .approval-info {
    flex: 1;
  }
  
  .approval-type {
    font-weight: 600;
    color: #2B6CB0;
    font-size: 16px;
  }
  
  .approval-reference {
    color: #6b7280;
    font-size: 14px;
    margin: 2px 0;
  }
  
  .approval-employee {
    color: #374151;
    font-size: 14px;
  }
  
  .urgency-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .urgency-badge.low { background: #d1fae5; color: #065f46; }
  .urgency-badge.medium { background: #fef3c7; color: #92400e; }
  .urgency-badge.high { background: #fed7aa; color: #9a3412; }
  .urgency-badge.critical { background: #fee2e2; color: #991b1b; }
  
  .approval-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
    margin-bottom: 15px;
    padding: 15px;
    background: #f9fafb;
    border-radius: 8px;
  }
  
  .detail-row {
    display: flex;
    justify-content: space-between;
  }
  
  .detail-row .label {
    font-weight: 600;
    color: #374151;
  }
  
  .detail-row .value {
    color: #6b7280;
  }
  
  .approval-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  
  .filter-controls {
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
  
  .filter-btn {
    padding: 8px 16px;
    border: 1px solid #e5e7eb;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .filter-btn.active,
  .filter-btn:hover {
    background: #2B6CB0;
    color: white;
    border-color: #2B6CB0;
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

// Stage-E: decorate approvals with sync chips (if any locally queued)
(function(){
  function findByIdAcrossKeys(id){
    const toList = (k)=>{ try { return JSON.parse(localStorage.getItem(k)||'[]'); } catch(_) { return []; } };
    const keys = ['requestsClearance','requestsOnboarding','requestsDelegation'];
    for (const k of keys){
      const arr = toList(k);
      const item = arr.find(x => String(x.id)===String(id) || String(x.optimisticId)===String(id));
      if (item) return { item, key: k };
    }
    return null;
  }
  function decorate(){
    document.querySelectorAll('.approval-card').forEach(card => {
      const head = card.querySelector('.approval-header');
      if (!head || head.querySelector('.sync-chip')) return;
      const ref = card.querySelector('.approval-reference');
      if (!ref) return;
      const m = ref.textContent.match(/#([A-Za-z0-9_-]+)/);
      if (!m) return;
      const id = m[1];
      const found = findByIdAcrossKeys(id);
      if (!found) return;
      const { item } = found;
      if (item.syncFailed) {
        const chip = document.createElement('span');
        chip.className = 'sync-chip failed';
        chip.title = 'فشل الإرسال — إعادة المحاولة';
        chip.textContent = '⚠️';
        chip.style.marginInlineStart = '8px';
        chip.addEventListener('click', (e)=>{ e.stopPropagation(); window.retrySync && window.retrySync(item.optimisticId || item.id); });
        head.appendChild(chip);
      } else if (item.syncing) {
        const chip = document.createElement('span');
        chip.className = 'sync-chip pending';
        chip.title = 'جاري المزامنة';
        chip.textContent = '⏳';
        chip.style.marginInlineStart = '8px';
        head.appendChild(chip);
      }
    });
  }
  window.addEventListener('sync:updated', ()=> setTimeout(decorate, 50));
  window.addEventListener('sync:failed',  ()=> setTimeout(decorate, 50));
  window.addEventListener('storage',      ()=> setTimeout(decorate, 50));
  setInterval(decorate, 1500);
})();

// Stage-E: Minimal chip styles (fallback)
(function(){
  if (document.getElementById('sync-chip-styles-approvals')) return;
  const st = document.createElement('style');
  st.id = 'sync-chip-styles-approvals';
  st.textContent = `.sync-chip{font-size:11px;padding:2px 6px;border-radius:8px;margin-inline-start:6px}.sync-chip.pending{background:#fff7ed;color:#92400e}.sync-chip.failed{background:#fee2e2;color:#991b1b}`;
  document.head.appendChild(st);
})();

// Enhanced commissioner integration
function initializeCommissionerIntegration() {
  if (!window.CommissionerManager) {
    console.warn('CommissionerManager not available');
    return;
  }
  
  // Check if user has commissioner status
  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  if (!authUser) return;
  
  const userEmail = authUser.email?.toLowerCase();
  const commissionerStatus = window.CommissionerManager.getUserCommissionerStatus(userEmail);
  
  console.log('Commissioner integration - User:', userEmail, 'Status:', commissionerStatus);
  
  if (commissionerStatus.isCommissioner) {
    // User is a commissioner, enhance the approval system
    enhanceApprovalSystemForCommissioner(commissionerStatus);
  }
}

function enhanceApprovalSystemForCommissioner(commissionerStatus) {
  console.log('Enhancing approval system for commissioner with permissions:', commissionerStatus.commissioner?.permissions);
  
  // Monitor for delegation acceptance
  monitorDelegationAcceptance();
  
  // Update load function to include commissioner requests
  const originalLoadApprovals = window.loadApprovals;
  if (originalLoadApprovals) {
    window.loadApprovals = async function() {
      try {
        LoadingUtils.showPageLoading();
        
        // Load commissioner-specific requests
        const commissionerRequests = await loadCommissionerRequests(commissionerStatus);
        
        // Combine with regular approvals if any
        currentApprovals = [
          ...commissionerRequests
        ];

        displayApprovals(currentApprovals);
        updateStatistics();
        
      } catch (error) {
        console.error('Enhanced approvals loading error:', error);
        showError('حدث خطأ في تحميل الموافقات');
      } finally {
        LoadingUtils.hidePageLoading();
      }
    };
  }
}

async function loadCommissionerRequests(commissionerStatus) {
  const permissions = commissionerStatus.commissioner?.permissions || [];
  let allRequests = [];
  
  // Load clearance requests if commissioner has clearance permission
  if (permissions.includes('clearance')) {
    const clearanceRequests = await loadPendingClearances();
    allRequests = allRequests.concat(
      clearanceRequests.map(r => ({ ...r, type: 'clearance', type_ar: 'إخلاء طرف' }))
    );
  }
  
  // Load onboarding requests if commissioner has onboarding permission
  if (permissions.includes('onboarding') || permissions.includes('direct')) {
    const onboardingRequests = await loadPendingOnboardings();
    allRequests = allRequests.concat(
      onboardingRequests.map(r => ({ ...r, type: 'onboarding', type_ar: 'مباشرة عمل' }))
    );
  }
  
  console.log('Loaded commissioner requests:', allRequests.length);
  return allRequests;
}

function monitorDelegationAcceptance() {
  // Monitor for delegation changes
  window.addEventListener('storage', function(e) {
    if (e.key === 'delegations') {
      setTimeout(() => {
        const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
        if (!authUser || !window.CommissionerManager) return;
        
        const userEmail = authUser.email?.toLowerCase();
        const newStatus = window.CommissionerManager.getUserCommissionerStatus(userEmail);
        
        if (newStatus.isCommissioner) {
          console.log('Delegation accepted, user is now a commissioner');
          showSuccess('تم قبول التفويض. يمكنك الآن رؤية الطلبات المفوضة لك.');
          
          // Reload approvals with commissioner permissions
          if (typeof loadApprovals === 'function') {
            loadApprovals();
          }
        }
      }, 100);
    }
  });
}

// Initialize commissioner integration on page load
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    initializeCommissionerIntegration();
  }, 500);
});

// Add event listener for checkbox changes
document.addEventListener('change', function(e) {
  if (e.target.classList.contains('approval-select')) {
    updateBulkButtons();
  }
});
