// Employee Dashboard JavaScript
// Handles employee dashboard functionality

document.addEventListener('DOMContentLoaded', function() {
  // Wait for all dependencies before initializing
  if (typeof window.waitForDependencies === 'function') {
    window.waitForDependencies(() => {
      initializeEmployeeDashboard();
    }, ['apiClient', 'NotificationStore', 'resolveFrontendPath']);
  } else {
    // Fallback if dependency guard not available
    console.warn('⚠️ Dependency guard not available, initializing immediately');
    setTimeout(initializeEmployeeDashboard, 1000);
  }
});

function initializeEmployeeDashboard() {
  try {
  // Check authentication
  if (!requireAuth()) return;

  const user = apiClient.getCurrentUser();
  
  // Check if user is employee (not admin)
  if (user.role === 'admin') {
    window.location.href = window.resolveFrontendPath('admin-dashboard.html');
    return;
  }

    console.log('✅ Initializing employee dashboard for user:', user.name);

  // Initialize dashboard
  initializeDashboard();
  loadDashboardData();
  setupEventListeners();
    
  } catch (error) {
    console.error('❌ Error initializing employee dashboard:', error);
    if (window.handleApiError) {
      window.handleApiError(error, 'تهيئة لوحة الموظف');
    }
  }
}

function initializeDashboard() {
  const user = apiClient.getCurrentUser();
  
  // Update user info in header
  const userNameElement = document.getElementById('userName');
  const userEmailElement = document.getElementById('userEmail');
  
  if (userNameElement) userNameElement.textContent = user.name;
  if (userEmailElement) userEmailElement.textContent = user.email;
  
  // Update welcome message
  const welcomeElement = document.getElementById('welcomeMessage');
  if (welcomeElement) {
    welcomeElement.textContent = `مرحباً ${user.name}`;
  }
}

async function loadDashboardData() {
  try {
    showLoadingState();
    
    console.log('🔄 Loading dashboard data from DATABASE...');
    
    // Try API first (should work now with fixed SQL)
    try {
    const [clearances, onboardings, delegations, certificates, experiences, exits, assignments, assignmentTerminations, internalTransfers, leaveRequests, maternityLeave, housingAllowance, travelOrders, rewardRefunds, airlinesTickets] = await Promise.all([
      apiClient.getMyClearances().catch(() => []),
      apiClient.getMyOnboardings().catch(() => []),
      apiClient.getMyDelegations().catch(() => []),
      apiClient.getMyCertificates().catch(() => []),
      apiClient.getMyExperiences().catch(() => []),
      apiClient.getMyExits().catch(() => []),
      apiClient.getMyAssignments().catch(() => []),
      apiClient.getMyAssignmentTerminations().catch(() => []),
      apiClient.getMyInternalTransfers().catch(() => []),
      apiClient.getMyLeaveRequests().catch(() => []),
      apiClient.getMyMaternityLeaves().catch(() => []),
      apiClient.getMyHousingAllowances().catch(() => []),
      apiClient.getMyTravelOrders().catch(() => []),
      apiClient.getMyRewardRefunds().catch(() => []),
      apiClient.getMyAirlinesTickets().catch(() => [])
    ]);

      console.log('✅ API data loaded:', {
        clearances: clearances.length,
        onboardings: onboardings.length,
        delegations: delegations.length,
        certificates: certificates.length,
        experiences: experiences.length,
        exits: exits.length,
        assignments: assignments.length,
        assignmentTerminations: assignmentTerminations.length,
        internalTransfers: internalTransfers.length,
        leaveRequests: leaveRequests.length,
        maternityLeave: maternityLeave.length,
        housingAllowance: housingAllowance.length,
        travelOrders: travelOrders.length,
        rewardRefunds: rewardRefunds.length,
        airlinesTickets: airlinesTickets.length
      });

      // Store data globally for modal access
      window.dashboardData = { clearances, onboardings, delegations, certificates, experiences, exits, assignments, assignmentTerminations, internalTransfers, leaveRequests, maternityLeave, housingAllowance, travelOrders, rewardRefunds, airlinesTickets };

      // If we got data from API, use it
    if (clearances.length > 0 || onboardings.length > 0 || delegations.length > 0 || certificates.length > 0 || experiences.length > 0 || exits.length > 0 || assignments.length > 0 || assignmentTerminations.length > 0 || internalTransfers.length > 0 || leaveRequests.length > 0 || maternityLeave.length > 0 || housingAllowance.length > 0 || travelOrders.length > 0 || rewardRefunds.length > 0 || airlinesTickets.length > 0) {
      updateStatistics({
        clearances: clearances.length,
        onboardings: onboardings.length,
        delegations: delegations.length,
        certificates: certificates.length,
        experiences: experiences.length,
        exits: exits.length,
        assignments: assignments.length,
        assignmentTerminations: assignmentTerminations.length,
        internalTransfers: internalTransfers.length,
        travelOrders: travelOrders.length,
        rewardRefunds: rewardRefunds.length,
        airlinesTickets: airlinesTickets.length,
        leaveRequests: leaveRequests.length,
        maternityLeave: maternityLeave.length,
        housingAllowance: housingAllowance.length,
        pending: getPendingCount(clearances, onboardings, delegations, certificates, experiences, exits, assignments, assignmentTerminations, internalTransfers, maternityLeave, housingAllowance, leaveRequests)
      });

      updateRecentRequests(clearances, onboardings, delegations, certificates, experiences, exits, assignments, assignmentTerminations, internalTransfers, maternityLeave, housingAllowance, leaveRequests);
        console.log('✅ Dashboard updated with DATABASE data');
    } else {
        console.log('⚠️ No data from API');
        showError('لا توجد بيانات متاحة');
      }
    } catch (apiError) {
      console.error('❌ API failed:', apiError);
      showError('فشل تحميل البيانات من الخادم');
    }
    
    // Update quick actions
    updateQuickActions();

  } catch (error) {
    console.error('Dashboard loading error:', error);
    showError('فشل تحميل البيانات. يرجى التحقق من الاتصال بالخادم.');
  } finally {
    hideLoadingState();
  }
}

function updateStatistics(stats) {
  // Update stat cards
  const statElements = {
    totalRequests: document.getElementById('totalRequests'),
    pendingRequests: document.getElementById('pendingRequests'),
    clearanceRequests: document.getElementById('clearanceRequests'),
    delegationRequests: document.getElementById('delegationRequests')
  };

  if (statElements.totalRequests) {
    statElements.totalRequests.textContent = stats.clearances + stats.onboardings + stats.delegations;
  }
  
  if (statElements.pendingRequests) {
    statElements.pendingRequests.textContent = stats.pending;
  }
  
  if (statElements.clearanceRequests) {
    statElements.clearanceRequests.textContent = stats.clearances;
  }
  
  if (statElements.delegationRequests) {
    statElements.delegationRequests.textContent = stats.delegations;
  }
}

function getPendingCount(clearances, onboardings, delegations, certificates, experiences, exits, assignments, assignmentTerminations, internalTransfers, maternityLeave, housingAllowance, leaveRequests) {
  let pending = 0;
  
  (clearances || []).forEach(item => {
    if (item.status === 'قيد الانتظار' || item.status === 'قيد الاعتماد' || item.status === 'pending') pending++;
  });
  
  (onboardings || []).forEach(item => {
    if (item.status === 'قيد الانتظار' || item.status === 'قيد الاعتماد' || item.status === 'pending') pending++;
  });
  
  (delegations || []).forEach(item => {
    if (item.status === 'قيد الانتظار' || item.status === 'قيد الاعتماد' || item.status === 'pending') pending++;
  });
  
  (certificates || []).forEach(item => {
    if (item.status === 'قيد الانتظار' || item.status === 'قيد الاعتماد' || item.status === 'pending') pending++;
  });
  
  (experiences || []).forEach(item => {
    if (item.status === 'قيد الانتظار' || item.status === 'قيد الاعتماد' || item.status === 'pending') pending++;
  });
  
  (exits || []).forEach(item => {
    if (item.status === 'قيد الانتظار' || item.status === 'قيد الاعتماد' || item.status === 'pending') pending++;
  });
  
  (assignments || []).forEach(item => {
    if (item.status === 'قيد الانتظار' || item.status === 'قيد الاعتماد' || item.status === 'pending') pending++;
  });
  
  (assignmentTerminations || []).forEach(item => {
    if (item.status === 'قيد الانتظار' || item.status === 'قيد الاعتماد' || item.status === 'pending') pending++;
  });
  
  (internalTransfers || []).forEach(item => {
    if (item.status === 'قيد الانتظار' || item.status === 'قيد الاعتماد' || item.status === 'pending') pending++;
  });
  
  (maternityLeave || []).forEach(item => {
    if (item.status === 'قيد الانتظار' || item.status === 'قيد الاعتماد' || item.status === 'pending') pending++;
  });
  
  (housingAllowance || []).forEach(item => {
    if (item.status === 'قيد الانتظار' || item.status === 'قيد الاعتماد' || item.status === 'pending') pending++;
  });
  
  (leaveRequests || []).forEach(item => {
    if (item.status === 'قيد الانتظار' || item.status === 'قيد الاعتماد' || item.status === 'pending') pending++;
  });
  
  return pending;
}

function updateRecentRequests(clearances, onboardings, delegations, certificates, experiences, exits, assignments, assignmentTerminations, internalTransfers, maternityLeave, housingAllowance, leaveRequests) {
  const recentContainer = document.getElementById('last-table');
  if (!recentContainer) {
    console.warn('⚠️ Recent requests container not found (last-table)');
    return;
  }

  // DEBUG: Log the actual data types and values
  console.log('🔍 DEBUG - Raw data received:');
  console.log('- clearances:', clearances, 'Type:', typeof clearances, 'IsArray:', Array.isArray(clearances));
  console.log('- onboardings:', onboardings, 'Type:', typeof onboardings, 'IsArray:', Array.isArray(onboardings));
  console.log('- delegations:', delegations, 'Type:', typeof delegations, 'IsArray:', Array.isArray(delegations));
  console.log('- certificates:', certificates, 'Type:', typeof certificates, 'IsArray:', Array.isArray(certificates));
  console.log('- experiences:', experiences, 'Type:', typeof experiences, 'IsArray:', Array.isArray(experiences));
  console.log('- assignments:', assignments, 'Type:', typeof assignments, 'IsArray:', Array.isArray(assignments));
  console.log('- assignmentTerminations:', assignmentTerminations, 'Type:', typeof assignmentTerminations, 'IsArray:', Array.isArray(assignmentTerminations));
  console.log('- internalTransfers:', internalTransfers, 'Type:', typeof internalTransfers, 'IsArray:', Array.isArray(internalTransfers));
  console.log('- maternityLeave:', maternityLeave, 'Type:', typeof maternityLeave, 'IsArray:', Array.isArray(maternityLeave));
  console.log('- housingAllowance:', housingAllowance, 'Type:', typeof housingAllowance, 'IsArray:', Array.isArray(housingAllowance));

  // FIX: Ensure we have arrays, not numbers or other types
  const clearanceArray = Array.isArray(clearances) ? clearances : [];
  const onboardingArray = Array.isArray(onboardings) ? onboardings : [];
  const delegationArray = Array.isArray(delegations) ? delegations : [];
  const certificateArray = Array.isArray(certificates) ? certificates : [];
  const experienceArray = Array.isArray(experiences) ? experiences : [];
  const exitArray = Array.isArray(exits) ? exits : [];
  const assignmentArray = Array.isArray(assignments) ? assignments : [];
  const assignmentTerminationArray = Array.isArray(assignmentTerminations) ? assignmentTerminations : [];
  const internalTransferArray = Array.isArray(internalTransfers) ? internalTransfers : [];
  const maternityLeaveArray = Array.isArray(maternityLeave) ? maternityLeave : [];
  const housingAllowanceArray = Array.isArray(housingAllowance) ? housingAllowance : [];
  const leaveRequestsArray = Array.isArray(leaveRequests) ? leaveRequests : [];

  console.log('🔧 DEBUG - Converted to arrays:');
  console.log('- clearanceArray:', clearanceArray.length, 'items');
  console.log('- onboardingArray:', onboardingArray.length, 'items');
  console.log('- delegationArray:', delegationArray.length, 'items');
  console.log('- certificateArray:', certificateArray.length, 'items');
  console.log('- experienceArray:', experienceArray.length, 'items');
  console.log('- assignmentArray:', assignmentArray.length, 'items');
  console.log('- assignmentTerminationArray:', assignmentTerminationArray.length, 'items');
  console.log('- internalTransferArray:', internalTransferArray.length, 'items');
  console.log('- maternityLeaveArray:', maternityLeaveArray.length, 'items');
  console.log('- housingAllowanceArray:', housingAllowanceArray.length, 'items');
  console.log('- leaveRequestsArray:', leaveRequestsArray.length, 'items');

  // Combine all requests (now guaranteed to be arrays) - All 11 request types
  const allRequests = [
    ...clearanceArray.map(item => ({ ...item, type: 'clearance', type_ar: 'إخلاء طرف' })),
    ...onboardingArray.map(item => ({ ...item, type: 'onboarding', type_ar: 'مباشرة عمل' })),
    ...delegationArray.map(item => ({ ...item, type: 'delegation', type_ar: 'تفويض' })),
    ...certificateArray.map(item => ({ ...item, type: 'certificate', type_ar: 'شهادة تعريف' })),
    ...experienceArray.map(item => ({ ...item, type: 'experience', type_ar: 'شهادة خبرة' })),
    ...exitArray.map(item => ({ ...item, type: 'exit', type_ar: 'إنهاء العمل' })),
    ...assignmentArray.map(item => ({ ...item, type: 'assignment', type_ar: 'تكليف' })),
    ...assignmentTerminationArray.map(item => ({ ...item, type: 'assignment_termination', type_ar: 'إنهاء تكليف' })),
    ...internalTransferArray.map(item => ({ ...item, type: 'internal_transfer', type_ar: 'نقل داخلي' })),
    ...maternityLeaveArray.map(item => ({ ...item, type: 'maternity_leave', type_ar: 'إجازة أمومة' })),
    ...housingAllowanceArray.map(item => ({ ...item, type: 'housing_allowance', type_ar: 'بدل سكن' })),
    ...leaveRequestsArray.map(item => ({ ...item, type: 'leave_request', type_ar: 'طلب إجازة' }))
  ];

  console.log(`📊 Processing requests: clearances=${clearanceArray.length}, onboardings=${onboardingArray.length}, delegations=${delegationArray.length}, certificates=${certificateArray.length}, experiences=${experienceArray.length}, exits=${exitArray.length}, assignments=${assignmentArray.length}, assignmentTerminations=${assignmentTerminationArray.length}, internalTransfers=${internalTransferArray.length}, maternityLeave=${maternityLeaveArray.length}, housingAllowance=${housingAllowanceArray.length}, leaveRequests=${leaveRequestsArray.length}`);

  // FILTER TO SHOW ONLY PENDING REQUESTS (قيد الاعتماد)
  // Completed and rejected requests will be in employee-request-history.html
  const pendingRequests = allRequests.filter(request => {
    const status = (request.status || '').toLowerCase();
    
    // Include: pending, submitted, under review, awaiting approval
    const isPending = status.includes('قيد') || 
                     status.includes('pending') || 
                     status.includes('submitted') ||
                     status.includes('انتظار') ||
                     status.includes('مراجعة') ||
                     status.includes('اعتماد');
    
    // Exclude: completed, approved, rejected
    const isCompleted = status.includes('مكتمل') ||
                       status.includes('موافق') ||
                       status.includes('مرفوض') ||
                       status.includes('completed') ||
                       status.includes('approved') ||
                       status.includes('rejected');
    
    return isPending && !isCompleted;
  });

  console.log(`📋 Employee Dashboard: Showing ${pendingRequests.length} PENDING requests (filtered from ${allRequests.length} total)`);
  console.log(`ℹ️ Completed/rejected requests can be viewed in employee-request-history.html`);

  // Sort by creation date (most recent first)
  pendingRequests.sort((a, b) => {
    const dateA = new Date(b.created_at || b.request_date || b.createdAt || 0);
    const dateB = new Date(a.created_at || a.request_date || a.createdAt || 0);
    return dateA - dateB;
  });

  // Take only the 10 most recent pending requests
  const recentRequests = pendingRequests.slice(0, 10);

  // Get the tbody element
  const tbody = document.getElementById('reqRows');
  if (!tbody) {
    console.warn('⚠️ Table body not found (reqRows)');
    return;
  }

  if (pendingRequests.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;padding:40px;">
          <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;">✨</div>
          <div style="font-size: 18px; font-weight: 600; color: var(--text); margin-bottom: 8px;">
            لا توجد طلبات معلقة
          </div>
          <div style="font-size: 14px; color: var(--muted); margin-bottom: 20px;">
            جميع طلباتك إما مكتملة أو مرفوضة
          </div>
          <a href="employee-request-history.html" class="btn-professional btn-professional-primary" style="text-decoration: none;">
            📜 عرض سجل جميع الطلبات
          </a>
        </td>
      </tr>
    `;
    return;
  }

  const requestsHTML = recentRequests.map(request => {
    // التعامل مع البيانات المحلية والبيانات من الباك-إند
    const referenceNumber = request.reference_number || `#${request.id}`;
    const requestDate = request.request_date || request.created_at || request.createdAt || new Date().toISOString();
    
    // Get status badge class
    const statusClass = getStatusClass(request.status);
    
    return `
      <tr onclick="viewRequest('${request.type}', ${request.id})" style="cursor:pointer;">
        <td>${referenceNumber}</td>
        <td>${request.type_ar}</td>
        <td><span class="badge status-${statusClass}">${request.status}</span></td>
        <td>${formatDate(requestDate)}</td>
        <td>
          <button class="action" style="padding:4px 8px;font-size:12px;" onclick="event.stopPropagation(); viewRequest('${request.type}', ${request.id})">
            عرض
          </button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = requestsHTML;
  console.log(`✅ Rendered ${recentRequests.length} recent requests in table`);
}

function updateQuickActions() {
  const quickActionsContainer = document.getElementById('quickActions');
  if (!quickActionsContainer) return;

  quickActionsContainer.innerHTML = `
    <div class="quick-action-card" onclick="window.location.href='clearance-request.html'">
      <div class="action-icon">📄</div>
      <h3>طلب إخلاء طرف</h3>
      <p>إنشاء طلب إخلاء طرف جديد</p>
    </div>
    
    <div class="quick-action-card" onclick="window.location.href='direct-request.html'">
      <div class="action-icon">👤</div>
      <h3>طلب مباشرة عمل</h3>
      <p>إنشاء طلب مباشرة عمل جديد</p>
    </div>
    
    <div class="quick-action-card" onclick="window.location.href='delegation-request.html'">
      <div class="action-icon">🔄</div>
      <h3>طلب تفويض</h3>
      <p>إنشاء طلب تفويض جديد</p>
    </div>
    
    <div class="quick-action-card" onclick="window.location.href='employee-profile.html'">
      <div class="action-icon">⚙️</div>
      <h3>الملف الشخصي</h3>
      <p>عرض وتحديث الملف الشخصي</p>
    </div>
  `;

  // Check if user has commissioner privileges or elevated roles
  const user = apiClient.getCurrentUser();
  const isCommissioner = user?.isCommissioner || false;
  
  // Use rolePermissions for accurate role checking
  const hasAnyAdminRole = window.rolePermissions?.hasAnyRole(['ADMIN', 'HR', 'MANAGER']) || false;
  const isAdmin = window.rolePermissions?.isAdmin() || false;
  const hasElevatedRole = user?.roles?.some(role => ['ADMIN', 'HR', 'MANAGER'].includes(role)) || false;

  // Add commissioner/admin actions if user has elevated privileges
  if (isCommissioner || hasElevatedRole || hasAnyAdminRole) {
    console.log('👑 User has elevated privileges, adding admin actions');
    quickActionsContainer.innerHTML += `
      <div class="quick-action-card commissioner-action" onclick="window.location.href='admin-clearance-inbox.html'" style="border: 2px solid #f59e0b; background: #fef3c7;">
        <div class="action-icon">👨‍💼</div>
        <h3>صندوق إخلاء الطرف</h3>
        <p>إدارة طلبات إخلاء الطرف</p>
      </div>
      
      <div class="quick-action-card commissioner-action" onclick="window.location.href='admin-direct-inbox.html'" style="border: 2px solid #f59e0b; background: #fef3c7;">
        <div class="action-icon">📨</div>
        <h3>صندوق مباشرة العمل</h3>
        <p>إدارة طلبات مباشرة العمل</p>
      </div>
      
      <div class="quick-action-card commissioner-action" onclick="window.location.href='admin-dashboard.html'" style="border: 2px solid #16a34a; background: #dcfce7;">
        <div class="action-icon">🏢</div>
        <h3>لوحة الإدارة</h3>
        <p>الوصول للوحة الإدارة الكاملة</p>
      </div>
    `;
    
    // Add Role Management card for ADMIN/HR users
    if (hasAnyAdminRole) {
      console.log('🎭 Adding role management card for ADMIN/HR user');
      quickActionsContainer.innerHTML += `
        <div class="quick-action-card commissioner-action" onclick="window.location.href='admin-role-management.html'" style="border: 2px solid #8b5cf6; background: #f3e8ff;">
          <div class="action-icon">🎭</div>
          <h3>إدارة الأدوار والصلاحيات</h3>
          <p>تعيين وإزالة أدوار المستخدمين</p>
        </div>
      `;
    }
    
    // Add Permission Configuration card for ADMIN only
    if (isAdmin) {
      console.log('🔐 Adding permission configuration card for ADMIN user');
      quickActionsContainer.innerHTML += `
        <div class="quick-action-card commissioner-action" onclick="window.location.href='admin-permission-config.html'" style="border: 2px solid #dc2626; background: #fee2e2;">
          <div class="action-icon">🔐</div>
          <h3>تكوين الصلاحيات</h3>
          <p>إدارة صلاحيات الأدوار المختلفة</p>
        </div>
      `;
    }
  }
}

function setupEventListeners() {
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      apiClient.logout();
      showSuccess('تم تسجيل الخروج بنجاح');
      setTimeout(() => {
        window.location.href = 'login.html';
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

  // Navigation buttons with data-action="navigate"
  document.addEventListener('click', function(e) {
    const button = e.target.closest('[data-action="navigate"]');
    if (button) {
      const href = button.getAttribute('data-href');
      if (href) {
        console.log('🔄 Navigating to:', href);
        window.location.href = window.resolveFrontendPath ? window.resolveFrontendPath(href) : href;
      }
    }
    
    // Handle logout action
    const logoutBtn = e.target.closest('[data-action="logout"]');
    if (logoutBtn) {
      console.log('🔄 Logging out...');
      if (window.logout) {
        window.logout();
      } else {
        // Fallback logout
        localStorage.removeItem('authUser');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        window.location.href = window.resolveFrontendPath ? window.resolveFrontendPath('login.html') : 'login.html';
      }
    }
  });
}

// Helper functions
function viewRequest(type, id) {
  console.log(`🔍 ViewRequest called with type: "${type}", id: ${id}`);
  
  // Navigate to dedicated detail pages (all 11 request types)
  const detailPages = {
    'clearance': 'employee-clearance-detail.html',
    'onboarding': 'employee-onboarding-detail.html',
    'delegation': 'employee-delegation-detail.html',
    'certificate': 'employee-certificate-detail.html',
    'experience': 'employee-experience-detail.html',
    'exit': 'my-exit-requests.html',
    'assignment': 'employee-assignment-detail.html',
    'assignment_termination': 'employee-assignment-termination-detail.html',
    'internal_transfer': 'employee-internal-transfer-detail.html',
    'maternity_leave': 'employee-maternity-leave-request.html',
    'housing_allowance': 'employee-housing-allowance-detail.html'
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

function showRequestDetailsModal(type, id) {
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
    <div style="max-width: 600px; width: 90%; background: white; border-radius: 12px; padding: 20px; position: relative; max-height: 80vh; overflow-y: auto;">
      <button onclick="closeEmployeeModal()" style="position: absolute; top: 10px; left: 10px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px;">×</button>
      <h2 style="margin-top: 0; color: #1f2937; text-align: center;">تفاصيل الطلب</h2>
      <div id="modal-content">
        <p style="text-align: center; color: #6b7280;">جاري التحميل...</p>
      </div>
    </div>
  `;
  
  // Store modal reference globally for easy closing
  window.currentEmployeeModal = modal;
  
  document.body.appendChild(modal);
  
  // Load request details
  loadRequestDetails(type, id);
}

async function loadRequestDetails(type, id) {
  const modalContent = document.getElementById('modal-content');
  
  try {
    console.log('🔍 Modal: Loading details for', { type, id });
    console.log('🔍 Modal: Available data:', window.dashboardData);
    
    // Get the arrays from stored data (ensure they are arrays)
    const clearances = Array.isArray(window.dashboardData?.clearances) ? window.dashboardData.clearances : [];
    const onboardings = Array.isArray(window.dashboardData?.onboardings) ? window.dashboardData.onboardings : [];
    const delegations = Array.isArray(window.dashboardData?.delegations) ? window.dashboardData.delegations : [];
    const certificates = Array.isArray(window.dashboardData?.certificates) ? window.dashboardData.certificates : [];
    const experiences = Array.isArray(window.dashboardData?.experiences) ? window.dashboardData.experiences : [];
    
    console.log('🔍 Modal: Processed arrays:', { 
      clearances: clearances.length, 
      onboardings: onboardings.length, 
      delegations: delegations.length,
      certificates: certificates.length,
      experiences: experiences.length
    });
    
    // Try to get request details from the data we already have
    const allRequests = [
      ...clearances.map(item => ({ ...item, type: 'clearance', type_ar: 'إخلاء طرف' })),
      ...onboardings.map(item => ({ ...item, type: 'onboarding', type_ar: 'مباشرة عمل' })),
      ...delegations.map(item => ({ ...item, type: 'delegation', type_ar: 'تفويض' })),
      ...certificates.map(item => ({ ...item, type: 'certificate', type_ar: 'شهادة تعريف' })),
      ...experiences.map(item => ({ ...item, type: 'experience', type_ar: 'شهادة خبرة' }))
    ];
    
    console.log('🔍 Modal: Combined requests:', allRequests.length);
    const request = allRequests.find(r => r.id == id && r.type === type);
    console.log('🔍 Modal: Found request:', request);
    
    if (request) {
      modalContent.innerHTML = `
        <div style="line-height: 1.8;">
          <!-- معلومات الطلب الأساسية -->
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 15px 0; color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">📋 معلومات الطلب</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <p><strong>رقم المرجع:</strong> <span style="color: #3b82f6; font-weight: bold;">${request.reference_number || '#' + request.id}</span></p>
              <p><strong>النوع:</strong> <span style="color: #059669; font-weight: bold;">${request.type_ar}</span></p>
              <p><strong>الحالة:</strong> <span style="padding: 6px 12px; border-radius: 6px; background: #fef3c7; color: #92400e; font-weight: bold;">${request.status}</span></p>
              <p><strong>تاريخ الإنشاء:</strong> ${formatDate(request.created_at || request.request_date)}</p>
            </div>
          </div>
          
          <!-- معلومات الموظف المفصلة -->
          ${request.type === 'certificate' ? `
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e0f2fe;">
            <h3 style="margin: 0 0 15px 0; color: #1f2937; border-bottom: 2px solid #10b981; padding-bottom: 8px;">👤 معلومات شهادة التعريف</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <p><strong>اسم الموظف:</strong> <span style="color: #1f2937; font-weight: bold;">${request.employee_name || 'غير محدد'}</span></p>
              <p><strong>المهنة:</strong> <span style="color: #3b82f6;">${request.occupation || 'غير محدد'}</span></p>
              <p><strong>الجنسية:</strong> <span style="color: #059669; font-weight: bold;">${request.nationality || 'غير محدد'}</span></p>
              <p><strong>رقم الإقامة:</strong> <span style="color: #7c3aed;">${request.iqama_number || 'غير محدد'}</span></p>
              <p><strong>رقم الجواز:</strong> <span style="color: #6366f1;">${request.passport_number || 'غير محدد'}</span></p>
              <p><strong>الجامعة/مكان الدراسة:</strong> <span style="color: #0891b2;">${request.education_place || 'غير محدد'}</span></p>
            </div>
            ${request.request_notes ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0f2fe;">
              <p><strong>ملاحظات:</strong></p>
              <p style="background: white; padding: 12px; border-radius: 6px; margin: 0; border-left: 4px solid #3b82f6;">${request.request_notes}</p>
            </div>
            ` : ''}
          </div>
          ` : request.type === 'experience' ? `
          <div style="background: #fef7ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #f3e8ff;">
            <h3 style="margin: 0 0 15px 0; color: #1f2937; border-bottom: 2px solid #a855f7; padding-bottom: 8px;">👤 معلومات شهادة الخبرة</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <p><strong>اسم الموظف:</strong> <span style="color: #1f2937; font-weight: bold;">${request.employee_name || 'غير محدد'}</span></p>
              <p><strong>رقم الموظف:</strong> <span style="color: #3b82f6;">${request.employee_number || 'غير محدد'}</span></p>
              <p><strong>الوظيفة:</strong> <span style="color: #059669; font-weight: bold;">${request.position || 'غير محدد'}</span></p>
              <p><strong>القسم:</strong> <span style="color: #7c3aed;">${request.department || 'غير محدد'}</span></p>
              <p><strong>الجنسية:</strong> <span style="color: #6366f1;">${request.nationality || 'غير محدد'}</span></p>
              <p><strong>نوع الخدمة:</strong> <span style="color: #0891b2;">${request.service_type || 'غير محدد'}</span></p>
              <p><strong>تاريخ بداية العقد:</strong> <span style="color: #ea580c;">${request.start_date || 'غير محدد'}</span></p>
              <p><strong>تاريخ نهاية العقد:</strong> <span style="color: #dc2626;">${request.end_date || 'غير محدد'}</span></p>
            </div>
            ${request.reason_for_leaving ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f3e8ff;">
              <p><strong>سبب ترك العمل:</strong></p>
              <p style="background: white; padding: 12px; border-radius: 6px; margin: 0; border-left: 4px solid #a855f7;">${request.reason_for_leaving}</p>
            </div>
            ` : ''}
          </div>
          ` : `
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e0f2fe;">
            <h3 style="margin: 0 0 15px 0; color: #1f2937; border-bottom: 2px solid #10b981; padding-bottom: 8px;">👤 معلومات الموظف الكاملة</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <p><strong>اسم الموظف:</strong> <span style="color: #1f2937; font-weight: bold;">${request.employee_name || request.employee?.name || 'غير محدد'}</span></p>
              ${request.employee_email || request.employee?.email ? `
              <p><strong>البريد الإلكتروني:</strong> <span style="color: #3b82f6;">${request.employee_email || request.employee?.email}</span></p>
              ` : ''}
              <p><strong>القسم:</strong> <span style="color: #059669; font-weight: bold;">${request.employee_dept || request.employee?.department || request.department || 'غير محدد'}</span></p>
              ${request.employee_number ? `
              <p><strong>رقم الموظف:</strong> <span style="color: #7c3aed;">${request.employee_number}</span></p>
              ` : ''}
            </div>
            
            <!-- معلومات إضافية للموظف -->
            ${request.job_title || request.phone ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0f2fe;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                ${request.job_title ? `
                <p><strong>المسمى الوظيفي:</strong> <span style="color: #6366f1;">${request.job_title}</span></p>
                ` : ''}
                ${request.phone ? `
                <p><strong>رقم الهاتف:</strong> <span style="color: #059669;">${request.phone}</span></p>
                ` : ''}
                <p><strong>الحالة الوظيفية:</strong> <span style="color: #10b981; font-weight: bold;">نشط</span></p>
              </div>
            </div>
            ` : ''}
          </div>
          `}
          
          <!-- السبب والتفاصيل -->
          ${request.reason ? `
          <div style="background: #fef7ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #f3e8ff;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937; border-bottom: 2px solid #a855f7; padding-bottom: 8px;">📝 السبب والتفاصيل</h3>
            <p style="background: white; padding: 12px; border-radius: 6px; margin: 0; border-left: 4px solid #a855f7; line-height: 1.6;">${request.reason}</p>
          </div>
          ` : ''}
          
          <!-- تواريخ مهمة -->
          ${request.last_work_day ? `
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #fecaca;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937; border-bottom: 2px solid #ef4444; padding-bottom: 8px;">📅 تواريخ مهمة</h3>
            <p><strong>آخر يوم عمل:</strong> <span style="color: #dc2626; font-weight: bold;">${formatDate(request.last_work_day)}</span></p>
          </div>
          ` : ''}
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <button onclick="closeEmployeeModal()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">إغلاق</button>
        </div>
      `;
    } else {
      modalContent.innerHTML = `
        <p style="text-align: center; color: #ef4444;">لم يتم العثور على تفاصيل هذا الطلب</p>
        <div style="text-align: center; margin-top: 20px;">
          <button onclick="closeEmployeeModal()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">إغلاق</button>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading request details:', error);
    modalContent.innerHTML = `
      <p style="text-align: center; color: #ef4444;">حدث خطأ في تحميل التفاصيل</p>
      <div style="text-align: center; margin-top: 20px;">
        <button onclick="closeEmployeeModal()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">إغلاق</button>
      </div>
    `;
  }
}

// Global function to close employee modal
function closeEmployeeModal() {
  if (window.currentEmployeeModal) {
    window.currentEmployeeModal.remove();
    window.currentEmployeeModal = null;
    console.log('✅ Employee modal closed');
  }
}

function getStatusClass(status) {
  const statusMap = {
    'قيد الانتظار': 'pending',
    'قيد المعالجة': 'processing',
    'موافق عليه': 'approved',
    'مرفوض': 'rejected',
    'مكتمل': 'completed'
  };
  
  return statusMap[status] || 'default';
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

function showNewRequestModal() {
  // Create modal for new request selection
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>إنشاء طلب جديد</h3>
        <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="modal-body">
        <div class="request-options">
          <div class="option-card" onclick="window.location.href='clearance-request.html'">
            <div class="option-icon">📄</div>
            <h4>إخلاء طرف</h4>
            <p>طلب إخلاء طرف من الوظيفة</p>
          </div>
          
          <div class="option-card" onclick="window.location.href='direct-request.html'">
            <div class="option-icon">👤</div>
            <h4>مباشرة عمل</h4>
            <p>طلب مباشرة عمل جديد</p>
          </div>
          
          <div class="option-card" onclick="window.location.href='delegation-request.html'">
            <div class="option-icon">🔄</div>
            <h4>تفويض</h4>
            <p>طلب تفويض صلاحيات</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close modal when clicking outside
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.remove();
    }
  });
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

// Simple commissioner functionality
let hasCommissionerAccess = false;

// Check if user has commissioner delegation permissions
function checkCommissionerAccess() {
  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  if (!authUser) return false;
  
  // Check if user has accepted delegation with approval permissions
  const delegations = JSON.parse(localStorage.getItem('delegations') || '[]');
  const userEmail = authUser.email?.toLowerCase();
  
  return delegations.some(d => {
    return d.status === 'active' && 
           (d.to || '').toLowerCase() === userEmail &&
           d.active &&
           (!d.validTo || d.validTo >= Date.now()) &&
           (d.scopes || []).some(scope => ['approve_clearance', 'approve_direct'].includes(scope));
  });
}

// Initialize commissioner functionality
function initializeCommissionerFeatures() {
  const currentAccess = checkCommissionerAccess();
  
  if (currentAccess !== hasCommissionerAccess) {
    hasCommissionerAccess = currentAccess;
    toggleCommissionerButton();
    
    if (currentAccess) {
      console.log('Commissioner delegation accepted, showing inbox button');
      showSuccess('تم قبول التفويض. يمكنك الآن الوصول إلى وارد الطلبات.');
    } else {
      console.log('Commissioner delegation revoked, hiding inbox button');
    }
  }
}

// Toggle commissioner button visibility
function toggleCommissionerButton() {
  const commissionerBtn = document.getElementById('commissionerInboxBtn');
  if (commissionerBtn) {
    if (hasCommissionerAccess) {
      commissionerBtn.style.display = 'inline-flex';
    } else {
      commissionerBtn.style.display = 'none';
    }
  }
}

// Monitor delegation changes for commissioner access
window.addEventListener('storage', function(e) {
  if (e.key === 'delegations') {
    setTimeout(() => {
      initializeCommissionerFeatures();
    }, 100);
  }
});

// Initialize commissioner features on page load
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    initializeCommissionerFeatures();
  }, 1000);
});

// Add dashboard-specific CSS
const style = document.createElement('style');
style.textContent = `
  .dashboard-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .stat-card {
    background: white;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    text-align: center;
  }
  
  .stat-number {
    font-size: 2.5em;
    font-weight: bold;
    color: #2B6CB0;
    margin-bottom: 10px;
  }
  
  .stat-label {
    color: #6b7280;
    font-size: 14px;
  }
  
  .request-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .request-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
  
  .request-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .request-type {
    background: #f3f4f6;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    color: #374151;
  }
  
  .request-status {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
  }
  
  .status-pending { background: #fef3c7; color: #92400e; }
  .status-processing { background: #dbeafe; color: #1e40af; }
  .status-approved { background: #d1fae5; color: #065f46; }
  .status-rejected { background: #fee2e2; color: #991b1b; }
  .status-completed { background: #d1fae5; color: #065f46; }
  
  .quick-action-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .quick-action-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  }
  
  .action-icon {
    font-size: 3em;
    margin-bottom: 15px;
  }
  
  .quick-action-card h3 {
    color: #2B6CB0;
    margin-bottom: 10px;
  }
  
  .quick-action-card p {
    color: #6b7280;
    font-size: 14px;
  }
  
  .empty-state {
    text-align: center;
    padding: 40px;
    color: #6b7280;
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    border-radius: 12px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #6b7280;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .request-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }
  
  .option-card {
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .option-card:hover {
    border-color: #2B6CB0;
    background: #eff6ff;
  }
  
  .option-icon {
    font-size: 2em;
    margin-bottom: 10px;
  }
  
  .loading-placeholder {
    display: none;
    text-align: center;
    padding: 20px;
    color: #6b7280;
  }
`;
document.head.appendChild(style);

// Stage-E: override pending count to exclude failed
(function(){
  function getPendingCountV2(clearances, onboardings, delegations, certificates, experiences){
    const isPending = (s)=> (s === 'قيد الاعتماد' || s === 'قيد المراجعة' || s === 'قيد المعالجة' || s === 'pending');
    let pending = 0;
    
    // Safe handling of potentially undefined arrays
    const arrays = [clearances, onboardings, delegations, certificates, experiences].filter(arr => arr != null);
    arrays.forEach(arr => {
      if (Array.isArray(arr)) {
        arr.forEach(item => { 
          if (item && !item.syncFailed && isPending(item.status)) pending++; 
        });
      }
    });
    return pending;
  }
  try { getPendingCount = getPendingCountV2; } catch (_) { window.getPendingCount = getPendingCountV2; }
})();

// Stage-E: decorate request cards with sync chips
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
    document.querySelectorAll('.request-card').forEach(card => {
      const statusEl = card.querySelector('.request-status');
      if (!statusEl || statusEl.querySelector('.sync-chip')) return;
      const refEl = card.querySelector('h4');
      if (!refEl) return;
      const m = refEl.textContent.match(/#([A-Za-z0-9_-]+)/);
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
        chip.addEventListener('click', (e)=>{ e.stopPropagation(); window.retrySync && window.retrySync(item.optimisticId || item.id); });
        statusEl.appendChild(chip);
      } else if (item.syncing) {
        const chip = document.createElement('span');
        chip.className = 'sync-chip pending';
        chip.title = 'جاري المزامنة';
        chip.textContent = '⏳';
        statusEl.appendChild(chip);
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
  if (document.getElementById('sync-chip-styles-empdash')) return;
  const st = document.createElement('style');
  st.id = 'sync-chip-styles-empdash';
  st.textContent = `.sync-chip{font-size:11px;padding:2px 6px;border-radius:8px;margin-inline-start:6px}.sync-chip.pending{background:#fff7ed;color:#92400e}.sync-chip.failed{background:#fee2e2;color:#991b1b}`;
  document.head.appendChild(st);
})();

/**
 * ========================================
 * Inbox Dropdown Functions
 * ========================================
 */

/**
 * Toggle inbox menu dropdown
 */
function toggleInboxMenu(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('inboxMenu');
  if (menu) {
    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';
  }
}

/**
 * Close inbox menu when clicking outside
 */
document.addEventListener('click', function(event) {
  const dropdown = document.getElementById('inboxDropdown');
  const menu = document.getElementById('inboxMenu');
  
  if (dropdown && menu && !dropdown.contains(event.target)) {
    menu.style.display = 'none';
  }
});

/**
 * Initialize inbox buttons
 */
async function initializeInboxButtons() {
  try {
    const user = apiClient.getCurrentUser();
    if (!user) return;
    
    // Check if user has approval roles
    const approvalRoles = ['MANAGER', 'HR', 'FINANCE', 'IT', 'ADMIN'];
    const userRoles = user.roles || [user.role?.toUpperCase()] || [];
    const hasApprovalRole = userRoles.some(role => approvalRoles.includes(role.toUpperCase()));
    
    // Check commissioner status
    let hasCommissionerAccess = false;
    if (window.CommissionerManager) {
      const commissionerStatus = await window.CommissionerManager.getUserCommissionerStatus(user.email);
      hasCommissionerAccess = commissionerStatus && commissionerStatus.isCommissioner && commissionerStatus.status === 'active';
    }
    
    // Show dropdown if user has any approval capabilities
    const dropdown = document.getElementById('inboxDropdown');
    if (dropdown && (hasApprovalRole || hasCommissionerAccess)) {
      dropdown.style.display = 'inline-block';
      
      // Show/hide specific inbox buttons
      const roleInboxBtn = document.getElementById('roleInboxBtn');
      const commissionerInboxBtn = document.getElementById('commissionerInboxBtn');
      
      if (hasApprovalRole && roleInboxBtn) {
        roleInboxBtn.style.display = 'flex';
      }
      
      if (hasCommissionerAccess && commissionerInboxBtn) {
        commissionerInboxBtn.style.display = 'flex';
      }
      
      // Update counts
      await updateInboxCounts();
      
      console.log('✅ Inbox dropdown initialized', { hasApprovalRole, hasCommissionerAccess });
    } else {
      console.log('ℹ️ No approval capabilities - inbox hidden');
    }
  } catch (error) {
    console.error('Failed to initialize inbox buttons:', error);
  }
}

/**
 * Update pending counts for inbox badges
 */
async function updateInboxCounts() {
  try {
    const user = apiClient.getCurrentUser();
    if (!user) return;
    
    // Update role-based pending count
    const roleInboxBtn = document.getElementById('roleInboxBtn');
    if (roleInboxBtn && roleInboxBtn.style.display !== 'none') {
      try {
        const response = await apiClient.makeRequest('/approvals/pending');
        const allPending = response?.data || [];
        
        // Count unique requests (not total approvals) 
        // User with multiple roles sees same request multiple times
        const uniqueRequests = new Set(
          allPending.map(p => `${p.request_type}-${p.request_id}`)
        );
        const count = uniqueRequests.size;
        
        const badge = document.getElementById('rolePendingCount');
        if (badge) {
          badge.textContent = count;
          badge.className = count > 0 ? 'inbox-badge' : 'inbox-badge zero';
        }
      } catch (error) {
        console.error('Failed to fetch role pending count:', error);
      }
    }
    
    // Update commissioner pending count
    const commissionerInboxBtn = document.getElementById('commissionerInboxBtn');
    if (commissionerInboxBtn && commissionerInboxBtn.style.display !== 'none') {
      try {
        // Get commissioner scopes
        if (window.CommissionerManager) {
          const status = await window.CommissionerManager.getUserCommissionerStatus(user.email);
          if (status && status.isCommissioner) {
            // For now, use a placeholder count
            // In full implementation, would fetch actual pending requests filtered by scopes
            const badge = document.getElementById('commissionerPendingCount');
            if (badge) {
              badge.textContent = '0'; // Placeholder
              badge.className = 'inbox-badge zero';
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch commissioner pending count:', error);
      }
    }
  } catch (error) {
    console.error('Failed to update inbox counts:', error);
  }
}

// Call initialization after dashboard loads
setTimeout(async () => {
  await initializeInboxButtons();
}, 2000);

// Poll for new approvals every 30 seconds
setInterval(async () => {
  await updateInboxCounts();
}, 30000);

// Make functions global for onclick handlers
window.toggleInboxMenu = toggleInboxMenu;
