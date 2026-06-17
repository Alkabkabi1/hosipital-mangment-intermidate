// Admin Dashboard JavaScript
// Handles admin dashboard functionality

// ===== حالات موحدة بين الخلفية والواجهة =====
const PENDING_STATUSES = ['قيد الاعتماد','قيد الانتظار','قيد المراجعة'];
const APPROVED_STATUS = 'مكتمل';
const REJECTED_STATUS = 'مرفوض';
const PENDING_SET = new Set(PENDING_STATUSES);

function normalizeRequest(r, typeGuess) {
  const type      = r.type || typeGuess || (r._kind==='إخلاء طرف' ? 'clearance' : 'onboarding');
  const createdAt = r.createdAt ?? r.created_at ?? r.request_date ?? r.date ?? Date.now();
  const status    = r.status ?? r.current_status ?? 'قيد الاعتماد';

  const employee = r.employee || r.createdBy || {
    name:       r.employee_name   ?? r.name   ?? null,
    email:      r.employee_email  ?? r.email  ?? null,
    department: r.department_name ?? r.department ?? r.dept ?? null
  };

  const approvers = Array.isArray(r.approvers) ? r.approvers : (r.approvals || []);

  // Enhanced type name mapping for all 11 request types
  const typeNameMap = {
    'clearance': 'إخلاء طرف',
    'onboarding': 'مباشرة عمل',
    'delegation': 'تفويض',
    'certificate': 'شهادة تعريف',
    'experience': 'شهادة خبرة',
    'exit': 'إنهاء العمل',
    'assignment': 'تكليف',
    'assignment_termination': 'إنهاء تكليف',
    'internal_transfer': 'نقل داخلي',
    'maternity_leave': 'إجازة أمومة',
    'housing_allowance': 'بدل سكن'
  };

  return {
    id: (r.id ?? r.reference_number ?? r.reference ?? r.ref ?? r.reqNo ?? '').toString(),
    reference_number: r.reference_number ?? r.reference ?? r.ref ?? r.reqNo ?? r.id ?? '',
    type,
    _kind: typeNameMap[type] || 'مباشرة عمل',
    status,
    createdAt,
    employee,
    approvers
  };
}

function kpiUpdateFromRequests(all) {
  console.log('🔍 KPI Update: Processing', all.length, 'requests');
  
  const isToday = (d) => { const x=new Date(d), n=new Date(); return x.getFullYear()===n.getFullYear() && x.getMonth()===n.getMonth() && x.getDate()===n.getDate(); };
  const isOverdue = (r) => {
    const cur = (r.approvers||[]).find(a=>a.status==='قيد الاعتماد');
    const due = cur?.dueAt && new Date(cur.dueAt);
    return due && !isNaN(+due) && Date.now() > +due && r.status!=='مكتمل';
  };

  // FIX: Show ALL pending requests, not just today's
  const directPending    = all.filter(r => r.type!=='clearance' && r.type!=='delegation' && r.type!=='certificate' && r.type!=='experience' && PENDING_SET.has(r.status) && !r.syncFailed).length;
  const clearancePending = all.filter(r => r.type==='clearance'  && PENDING_SET.has(r.status) && !r.syncFailed).length;
  const clearanceOver    = all.filter(r => r.type==='clearance'  && !r.syncFailed && isOverdue(r)).length;

  // Also get delegation, certificate, and experience counts from the same data source
  const delegationPending = all.filter(r => r.type==='delegation' && PENDING_SET.has(r.status) && !r.syncFailed).length;
  const certificatePending = all.filter(r => r.type==='certificate' && (PENDING_SET.has(r.status) || r.status === 'pending') && !r.syncFailed).length;
  const experiencePending = all.filter(r => r.type==='experience' && (PENDING_SET.has(r.status) || r.status === 'pending') && !r.syncFailed).length;

  console.log('🔍 KPI Counts:', {
    directPending,
    clearancePending, 
    clearanceOver,
    delegationPending,
    certificatePending,
    experiencePending
  });

  const set = (id,val)=>{ const el=document.getElementById(id); if(el) el.textContent = String(val); };
  set('kpi-direct-today',         directPending);
  set('kpi-clearance-today',      clearancePending);
  set('kpi-certificates-pending', certificatePending);
  set('kpi-leaves-pending',       0); // TODO: Add leave counting
  
  // Load job descriptions count separately
  loadJobDescriptionsCount();
}

async function loadJobDescriptionsCount() {
  try {
    const response = await apiClient.makeRequest('/admin/job-descriptions/pending');
    const pending = response.data || response || [];
    const set = (id,val)=>{ const el=document.getElementById(id); if(el) el.textContent = String(val); };
    set('kpi-job-descriptions-pending', pending.length);
  } catch (error) {
    console.error('Error loading job descriptions count:', error);
  }
}

function renderTableRows(requests) {
  const tbody = document.getElementById('last-rows');
  if (!tbody) return false; // لا يوجد جدول، نرجع false

  const rows = requests.slice(0,10);
  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted)">لا توجد بيانات</td></tr>';
    return true;
  }

  const safeDate = (d)=>{ const dt=new Date(d); return isNaN(+dt)?'-':dt.toLocaleDateString('ar-SA'); };
  const badge = (s)=> s==='مكتمل' ? 's-done' : (s==='مرفوض' ? 's-rejected' : 's-pending');

  tbody.innerHTML = rows.map(r => {
    const cur = (r.approvers||[]).find(a=>a.status==='قيد الاعتماد');
    const curName = cur ? ((cur.name||'-') + (cur.role ? ` (${cur.role})` : '')) : '-';
    const empName = r.employee?.name || r.employee?.email || 'غير محدد';
    const dept    = r.employee?.department || 'غير محدد';
    return `
      <tr>
        <td>${r.id}</td>
        <td><span class="chip">${r._kind}</span></td>
        <td><span class="status ${badge(r.status)}">${r.status}</span></td>
        <td>${curName}</td>
        <td>${cur?.dueAt ? '—' : '-'}</td>
        <td>${empName}</td>
        <td>${dept}</td>
        <td>${safeDate(r.createdAt)}</td>
        <td>
          <button class="btn-link" onclick="viewAdminRequest('${r.type}', '${r.id}')" style="margin-left: 5px;">عرض</button>
          <button class="btn-link" data-action="delete-request" data-kind="${r._kind}" data-id="${r.id}" style="color: #dc2626;">حذف</button>
        </td>
      </tr>`;
  }).join('');
  return true;
}

document.addEventListener('DOMContentLoaded', function() {
  // Wait for all dependencies before initializing
  if (typeof window.waitForDependencies === 'function') {
    window.waitForDependencies(() => {
      initializeAdminDashboard();
    }, ['apiClient', 'NotificationStore', 'resolveFrontendPath']);
  } else {
    // Fallback if dependency guard not available
    console.warn('⚠️ Dependency guard not available, initializing immediately');
    setTimeout(initializeAdminDashboard, 1000);
  }
});

function initializeAdminDashboard() {
  try {
    // Check authentication and admin role
    if (!requireAuth()) return;

    const user = apiClient.getCurrentUser();
    
    // Check if user is admin
    if (user.role !== 'admin') {
      window.location.href = window.resolveFrontendPath('employee-dashboard.html');
      return;
    }

    console.log('✅ Initializing admin dashboard for user:', user.name);

    // Initialize dashboard
    initializeDashboard();
    loadDashboardData();
    setupEventListeners();
    setupAdminEventHandlers();
    
  } catch (error) {
    console.error('❌ Error initializing admin dashboard:', error);
    if (window.handleApiError) {
      window.handleApiError(error, 'تهيئة لوحة الإدارة');
    }
  }
}

function setupAdminEventHandlers() {
  // تفويض أحداث للأزرار
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const { action, href, id, kind } = el.dataset;

    if (action === 'mark-all-read') {
      if (window.markAllNotificationsRead) {
        window.markAllNotificationsRead();
        const list = document.getElementById('notif-list');
        if (list) list.dispatchEvent(new Event('refresh'));
      } else {
        console.warn('⚠️ markAllNotificationsRead not available');
      }
    }
    if (action === 'logout') {
      // Handle logout action
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken'); 
      localStorage.removeItem('refreshToken');
      console.log('🔄 Admin logout: Auth data cleared, redirecting to login...');
      window.location.href = window.resolveFrontendPath ? window.resolveFrontendPath('login.html') : 'login.html';
    }
    if (action === 'view-admin-details' && id) {
      if (kind === 'إخلاء طرف') window.location.href = `admin-clearance-detail.html?id=${id}`;
      else                       window.location.href = `admin-direct-detail.html?id=${id}`;
    }
    if (action === 'delete-request' && id) {
      deleteRequest(id, kind);
    }
    if (action === 'navigate' && href) window.location.href = href;
  });

  // تحديث تلقائي عند تغيّر التخزين (للتحديث الفوري بعد الاعتماد/الرفض)
  window.addEventListener('storage', (e) => {
    if (['requestsOnboarding','requestsClearance','requestsDirect','delegations'].includes(e.key)) {
      console.log(`🔄 Storage changed for ${e.key}, refreshing dashboard...`);
      // أعد تحميل البيانات بدون تغيير التصميم
      loadFromLocalStorage();
    }
  });
}

function initializeDashboard() {
  const user = apiClient.getCurrentUser();
  
  // Update user info in header
  const userNameElement = document.getElementById('userName');
  const userRoleElement = document.getElementById('userRole');
  
  if (userNameElement) userNameElement.textContent = user.name;
  if (userRoleElement) userRoleElement.textContent = 'مدير النظام';
  
  // Update welcome message
  const welcomeElement = document.getElementById('welcomeMessage');
  if (welcomeElement) {
    welcomeElement.textContent = `مرحباً ${user.name} - لوحة تحكم المدير`;
  }
}

async function loadDashboardData() {
  try {
    showLoadingState();
    
    console.log('🔄 Loading admin dashboard data from DATABASE...');
    
    // Try API first (should work now with fixed SQL)
    try {
      const [systemStats, recentRequests, requestsSummary, myPendingApprovals] = await Promise.all([
        apiClient.makeRequest('/admin/stats').catch(() => null),
        apiClient.getAdminRecentPending(10).catch(() => []),
        apiClient.getAdminSummary().catch(() => null),
        apiClient.makeRequest('/approvals/pending').catch(() => []) // NEW: Get approvals waiting for ME
      ]);

      console.log('✅ Admin API data loaded:', {
        systemStats: systemStats ? 'Available' : 'Failed',
        recentRequests: recentRequests.length,
        requestsSummary: requestsSummary ? 'Available' : 'Failed',
        myPendingApprovals: myPendingApprovals,
        myPendingApprovalsCount: (myPendingApprovals?.data || myPendingApprovals || []).length
      });

      // Store data globally for modal access
      window.adminDashboardData = { recentRequests, systemStats, requestsSummary, myPendingApprovals };

      // Convert pending approvals to request format for main table
      const pendingAsRequests = (myPendingApprovals?.data || myPendingApprovals || []).map(approval => ({
        id: approval.request_id,
        type: approval.request_type,
        reference_number: approval.reference_number || `#${approval.request_id}`,
        status: 'قيد الاعتماد',
        employee: {
          name: approval.request_owner_name || 'غير محدد'
        },
        createdAt: approval.created_at || new Date().toISOString(),
        approvers: [],
        _kind: approval.request_type === 'onboarding' ? 'مباشرة عمل' :
               approval.request_type === 'clearance' ? 'إخلاء طرف' :
               approval.request_type === 'delegation' ? 'تفويض' : approval.request_type
      }));
      
      // Combine: recent requests + pending approvals (remove duplicates)
      const allRequestsMap = new Map();
      
      // Add recent requests
      (recentRequests || []).forEach(req => {
        const key = `${req.type}-${req.id}`;
        allRequestsMap.set(key, req);
      });
      
      // Add pending approvals (will overwrite if duplicate)
      pendingAsRequests.forEach(req => {
        const key = `${req.type}-${req.id}`;
        allRequestsMap.set(key, req);
      });
      
      const allRequests = Array.from(allRequestsMap.values());
      console.log('📊 Combined requests:', {
        recent: recentRequests.length,
        pending: pendingAsRequests.length,
        total: allRequests.length
      });
      
      // If API data is available, use it
      if (systemStats || allRequests.length > 0 || requestsSummary) {
        updateSystemStatistics(systemStats);
        updateRequestsSummary(requestsSummary);
        // Filter out completed and rejected requests for dashboard display
        const COMPLETED_STATUSES = ['مكتمل', 'completed', 'approved', 'موافق عليه'];
        const REJECTED_STATUSES = ['مرفوض', 'rejected'];
        
        const pendingOnlyRequests = allRequests.filter(request => {
          const status = (request.status || '').toLowerCase();
          const isCompleted = COMPLETED_STATUSES.some(completed => status.includes(completed.toLowerCase()));
          const isRejected = REJECTED_STATUSES.some(rejected => status.includes(rejected.toLowerCase()));
          return !isCompleted && !isRejected;
        });

        console.log(`📊 Admin Dashboard filtering: ${allRequests.length} total → ${pendingOnlyRequests.length} pending (hiding completed/rejected)`);
        updateRecentRequests(pendingOnlyRequests); // Show only pending requests
        // Update My Pending Approvals - simplified widget
        updateMyPendingApprovals(myPendingApprovals).catch(err => {
          console.error('❌ Error updating my pending approvals:', err);
        });
        console.log('✅ Admin dashboard updated with DATABASE data');
      } else {
        console.log('⚠️ No data from admin API, falling back to localStorage');
        loadFromLocalStorage();
      }
    } catch (apiError) {
      console.error('❌ Admin API failed, using localStorage:', apiError);
      loadFromLocalStorage();
    }
    
    // Update admin actions
    updateAdminActions();

  } catch (error) {
    console.error('Admin dashboard loading error:', error);
    // Fallback to localStorage even on error
    loadFromLocalStorage();
  } finally {
    hideLoadingState();
  }
}

/**
 * Update "My Pending Approvals" section
 * Shows only requests waiting for the current user's approval
 */
async function updateMyPendingApprovals(pendingApprovalsData) {
  const approvals = pendingApprovalsData?.data || pendingApprovalsData || [];
  const myApprovalsContainer = document.getElementById('myPendingApprovals');
  
  if (!myApprovalsContainer) {
    console.log('⚠️ My pending approvals container not found');
    return;
  }
  
  console.log('🔔 My pending approvals RAW:', approvals);
  console.log('🔔 My pending approvals COUNT:', approvals.length);
  console.log('🔔 My pending approvals TYPE:', typeof approvals, Array.isArray(approvals));
  
  // Debug: Log first approval to see structure
  if (approvals.length > 0) {
    console.log('🔍 First approval structure:', approvals[0]);
    console.log('🔍 First approval keys:', Object.keys(approvals[0]));
    console.log('🔍 First approval request_type:', approvals[0].request_type);
    console.log('🔍 First approval request_id:', approvals[0].request_id);
  }
  
  if (approvals.length === 0) {
    myApprovalsContainer.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--muted);">
        <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
        <div style="font-weight: 600;">لا توجد طلبات معلقة تحتاج موافقتك</div>
        <div style="font-size: 13px; margin-top: 8px;">جميع الطلبات المعينة لك تمت معالجتها</div>
      </div>
    `;
    return;
  }
  
  // Group by request
  const uniqueRequests = new Map();
  approvals.forEach((approval, index) => {
    const key = `${approval.request_type}-${approval.request_id}`;
    console.log(`📋 Processing approval ${index + 1}:`, {
      key,
      type: approval.request_type,
      id: approval.request_id,
      reference: approval.reference_number,
      name: approval.request_owner_name,
      fullApproval: approval
    });
    if (!uniqueRequests.has(key)) {
      uniqueRequests.set(key, approval);
    }
  });
  
  console.log(`✅ Unique requests after grouping: ${uniqueRequests.size}`);
  console.log('📋 Unique request keys:', Array.from(uniqueRequests.keys()));
  
  // Fetch full request details to get reference numbers and employee names
  const enrichedRequests = await Promise.all(
    Array.from(uniqueRequests.values()).map(async (approval) => {
      try {
        let requestData = null;
        if (approval.request_type === 'onboarding') {
          requestData = await apiClient.getOnboardingById(approval.request_id).catch(() => null);
        } else if (approval.request_type === 'clearance') {
          requestData = await apiClient.getClearanceById(approval.request_id).catch(() => null);
        } else if (approval.request_type === 'certificate') {
          requestData = await apiClient.getCertificateById(approval.request_id).catch(() => null);
        }
        
        if (requestData) {
          return {
            ...approval,
            reference_number: requestData.reference_number || requestData.reference || `#${approval.request_id}`,
            employee_name: requestData.employee_name || requestData.employee?.name || approval.request_owner_name || 'غير محدد'
          };
        }
      } catch (e) {
        console.warn(`⚠️ Could not fetch details for ${approval.request_type} ${approval.request_id}:`, e.message);
      }
      
      // Fallback if fetch fails
      return {
        ...approval,
        reference_number: approval.reference_number || `#${approval.request_id}`,
        employee_name: approval.request_owner_name || 'غير محدد'
      };
    })
  );
  
  console.log('✅ Enriched requests:', enrichedRequests.length);
  
  // SIMPLE widget: Just show request + who approved/who's pending
  const htmlContent = enrichedRequests.map((approval, index) => {
    const detailUrl = approval.request_type === 'onboarding' ? 'admin-direct' : 
                     approval.request_type === 'clearance' ? 'admin-clearance' :
                     approval.request_type === 'delegation' ? 'admin-delegation' :
                     approval.request_type === 'certificate' ? 'admin-certificate' :
                     approval.request_type === 'housing_allowance' ? 'admin-housing-allowance' :
                     `admin-${approval.request_type}`;
    
    const typeName = approval.request_type === 'onboarding' ? '📝 مباشرة' :
                     approval.request_type === 'clearance' ? '📋 إخلاء طرف' :
                     approval.request_type === 'delegation' ? '🔄 تفويض' :
                     approval.request_type === 'certificate' ? '📜 شهادة تعريف' :
                     approval.request_type === 'housing_allowance' ? '🏠 بدل سكن' :
                     approval.request_type;

    // Check actual request status to determine display
    const requestStatus = approval.request_status;
    const isCompleted = requestStatus === 'مكتمل' || requestStatus === 'approved';
    const isRejected = requestStatus === 'مرفوض' || requestStatus === 'rejected';

    // Determine border color and status text based on actual request status
    let borderColor = '#ef4444'; // red for pending
    let statusText = '⏳ في انتظارك';
    let statusIcon = '⏳';

    if (isCompleted) {
      borderColor = '#10b981'; // green for completed
      statusText = '✅ مكتمل';
      statusIcon = '✅';
    } else if (isRejected) {
      borderColor = '#f59e0b'; // amber for rejected
      statusText = '❌ مرفوض';
      statusIcon = '❌';
    }

    return `
    <div class="approval-item" style="padding: 10px; border-left: 3px solid ${borderColor}; margin-bottom: 8px; background: #fff; cursor: pointer;"
         onclick="window.location.href='${detailUrl}-detail.html?id=${approval.request_id}'">
      <div style="font-weight: 700; color: #1e293b; margin-bottom: 2px;">
        ${approval.reference_number || `#${approval.request_id}`} - ${typeName}
      </div>
      <div style="font-size: 12px; color: #64748b;">
        ${approval.approved_count || 0}/${approval.total_approvers || 0} موافق - ${statusText}
      </div>
    </div>
  `;
  }).join('');
  
  console.log('🎨 Generated HTML length:', htmlContent.length);
  console.log('🎨 Generated HTML preview:', htmlContent.substring(0, 200));
  console.log('🎨 Container element:', myApprovalsContainer);
  console.log('🎨 Container exists?', !!myApprovalsContainer);
  console.log('🎨 Container parent:', myApprovalsContainer?.parentElement);
  console.log('🎨 Container visible?', myApprovalsContainer?.offsetParent !== null);
  
  if (!myApprovalsContainer) {
    console.error('❌ CRITICAL: myPendingApprovals container not found!');
    return;
  }
  
  // Insert simplified widget directly
  myApprovalsContainer.innerHTML = htmlContent || '<div style="text-align: center; padding: 12px; color: #64748b;">لا توجد طلبات تحتاج موافقتك</div>';
  
  console.log('✅ HTML inserted into container');
  console.log('✅ Container innerHTML length after insert:', myApprovalsContainer.innerHTML.length);
  console.log('✅ First child element:', myApprovalsContainer.firstElementChild);
  console.log('✅ Number of child elements:', myApprovalsContainer.children.length);
  
  // Force a reflow to ensure display
  myApprovalsContainer.offsetHeight;
  
  // Check visibility
  const computedStyle = window.getComputedStyle(myApprovalsContainer);
  console.log('🎨 Container display:', computedStyle.display);
  console.log('🎨 Container visibility:', computedStyle.visibility);
  console.log('🎨 Container height:', computedStyle.height);
  console.log('🎨 Container overflow:', computedStyle.overflow);
  
  // Ensure container is visible
  myApprovalsContainer.style.display = 'block';
  myApprovalsContainer.style.visibility = 'visible';
  
  // Verify the HTML is still there after a brief delay
  setTimeout(() => {
    console.log('🔍 After 500ms - Container innerHTML length:', myApprovalsContainer.innerHTML.length);
    console.log('🔍 After 500ms - Number of children:', myApprovalsContainer.children.length);
    if (myApprovalsContainer.innerHTML.length < 100) {
      console.error('❌ WARNING: HTML was cleared after insertion! Something is overwriting it.');
      // Re-insert if it was cleared
      myApprovalsContainer.innerHTML = htmlContent;
    }
  }, 500);
  
  // Update count badge
  const myApprovalCount = document.getElementById('myApprovalCount');
  if (myApprovalCount) {
    myApprovalCount.textContent = enrichedRequests.length;
    myApprovalCount.style.display = enrichedRequests.length > 0 ? 'inline' : 'none';
  }
}

function loadFromLocalStorage() {
  // Load requests from localStorage
  const clearanceRequests = JSON.parse(localStorage.getItem('requestsClearance') || '[]');
  const onboardingRequests = JSON.parse(localStorage.getItem('requestsOnboarding') || '[]');
  const delegationRequests = JSON.parse(localStorage.getItem('requestsDelegation') || '[]');
  const certificateRequests = JSON.parse(localStorage.getItem('certificateRequests') || '[]');

  // Enhanced filter for pending requests (exclude completed and rejected)
  const pendingFilter = r => {
    // Comprehensive list of completed/rejected statuses
    const completedStatuses = [
      'مكتمل', 'موافق عليه', 'مرفوض', 'مكتملة', 'مرفوضة',
      'completed', 'approved', 'rejected', 'Completed', 'Approved', 'Rejected',
      'Fully Approved', 'Final Approved'
    ];
    
    // Check status field
    if (completedStatuses.includes(r.status)) return false;
    
    // Check final_decision field if it exists
    if (r.final_decision === 'approved' || r.final_decision === 'rejected') return false;
    
    // Check approval_stage field if it exists
    if (r.approval_stage === 'Completed' || r.approval_stage === 'Rejected' || r.approval_stage === 'Fully Approved') return false;
    
    // Must be pending and not sync failed
    return (PENDING_SET.has(r.status) || r.status === 'قيد الاعتماد' || r.status === 'قيد الانتظار') && !r.syncFailed;
  };
  
  const clearancePending = clearanceRequests.filter(pendingFilter);
  const onboardingPending = onboardingRequests.filter(pendingFilter);
  const delegationPending = delegationRequests.filter(pendingFilter);
  const certificatePending = certificateRequests.filter(pendingFilter);

  // Calculate summary statistics
  const requestsSummary = {
    clearance: {
      total: clearanceRequests.length,
      pending: clearancePending.length
    },
    onboarding: {
      total: onboardingRequests.length,
      pending: onboardingPending.length
    },
    delegation: {
      total: delegationRequests.length,
      pending: delegationPending.length
    },
    certificate: {
      total: certificateRequests.length,
      pending: certificatePending.length
    }
  };

  // Combine and sort only pending requests for dashboard
  const pendingRequests = [
    ...clearancePending.map(r => ({ ...r, type: 'clearance' })),
    ...onboardingPending.map(r => ({ ...r, type: 'onboarding' })),
    ...delegationPending.map(r => ({ ...r, type: 'delegation' })),
    ...certificatePending.map(r => ({ ...r, type: r.type || 'certificate' }))
  ].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 10);

  console.log(`📊 Dashboard showing ${pendingRequests.length} pending requests out of ${clearanceRequests.length + onboardingRequests.length + delegationRequests.length + certificateRequests.length} total`);

  // Update dashboard with filtered localStorage data
  updateRequestsSummary(requestsSummary);
  updateRecentRequests(pendingRequests);
  
  // Mock system stats
  const systemStats = {
    total_employees: 150,
    total_users: 45,
    total_departments: 8,
    total_requests: clearanceRequests.length + onboardingRequests.length + delegationRequests.length + certificateRequests.length
  };
  updateSystemStatistics(systemStats);
}

function updateSystemStatistics(stats) {
  if (!stats) return;

  const statElements = {
    totalEmployees: document.getElementById('totalEmployees'),
    totalUsers: document.getElementById('totalUsers'),
    totalDepartments: document.getElementById('totalDepartments'),
    totalRequests: document.getElementById('totalRequests')
  };

  if (statElements.totalEmployees) {
    statElements.totalEmployees.textContent = stats.total_employees || 0;
  }
  
  if (statElements.totalUsers) {
    statElements.totalUsers.textContent = stats.total_users || 0;
  }
  
  if (statElements.totalDepartments) {
    statElements.totalDepartments.textContent = stats.total_departments || 0;
  }
  
  if (statElements.totalRequests) {
    statElements.totalRequests.textContent = stats.total_requests || 0;
  }

  // Update daily requests chart if available
  if (stats.daily_requests) {
    updateDailyRequestsChart(stats.daily_requests);
  }
}

function updateRequestsSummary(summary) {
  if (!summary) return;

  const summaryElements = {
    clearanceTotal: document.getElementById('clearanceTotal'),
    clearancePending: document.getElementById('clearancePending'),
    onboardingTotal: document.getElementById('onboardingTotal'),
    onboardingPending: document.getElementById('onboardingPending'),
    delegationTotal: document.getElementById('delegationTotal'),
    delegationPending: document.getElementById('delegationPending')
  };

  if (summaryElements.clearanceTotal) {
    summaryElements.clearanceTotal.textContent = summary.clearance?.total || 0;
  }
  
  if (summaryElements.clearancePending) {
    summaryElements.clearancePending.textContent = summary.clearance?.pending || 0;
  }
  
  if (summaryElements.onboardingTotal) {
    summaryElements.onboardingTotal.textContent = summary.onboarding?.total || 0;
  }
  
  if (summaryElements.onboardingPending) {
    summaryElements.onboardingPending.textContent = summary.onboarding?.pending || 0;
  }
  
  if (summaryElements.delegationTotal) {
    summaryElements.delegationTotal.textContent = summary.delegation?.total || 0;
  }
  
  if (summaryElements.delegationPending) {
    summaryElements.delegationPending.textContent = summary.delegation?.pending || 0;
  }
}

function updateRecentRequests(requests) {
  // تطبيع وترتيب
  const norm = (requests||[]).map(r => normalizeRequest(r, r.type))
                             .sort((a,b)=> (b.createdAt||0)-(a.createdAt||0));

  // إن كنا في وضع الجدول (صفحتك الحالية)، نرسم الصفوف ونحدّث KPIs ونخرج
  const drawn = renderTableRows(norm);
  if (drawn) {
    kpiUpdateFromRequests(norm);
    return;
  }

  // ---- وإلا (صفحات أخرى قديمة) نحتفظ بعرض الكروت كما كان ----
  const recentContainer = document.getElementById('recentRequests');
  if (!recentContainer) return;

  if (!norm.length) {
    recentContainer.innerHTML = `<div class="empty-state"><p>لا توجد طلبات حديثة</p></div>`;
    return;
  }

  const html = norm.map(request => `
    <div class="admin-request-card" onclick="viewAdminRequest('${request.type}', '${request.id}')">
      <div class="request-header">
        <span class="request-type">${getTypeDisplayName(request.type)}</span>
        <span class="request-date">${formatDate(request.createdAt)}</span>
      </div>
      <div class="request-body">
        <h4>رقم المرجع: ${request.reference_number || request.id}</h4>
        <p>الموظف: ${request.employee?.name || 'غير محدد'}</p>
        <div class="request-actions">
          <button class="btn-sm btn-primary" onclick="event.stopPropagation(); approveRequest('${request.type}', '${request.id}')">موافقة</button>
          <button class="btn-sm btn-danger" onclick="event.stopPropagation(); rejectRequest('${request.type}', '${request.id}')">رفض</button>
          <button class="btn-sm btn-secondary" onclick="event.stopPropagation(); viewRequestDetails('${request.type}', '${request.id}')">عرض</button>
        </div>
      </div>
    </div>`).join('');

  recentContainer.innerHTML = html;

  // KPI كذلك هنا (لصفحات الكروت)
  kpiUpdateFromRequests(norm);
}

function updateAdminActions() {
  const actionsContainer = document.getElementById('adminActions');
  if (!actionsContainer) return;

  actionsContainer.innerHTML = `
    <div class="admin-action-card" onclick="window.location.href='admin-employees.html'">
      <div class="action-icon">👥</div>
      <h3>إدارة الموظفين</h3>
      <p>عرض وإدارة بيانات الموظفين</p>
    </div>
    
    <div class="admin-action-card" onclick="window.location.href='admin-clearance-inbox.html'">
      <div class="action-icon">📄</div>
      <h3>طلبات الإخلاء</h3>
      <p>مراجعة طلبات إخلاء الطرف</p>
    </div>
    
    <div class="admin-action-card" onclick="window.location.href='admin-direct-inbox.html'">
      <div class="action-icon">👤</div>
      <h3>طلبات المباشرة</h3>
      <p>مراجعة طلبات مباشرة العمل</p>
    </div>
    
    <div class="admin-action-card" onclick="window.location.href='admin-delegations-inbox.html'">
      <div class="action-icon">🔄</div>
      <h3>طلبات التفويض</h3>
      <p>مراجعة طلبات التفويض</p>
    </div>
    
    <div class="admin-action-card" onclick="showUserManagement()">
      <div class="action-icon">🔐</div>
      <h3>إدارة المستخدمين</h3>
      <p>إدارة حسابات المستخدمين</p>
    </div>
    
    <div class="admin-action-card" onclick="showSystemSettings()">
      <div class="action-icon">⚙️</div>
      <h3>إعدادات النظام</h3>
      <p>إعدادات عامة للنظام</p>
    </div>
  `;
}

function updateDailyRequestsChart(dailyData) {
  const chartContainer = document.getElementById('dailyRequestsChart');
  if (!chartContainer || !dailyData.length) return;

  // Simple bar chart implementation
  const maxValue = Math.max(...dailyData.map(d => d.count));
  
  const chartHTML = dailyData.slice(0, 7).map(day => {
    const height = (day.count / maxValue) * 100;
    return `
      <div class="chart-bar">
        <div class="bar" style="height: ${height}%" title="${day.count} طلبات في ${formatDate(day.date)}"></div>
        <div class="bar-label">${formatShortDate(day.date)}</div>
      </div>
    `;
  }).join('');

  chartContainer.innerHTML = `
    <div class="chart-container">
      <h4>الطلبات اليومية (آخر 7 أيام)</h4>
      <div class="chart-bars">
        ${chartHTML}
      </div>
    </div>
  `;
}

function setupEventListeners() {
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      apiClient.logout();
      showSuccess('تم تسجيل الخروج بنجاح');
      setTimeout(() => {
        window.location.href = window.resolveFrontendPath ? window.resolveFrontendPath('login.html') : 'login.html';
      }, 1000);
    });
  }

  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      loadDashboardData();
      showSuccess('تم تحديث البيانات');
    });
  }

  // Navigation menu items
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      const href = this.getAttribute('data-href');
      if (href) {
        window.location.href = href;
      }
    });
  });

  // Quick filter buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const filter = this.getAttribute('data-filter');
      filterRequests(filter);
    });
  });
}

// Helper functions
function viewAdminRequest(type, id) {
  console.log(`🔍 Admin ViewRequest called with type: "${type}", id: ${id}`);
  
  // Navigate to dedicated admin detail pages (all 11 request types)
  const detailPages = {
    'clearance': 'admin-clearance-detail.html',
    'onboarding': 'admin-direct-detail.html',
    'delegation': 'admin-delegation-detail.html',
    'certificate': 'admin-certificate-detail.html',
    'experience': 'admin-experience-detail.html',  // Moved from hidden/
    'exit': 'admin-exit-inbox.html',               // Use existing exit inbox for now
    'leave_request': 'admin-leave-detail.html',
    'housing_allowance': 'admin-housing-allowance-detail.html',
    'assignment': 'admin-assignment-detail.html',
    'assignment_termination': 'admin-assignment-termination-detail.html',
    'internal_transfer': 'admin-internal-transfer-detail.html',
    'maternity_leave': 'admin-leave-detail.html'
  };
  
  const detailPage = detailPages[type];
  if (detailPage) {
    window.location.href = `${detailPage}?id=${id}`;
  } else {
    console.warn('⚠️ No detail page found for type:', type);
    window.DetailUtils && window.DetailUtils.showError ? 
      window.DetailUtils.showError('نوع الطلب غير مدعوم') :
      alert('نوع الطلب غير مدعوم');
  }
}

function viewRequestDetails(type, id) {
  console.log(`🔍 Admin viewing request: type="${type}", id=${id}`);
  
  // Navigate to dedicated admin detail pages (all 11 request types)
  const detailPages = {
    'clearance': 'admin-clearance-detail.html',
    'onboarding': 'admin-direct-detail.html',
    'delegation': 'admin-delegation-detail.html',
    'certificate': 'admin-certificate-detail.html',
    'experience': 'admin-experience-detail.html',  // Moved from hidden/
    'exit': 'admin-exit-inbox.html',               // Use existing exit inbox for now
    'leave_request': 'admin-leave-detail.html',    // Add proper leave request routing
    'assignment': 'admin-assignment-detail.html',
    'assignment_termination': 'admin-assignment-termination-detail.html',
    'internal_transfer': 'admin-internal-transfer-detail.html',
    'maternity_leave': 'admin-leave-detail.html',
    'housing_allowance': 'admin-housing-allowance-detail.html'
  };
  
  const detailPage = detailPages[type];
  if (detailPage) {
    window.location.href = `${detailPage}?id=${id}`;
  } else {
    console.warn('⚠️ No detail page found for type:', type);
    window.DetailUtils && window.DetailUtils.showError ? 
      window.DetailUtils.showError('نوع الطلب غير مدعوم') :
      alert('نوع الطلب غير مدعوم');
  }
}

// Helper function for time elapsed
function getTimeElapsed(dateString) {
  if (!dateString) return 'غير محدد';
  
  const now = new Date();
  const created = new Date(dateString);
  const diffMs = now - created;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays > 0) {
    return `${diffDays} يوم و ${diffHours} ساعة`;
  } else if (diffHours > 0) {
    return `${diffHours} ساعة`;
  } else {
    return 'أقل من ساعة';
  }
}

function showAdminRequestDetailsModal(type, id) {
  // Create modal HTML with proper centering
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;
  modal.innerHTML = `
    <div style="max-width: 700px; width: 90%; background: white; border-radius: 12px; padding: 20px; position: relative; max-height: 80vh; overflow-y: auto;">
      <button onclick="closeAdminModal()" style="position: absolute; top: 10px; left: 10px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px;">×</button>
      <h2 style="margin-top: 0; color: #1f2937; text-align: center;">تفاصيل الطلب - لوحة الإدارة</h2>
      <div id="admin-modal-content">
        <p style="text-align: center; color: #6b7280;">جاري التحميل...</p>
      </div>
    </div>
  `;
  
  // Store modal reference globally for easy closing
  window.currentAdminModal = modal;
  
  document.body.appendChild(modal);
  
  // Load request details
  loadAdminRequestDetails(type, id);
}

async function loadAdminRequestDetails(type, id) {
  const modalContent = document.getElementById('admin-modal-content');
  
  try {
    console.log('🔍 Admin Modal: Loading details for', { type, id });
    console.log('🔍 Admin Modal: Available data:', window.adminDashboardData);
    
    // Get the recent requests from stored data
    const recentRequests = Array.isArray(window.adminDashboardData?.recentRequests) ? window.adminDashboardData.recentRequests : [];
    
    console.log('🔍 Admin Modal: Recent requests:', recentRequests.length);
    
    // Find the request by id and type (check multiple ID fields)
    console.log('🔍 Admin Modal: Looking for ID:', id, 'Type:', type);
    console.log('🔍 Admin Modal: Available request IDs:', recentRequests.map(r => ({ id: r.id, sourceId: r.sourceId, type: r.type })));
    
    const request = recentRequests.find(r => {
      const matchesId = (r.id == id || r.sourceId == id);
      const matchesType = (r.type === type || (type === 'onboarding' && r.type !== 'clearance'));
      console.log(`🔍 Checking request ${r.id}/${r.sourceId}: ID match=${matchesId}, Type match=${matchesType}`);
      return matchesId && matchesType;
    });
    
    console.log('🔍 Admin Modal: Found request:', request);
    
    if (request) {
      const typeArabic = type === 'clearance' ? 'إخلاء طرف' : 
                         type === 'onboarding' ? 'مباشرة عمل' : 
                         type === 'certificate' ? 'شهادة تعريف' : 
                         type === 'experience' ? 'شهادة خبرة' : 
                         type === 'exit' ? 'إنهاء العمل' : 
                         type === 'delegation' ? 'تفويض' : 'غير محدد';
      
      modalContent.innerHTML = `
        <div style="line-height: 1.8;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <p><strong>رقم المرجع:</strong> ${request.reference_number || '#' + request.id}</p>
            <p><strong>النوع:</strong> ${typeArabic}</p>
            <p><strong>الحالة:</strong> <span style="padding: 4px 8px; border-radius: 4px; background: #f3f4f6;">${request.status}</span></p>
            <p><strong>تاريخ الإنشاء:</strong> ${formatDate(request.created_at || request.createdAt || request.request_date)}</p>
          </div>
          
          <!-- معلومات الموظف المفصلة -->
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0f2fe;">
            <h3 style="margin: 0 0 15px 0; color: #1f2937; border-bottom: 2px solid #10b981; padding-bottom: 8px;">👤 معلومات الموظف الكاملة</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <p><strong>اسم الموظف:</strong> <span style="color: #1f2937; font-weight: bold;">${request.employee?.name || request.employee_name || 'غير محدد'}</span></p>
              <p><strong>البريد الإلكتروني:</strong> <span style="color: #3b82f6;">${request.employee?.email || request.employee_email || 'غير محدد'}</span></p>
              <p><strong>القسم:</strong> <span style="color: #059669; font-weight: bold;">${request.employee?.department || request.employee_dept || 'غير محدد'}</span></p>
              <p><strong>رقم الموظف:</strong> <span style="color: #7c3aed;">${request.employee?.id || request.employee_id || 'غير محدد'}</span></p>
            </div>
            
            <!-- معلومات إضافية للموظف -->
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0f2fe;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <p><strong>المنصب:</strong> <span style="color: #6366f1;">${request.employee?.position || request.job_title || 'غير محدد'}</span></p>
                <p><strong>رقم الهاتف:</strong> <span style="color: #059669;">${request.employee?.phone || request.phone || 'غير محدد'}</span></p>
                <p><strong>تاريخ التوظيف:</strong> <span style="color: #dc2626;">${request.employee?.hire_date ? formatDate(request.employee.hire_date) : 'غير محدد'}</span></p>
                <p><strong>الحالة الوظيفية:</strong> <span style="color: #10b981; font-weight: bold;">${request.employee?.status || 'نشط'}</span></p>
              </div>
            </div>
          </div>
          
          ${request.reason ? `
          <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 15px;">
            <h3 style="margin: 0 0 10px 0; color: #374151;">السبب</h3>
            <p style="background: #f9fafb; padding: 10px; border-radius: 6px; margin: 0;">${request.reason}</p>
          </div>
          ` : ''}
          
          ${request.last_work_day ? `<p><strong>آخر يوم عمل:</strong> ${formatDate(request.last_work_day)}</p>` : ''}
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
          <button onclick="approveRequest('${type}', '${request.id}'); closeAdminModal();" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">موافقة</button>
          <button onclick="rejectRequest('${type}', '${request.id}'); closeAdminModal();" style="background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">رفض</button>
          <button onclick="closeAdminModal()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">إغلاق</button>
        </div>
      `;
    } else {
      modalContent.innerHTML = `
        <p style="text-align: center; color: #ef4444;">لم يتم العثور على تفاصيل هذا الطلب</p>
        <div style="text-align: center; margin-top: 20px;">
          <button onclick="closeAdminModal()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">إغلاق</button>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading admin request details:', error);
    modalContent.innerHTML = `
      <p style="text-align: center; color: #ef4444;">حدث خطأ في تحميل التفاصيل</p>
      <div style="text-align: center; margin-top: 20px;">
        <button onclick="closeAdminModal()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">إغلاق</button>
      </div>
    `;
  }
}

// Global function to close admin modal
function closeAdminModal() {
  if (window.currentAdminModal) {
    window.currentAdminModal.remove();
    window.currentAdminModal = null;
    console.log('✅ Admin modal closed');
  }
}

async function deleteRequest(id, kind) {
  // Load confirmation dialog if not available
  if (typeof window.showConfirm === 'undefined') {
    const confirmScript = document.createElement('script');
    confirmScript.src = '../jS/confirmation-dialog.js';
    document.head.appendChild(confirmScript);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const confirmed = await (window.showConfirm ? window.showConfirm({
    title: 'تأكيد الحذف',
    message: `هل أنت متأكد من حذف ${kind} رقم ${id}؟<br><strong>هذا الإجراء لا يمكن التراجع عنه.</strong>`,
    confirmText: 'حذف',
    cancelText: 'إلغاء',
    type: 'danger'
  }) : confirm(`هل أنت متأكد من حذف ${kind} رقم ${id}؟ هذا الإجراء لا يمكن التراجع عنه.`));

  if (!confirmed) {
    return;
  }

  try {
    // Determine storage key and request type
    let storageKey;
    if (kind === 'إخلاء طرف') {
      storageKey = 'requestsClearance';
    } else {
      storageKey = 'requestsOnboarding'; // For both direct and onboarding
    }

    // Get current requests
    const requests = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Find and remove the request
    const requestIndex = requests.findIndex(r => r.id == id);
    if (requestIndex === -1) {
      showError('لم يتم العثور على الطلب');
      return;
    }

    // Remove the request
    requests.splice(requestIndex, 1);
    
    // Save back to localStorage
    localStorage.setItem(storageKey, JSON.stringify(requests));
    
    // Add notification about deletion
    if (window.NotificationStore) {
      window.NotificationStore.add({
        id: 'del_' + Date.now(),
        title: `تم حذف ${kind} رقم ${id}`,
        message: 'تم حذف الطلب من النظام',
        time: 'الآن',
        unread: true
      });
    }
    
    showSuccess(`تم حذف ${kind} رقم ${id} بنجاح`);
    
    // Refresh dashboard immediately
    loadFromLocalStorage();
    
  } catch (error) {
    console.error('Delete request error:', error);
    showError('حدث خطأ في حذف الطلب');
  }
}

async function approveRequest(type, id, note = '') {
  try {
    console.log(`🔄 Approving request: ${type} ID ${id}`);
    await apiClient.approveRequest(type, id, note);
    
    showSuccess('تم الموافقة على الطلب بنجاح');
    console.log('✅ Approval successful, refreshing dashboard...');
    
    // Small delay to ensure database update completes, then refresh
    setTimeout(() => {
      console.log('🔄 Refreshing dashboard after approval...');
      loadDashboardData();
    }, 1000);
    
  } catch (error) {
    console.error('Approval error:', error);
    showError('حدث خطأ في الموافقة على الطلب');
  }
}

async function rejectRequest(type, id, note = '') {
  try {
    console.log(`🔄 Rejecting request: ${type} ID ${id}`);
    await apiClient.rejectRequest(type, id, note);
    
    showSuccess('تم رفض الطلب');
    console.log('✅ Rejection successful, refreshing dashboard...');
    
    // Small delay to ensure database update completes, then refresh
    setTimeout(() => {
      console.log('🔄 Refreshing dashboard after rejection...');
      loadDashboardData();
    }, 1000);
    
  } catch (error) {
    console.error('Rejection error:', error);
    showError('حدث خطأ في رفض الطلب');
  }
}

function getTypeDisplayName(type) {
  const typeNames = {
    clearance: 'إخلاء طرف',
    onboarding: 'مباشرة عمل',
    delegation: 'تفويض',
    certificate: 'شهادة تعريف',
    experience: 'شهادة خبرة',
    exit: 'إنهاء العمل'
  };
  
  return typeNames[type] || type;
}

function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatShortDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    month: 'short',
    day: 'numeric'
  });
}

function filterRequests(filter) {
  // Update active filter button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
  
  // Apply filter logic
  const requestCards = document.querySelectorAll('.admin-request-card');
  requestCards.forEach(card => {
    if (filter === 'all') {
      card.style.display = 'block';
    } else {
      const requestType = card.querySelector('.request-type').textContent;
      if (getTypeDisplayName(filter) === requestType) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    }
  });
}

function showUserManagement() {
  // Create modal for user management
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content large">
      <div class="modal-header">
        <h3>إدارة المستخدمين</h3>
        <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="modal-body">
        <div class="loading-placeholder">جاري تحميل المستخدمين...</div>
        <div id="usersContainer"></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Load users
  loadUsers();
  
  // Close modal when clicking outside
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

async function loadUsers() {
  try {
    const users = await apiClient.makeRequest('/admin/users');
    const container = document.getElementById('usersContainer');
    
    if (!users.length) {
      container.innerHTML = '<p class="empty-state">لا يوجد مستخدمون</p>';
      return;
    }

    const usersHTML = users.map(user => `
      <div class="user-card">
        <div class="user-info">
          <h4>${user.name}</h4>
          <p>${user.email}</p>
          <span class="user-role">${getRoleDisplayName(user.role)}</span>
        </div>
        <div class="user-actions">
          <select onchange="updateUserRole(${user.id}, this.value)">
            <option value="employee" ${user.role === 'employee' ? 'selected' : ''}>موظف</option>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>مدير</option>
            <option value="hr" ${user.role === 'hr' ? 'selected' : ''}>موارد بشرية</option>
            <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>مدير قسم</option>
          </select>
          <button class="btn-sm ${user.is_active ? 'btn-danger' : 'btn-success'}" 
                  onclick="toggleUserStatus(${user.id}, ${!user.is_active})">
            ${user.is_active ? 'تعطيل' : 'تفعيل'}
          </button>
        </div>
      </div>
    `).join('');

    container.innerHTML = usersHTML;
    
  } catch (error) {
    console.error('Users loading error:', error);
    document.getElementById('usersContainer').innerHTML = '<p class="error-state">حدث خطأ في تحميل المستخدمين</p>';
  }
}

function getRoleDisplayName(role) {
  const roleNames = {
    employee: 'موظف',
    admin: 'مدير',
    hr: 'موارد بشرية',
    manager: 'مدير قسم'
  };
  
  return roleNames[role] || role;
}

async function updateUserRole(userId, newRole) {
  try {
    await apiClient.makeRequest(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole })
    });
    
    showSuccess('تم تحديث دور المستخدم بنجاح');
    
  } catch (error) {
    console.error('Role update error:', error);
    showError('حدث خطأ في تحديث دور المستخدم');
  }
}

async function toggleUserStatus(userId, isActive) {
  try {
    await apiClient.makeRequest(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive })
    });
    
    showSuccess(`تم ${isActive ? 'تفعيل' : 'تعطيل'} المستخدم بنجاح`);
    loadUsers(); // Refresh users list
    
  } catch (error) {
    console.error('Status update error:', error);
    showError('حدث خطأ في تحديث حالة المستخدم');
  }
}

function showSystemSettings() {
  showInfo('إعدادات النظام ستكون متاحة قريباً');
}

function showLoadingState() {
  const loadingElements = document.querySelectorAll('.loading-placeholder');
  loadingElements.forEach(element => {
    element.style.display = 'block';
  });
  
  const contentElements = document.querySelectorAll('.dashboard-content');
  contentElements.forEach(element => {
    element.style.opacity = '0.5';
  });
}

function hideLoadingState() {
  const loadingElements = document.querySelectorAll('.loading-placeholder');
  loadingElements.forEach(element => {
    element.style.display = 'none';
  });
  
  const contentElements = document.querySelectorAll('.dashboard-content');
  contentElements.forEach(element => {
    element.style.opacity = '1';
  });
}

// Add admin dashboard-specific CSS
const style = document.createElement('style');
style.textContent = `
  .admin-request-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .admin-request-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
  
  .request-actions {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }
  
  .btn-sm {
    padding: 5px 10px;
    font-size: 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .btn-primary { background: #2B6CB0; color: white; }
  .btn-secondary { background: #6b7280; color: white; }
  .btn-success { background: #10b981; color: white; }
  .btn-danger { background: #ef4444; color: white; }
  
  .admin-action-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .admin-action-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  }
  
  .chart-container {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    margin-bottom: 20px;
  }
  
  .chart-bars {
    display: flex;
    align-items: end;
    gap: 10px;
    height: 150px;
    margin-top: 15px;
  }
  
  .chart-bar {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .bar {
    background: linear-gradient(to top, #2B6CB0, #60a5fa);
    width: 100%;
    min-height: 5px;
    border-radius: 4px 4px 0 0;
    transition: all 0.3s;
  }
  
  .bar:hover {
    opacity: 0.8;
  }
  
  .bar-label {
    font-size: 12px;
    color: #6b7280;
    margin-top: 5px;
  }
  
  .filter-btn {
    padding: 8px 16px;
    border: 1px solid #e5e7eb;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    margin-right: 10px;
    transition: all 0.3s;
  }
  
  .filter-btn.active,
  .filter-btn:hover {
    background: #2B6CB0;
    color: white;
    border-color: #2B6CB0;
  }
  
  .user-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 10px;
  }
  
  .user-info h4 {
    margin: 0 0 5px 0;
    color: #374151;
  }
  
  .user-info p {
    margin: 0 0 5px 0;
    color: #6b7280;
    font-size: 14px;
  }
  
  .user-role {
    background: #f3f4f6;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    color: #374151;
  }
  
  .user-actions {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  
  .user-actions select {
    padding: 5px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
  }
  
  .modal-content.large {
    max-width: 800px;
  }
  
  .empty-state,
  .error-state {
    text-align: center;
    padding: 40px;
    color: #6b7280;
  }
  
  .error-state {
    color: #ef4444;
  }
`;
document.head.appendChild(style);

// Stage-E: Add sync chips to table rows without touching render logic
(function(){
  function findByIdAcrossKeys(id){
    const toList = (k)=>{ try { return JSON.parse(localStorage.getItem(k)||'[]'); } catch(_) { return []; } };
    const keys = ['requestsClearance','requestsOnboarding','requestsDelegation','requestsCertificate','requestsExperience'];
    for (const k of keys){
      const arr = toList(k);
      // Ensure arr is actually an array before calling .find()
      if (!Array.isArray(arr)) continue;
      const item = arr.find(x => String(x.id)===String(id) || String(x.optimisticId)===String(id));
      if (item) return { item, key: k };
    }
    return null;
  }
  function decorateSyncChipsForTable(){
    const tbody = document.getElementById('last-rows');
    if (!tbody) return;
    Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
      const cells = tr.querySelectorAll('td'); if (!cells || cells.length < 3) return;
      const idText = cells[0].textContent.trim();
      const statusCell = cells[2];
      // avoid duplicates
      const exist = statusCell.querySelector('.sync-chip'); if (exist) return;
      const found = findByIdAcrossKeys(idText);
      if (!found) return;
      const { item } = found;
      if (item.syncFailed) {
        const chip = document.createElement('span');
        chip.className = 'sync-chip failed';
        chip.title = 'فشل الإرسال — إعادة المحاولة';
        chip.textContent = '⚠️';
        chip.addEventListener('click', (e)=>{ e.stopPropagation(); window.retrySync && window.retrySync(item.optimisticId || item.id); });
        statusCell.appendChild(chip);
      } else if (item.syncing) {
        const chip = document.createElement('span');
        chip.className = 'sync-chip pending';
        chip.title = 'جاري المزامنة';
        chip.textContent = '⏳';
        statusCell.appendChild(chip);
      }
    });
  }
  window.addEventListener('sync:updated', ()=> setTimeout(decorateSyncChipsForTable, 50));
  window.addEventListener('sync:failed',  ()=> setTimeout(decorateSyncChipsForTable, 50));
  window.addEventListener('storage',      (e)=>{ if(['requestsClearance','requestsOnboarding','requestsDelegation'].includes(e.key)) setTimeout(decorateSyncChipsForTable, 50); });
  // Try to decorate periodically as a fallback
  setInterval(decorateSyncChipsForTable, 1500);
})();

// Stage-E: Minimal chip styles (in case shared styles not loaded)
(function(){
  if (document.getElementById('sync-chip-styles-admin')) return;
  const st = document.createElement('style');
  st.id = 'sync-chip-styles-admin';
  st.textContent = `.sync-chip{font-size:11px;padding:2px 6px;border-radius:8px;margin-inline-start:6px}.sync-chip.pending{background:#fff7ed;color:#92400e}.sync-chip.failed{background:#fee2e2;color:#991b1b}`;
  document.head.appendChild(st);
})();

// ====================== Certificates & Licenses Approval System ======================

async function loadPendingCredentials() {
  const container = document.getElementById('credentialsList');
  const countBadge = document.getElementById('credentialsPendingCount');
  
  if (!container) {
    console.warn('⚠️ Credentials list container not found');
    return;
  }
  
  try {
    console.log('🔄 Loading pending credentials...');
    
    // Show loading state
    container.innerHTML = '<div style="text-align: center; padding: 24px; color: var(--muted);">جاري التحميل...</div>';
    
    // Fetch grouped pending credentials
    const response = await apiClient.makeRequest('/employee/admin/pending-credentials');
    const grouped = response.data || response || [];
    
    console.log('✅ Pending credentials loaded:', grouped);
    
    if (grouped.length === 0) {
      container.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--muted);">
          <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
          <div style="font-weight: 600;">لا توجد شهادات أو تراخيص معلقة</div>
          <div style="font-size: 13px; margin-top: 8px;">جميع الطلبات تمت معالجتها</div>
        </div>
      `;
      if (countBadge) countBadge.style.display = 'none';
      return;
    }
    
    // Calculate total count
    const totalCount = grouped.reduce((sum, g) => sum + g.certificates.length + g.licenses.length, 0);
    
    // Update count badge
    if (countBadge) {
      countBadge.textContent = totalCount;
      countBadge.style.display = totalCount > 0 ? 'inline' : 'none';
    }
    
    // Render grouped credentials
    const html = grouped.map(group => {
      const certCount = group.certificates.length;
      const licCount = group.licenses.length;
      const totalItems = certCount + licCount;
      
      return `
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 10px; background: #fff;">
          <!-- Employee Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
            <div>
              <div style="font-weight: 700; color: #1f2937; font-size: 14px;">${group.employee_name}</div>
              <div style="font-size: 12px; color: #6b7280;">${group.department_name || 'غير محدد'} • ${group.employee_email}</div>
            </div>
            <div style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
              ${totalItems} ${totalItems === 1 ? 'طلب' : 'طلبات'}
            </div>
          </div>
          
          <!-- Certificates -->
          ${certCount > 0 ? `
            <div style="margin-bottom: 8px;">
              <div style="font-weight: 600; color: #374151; font-size: 13px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                🎓 الشهادات (${certCount})
              </div>
              ${group.certificates.map(cert => `
                <div style="background: #f9fafb; padding: 8px; border-radius: 6px; margin-bottom: 4px; font-size: 12px;">
                  <div style="font-weight: 600; color: #1f2937; margin-bottom: 3px;">${cert.certificate_name}</div>
                  <div style="color: #6b7280; margin-bottom: 4px;">
                    ${cert.issuing_institution} • ${getCertificateTypeArabic(cert.certificate_type)}
                    ${cert.issue_date ? ` • ${formatDate(cert.issue_date)}` : ''}
                  </div>
                  <div style="display: flex; gap: 6px; margin-top: 6px;">
                    <button onclick="approveCredential('certificate', ${cert.id})" 
                            style="background: #10b981; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">
                      ✓ موافقة
                    </button>
                    <button onclick="rejectCredential('certificate', ${cert.id})" 
                            style="background: #ef4444; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">
                      ✗ رفض
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <!-- Licenses -->
          ${licCount > 0 ? `
            <div>
              <div style="font-weight: 600; color: #374151; font-size: 13px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                🪪 التراخيص (${licCount})
              </div>
              ${group.licenses.map(lic => `
                <div style="background: #f0f9ff; padding: 8px; border-radius: 6px; margin-bottom: 4px; font-size: 12px;">
                  <div style="font-weight: 600; color: #1f2937; margin-bottom: 3px;">${lic.license_name}</div>
                  <div style="color: #6b7280; margin-bottom: 4px;">
                    ${lic.license_number} • ${lic.issuing_authority}
                    ${lic.expiry_date ? ` • ينتهي ${formatDate(lic.expiry_date)}` : ''}
                  </div>
                  <div style="display: flex; gap: 6px; margin-top: 6px;">
                    <button onclick="approveCredential('license', ${lic.id})" 
                            style="background: #10b981; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">
                      ✓ موافقة
                    </button>
                    <button onclick="rejectCredential('license', ${lic.id})" 
                            style="background: #ef4444; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">
                      ✗ رفض
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
    
    container.innerHTML = html;
    console.log('✅ Credentials list rendered');
    
  } catch (error) {
    console.error('❌ Error loading pending credentials:', error);
    container.innerHTML = `
      <div style="padding: 24px; text-align: center; color: #ef4444;">
        <div style="font-size: 36px; margin-bottom: 12px;">⚠️</div>
        <div style="font-weight: 600;">حدث خطأ في تحميل الشهادات والتراخيص</div>
        <div style="font-size: 13px; margin-top: 8px;">${error.message || 'خطأ غير معروف'}</div>
        <button onclick="loadPendingCredentials()" style="margin-top: 12px; background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
          إعادة المحاولة
        </button>
      </div>
    `;
  }
}

async function approveCredential(type, id) {
  try {
    console.log(`🔄 Approving ${type} ID ${id}`);
    
    const endpoint = type === 'certificate' 
      ? `/employee/admin/certificates/${id}/approve`
      : `/employee/admin/licenses/${id}/approve`;
    
    await apiClient.makeRequest(endpoint, { method: 'POST' });
    
    showSuccess(`تم الموافقة على ${type === 'certificate' ? 'الشهادة' : 'الترخيص'} بنجاح`);
    
    // Refresh the list
    setTimeout(() => {
      loadPendingCredentials();
    }, 500);
    
  } catch (error) {
    console.error(`❌ Error approving ${type}:`, error);
    showError(`حدث خطأ في الموافقة: ${error.message || 'خطأ غير معروف'}`);
  }
}

async function rejectCredential(type, id) {
  // Load confirmation dialog if not available
  if (typeof window.showConfirm === 'undefined') {
    const confirmScript = document.createElement('script');
    confirmScript.src = '../jS/confirmation-dialog.js';
    document.head.appendChild(confirmScript);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const confirmed = await (window.showConfirm ? window.showConfirm({
    title: 'تأكيد الرفض',
    message: `هل أنت متأكد من رفض ${type === 'certificate' ? 'هذه الشهادة' : 'هذا الترخيص'}؟<br><strong>سيتم حذف البيانات نهائياً.</strong>`,
    confirmText: 'رفض',
    cancelText: 'إلغاء',
    type: 'danger'
  }) : confirm(`هل أنت متأكد من رفض ${type === 'certificate' ? 'هذه الشهادة' : 'هذا الترخيص'}؟ سيتم حذف البيانات نهائياً.`));

  if (!confirmed) {
    return;
  }

  try {
    console.log(`🔄 Rejecting ${type} ID ${id}`);
    
    const endpoint = type === 'certificate' 
      ? `/employee/admin/certificates/${id}/reject`
      : `/employee/admin/licenses/${id}/reject`;
    
    await apiClient.makeRequest(endpoint, { method: 'POST' });
    
    showSuccess(`تم رفض ${type === 'certificate' ? 'الشهادة' : 'الترخيص'}`);
    
    // Refresh the list
    setTimeout(() => {
      loadPendingCredentials();
    }, 500);
    
  } catch (error) {
    console.error(`❌ Error rejecting ${type}:`, error);
    showError(`حدث خطأ في الرفض: ${error.message || 'خطأ غير معروف'}`);
  }
}

function getCertificateTypeArabic(type) {
  const types = {
    'bachelor': 'بكالوريوس',
    'master': 'ماجستير',
    'phd': 'دكتوراه',
    'diploma': 'دبلوم',
    'certificate': 'شهادة',
    'training': 'دورة تدريبية',
    'other': 'أخرى'
  };
  return types[type] || type;
}

// Make functions global
window.loadPendingCredentials = loadPendingCredentials;
window.approveCredential = approveCredential;
window.rejectCredential = rejectCredential;

// Auto-load pending credentials when dashboard loads
window.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for dashboard to initialize first
  setTimeout(() => {
    if (document.getElementById('credentialsList')) {
      loadPendingCredentials();
    }
  }, 2000);
});
