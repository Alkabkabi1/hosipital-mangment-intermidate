// Admin Approval Status Dashboard
// Shows approval workflow progress for all requests

document.addEventListener('DOMContentLoaded', function() {
  if (typeof window.waitForDependencies === 'function') {
    window.waitForDependencies(() => {
      initializePage();
    }, ['apiClient', 'DetailUtils']);
  } else {
    setTimeout(initializePage, 500);
  }
});

let allRequests = [];
let filteredRequests = [];
let currentUserId = null;

function initializePage() {
  // Check authentication
  if (!window.DetailUtils.requireAuth()) return;
  
  // Check authorization - Only for managers, admins, and commissioners
  if (!canAccessApprovalStatus()) {
    window.DetailUtils.showError('ليس لديك صلاحية للوصول إلى هذه الصفحة. هذه الصفحة متاحة فقط للمدراء والإداريين والمفوضين.');
    setTimeout(() => {
      window.location.href = window.resolveFrontendPath ? 
        window.resolveFrontendPath('employee-dashboard.html') : 
        'employee-dashboard.html';
    }, 3000);
    return;
  }

  // Get current user ID
  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  currentUserId = authUser?.id;
  
  console.log('✅ Approval status page initialized for user ID:', currentUserId);
  console.log('📋 User roles:', authUser?.roles);

  // Load approval status
  loadApprovalStatus();
}

/**
 * Check if user can access approval status page
 * ONLY: Admins, Managers, or Active Commissioners
 * HR role alone is NOT sufficient - they're regular employees unless also ADMIN/MANAGER
 */
function canAccessApprovalStatus() {
  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  if (!authUser) return false;
  
  // Check 1: ADMIN role
  if (window.rolePermissions && window.rolePermissions.hasRole('ADMIN')) {
    console.log('✅ Access granted: User is ADMIN');
    return true;
  }
  
  // Check 2: MANAGER role
  if (window.rolePermissions && window.rolePermissions.hasRole('MANAGER')) {
    console.log('✅ Access granted: User is MANAGER');
    return true;
  }
  
  // Check 3: Admin role (legacy)
  if (authUser.role === 'admin') {
    console.log('✅ Access granted: User is admin (legacy)');
    return true;
  }
  
  // Check 4: Active commissioner
  const isCommissioner = checkActiveCommissioner();
  if (isCommissioner) {
    console.log('✅ Access granted: User is active commissioner');
    return true;
  }
  
  // HR, FINANCE, IT roles alone are NOT sufficient
  console.log('❌ Access denied: User must be ADMIN, MANAGER, or Commissioner');
  console.log('   Current roles:', authUser.roles || [authUser.role]);
  return false;
}

/**
 * Check if user has active commissioner ticket
 */
function checkActiveCommissioner() {
  const delegations = JSON.parse(localStorage.getItem('delegations') || '[]');
  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  const userEmail = authUser?.email?.toLowerCase();
  
  if (!userEmail) return false;
  
  // Check for active commissioner tickets
  const hasActiveTicket = delegations.some(d => {
    return d.status === 'active' && 
           (d.to || '').toLowerCase() === userEmail &&
           d.active &&
           (!d.validTo || d.validTo >= Date.now()) &&
           (d.scopes || []).length > 0; // Has any scopes
  });
  
  return hasActiveTicket;
}

async function loadApprovalStatus() {
  try {
    showLoading();
    
    console.log('📡 Loading all requests with approval details...');
    
    const apiClient = window.DetailUtils.getApiClient();
    if (!apiClient) {
      throw new Error('API client not available');
    }

    // Get all pending approvals for the admin to see
    const pendingResponse = await apiClient.makeRequest('/approvals/pending');
    const pendingApprovals = pendingResponse.data || pendingResponse || [];
    
    console.log('📊 Pending approvals:', pendingApprovals.length);
    console.log('📋 Unique requests:', [...new Set(pendingApprovals.map(a => `${a.request_type}-${a.request_id}`))]);
    
    // Get approval progress for each unique request
    const uniqueRequests = new Map();
    
    for (const approval of pendingApprovals) {
      const key = `${approval.request_type}-${approval.request_id}`;
      if (!uniqueRequests.has(key)) {
        uniqueRequests.set(key, {
          id: approval.request_id,
          type: approval.request_type,
          type_ar: approval.request_type === 'clearance' ? 'إخلاء طرف' :
                   approval.request_type === 'onboarding' ? 'مباشرة عمل' :
                   approval.request_type === 'delegation' ? 'تفويض' :
                   approval.request_type === 'certificate' ? 'شهادة تعريف' :
                   approval.request_type === 'experience' ? 'شهادة خبرة' :
                   approval.request_type === 'leave' ? 'إجازة' :
                   approval.request_type === 'exit' ? 'إنهاء عمل' :
                   approval.request_type === 'assignment' ? 'قرار تكليف' :
                   approval.request_type === 'assignment_termination' ? 'إنهاء تكليف' :
                   approval.request_type === 'internal_transfer' ? 'نقل داخلي' :
                   approval.request_type === 'maternity_leave' ? 'إجازة أمومة' :
                   approval.request_type === 'housing_allowance' ? 'بدل سكن أطباء سعوديين' :
                   approval.request_type === 'travel_order' ? 'أمر سفر' :
                   approval.request_type === 'reward_refund' ? 'مكافأة نهاية الخدمة' :
                   approval.request_type === 'airlines_ticket' ? 'تذكرة طيران' :
                   approval.request_type,
          reference_number: approval.reference_number || approval.request_reference || `#${approval.request_id}`,
          employee_name: approval.request_owner_name || approval.employee_name || 'غير محدد',
          employee_email: approval.request_owner_email || approval.employee_email,
          created_at: approval.created_at || approval.request_date,
          approved_count: approval.approved_count || 0,
          total_approvers: approval.total_approvers || 0
        });
        
        console.log(`📋 Added request ${key}:`, uniqueRequests.get(key));
      }
    }
    
    // Get full approval progress for each request
    const requestsWithProgress = [];
    
    // Only these types support multi-approval
    const supportedTypes = ['clearance', 'onboarding', 'delegation', 'direct', 'certificate', 'experience', 'leave', 'exit', 'assignment', 'assignment_termination', 'internal_transfer', 'maternity_leave', 'housing_allowance', 'travel_order', 'reward_refund', 'airlines_ticket'];
    
    for (const request of uniqueRequests.values()) {
      // Skip unsupported types
      if (!supportedTypes.includes(request.type)) {
        console.log(`ℹ️ Skipping ${request.type} ${request.id} - multi-approval not supported for this type`);
        requestsWithProgress.push(request);
        continue;
      }
      
      try {
        const progressResponse = await apiClient.makeRequest(`/requests/${request.type}/${request.id}/approvals`);
        const progress = progressResponse.data || progressResponse;
        
        requestsWithProgress.push({
          ...request,
          approval_progress: progress
        });
      } catch (e) {
        console.warn(`⚠️ Could not get full progress for ${request.type} ${request.id}:`, e.message);
        // Add without detailed progress
        requestsWithProgress.push(request);
      }
    }
    
    allRequests = requestsWithProgress;
    filteredRequests = [...allRequests];

    const certificateRequests = allRequests.filter(r => r.type === 'certificate').length;
    const experienceRequests = allRequests.filter(r => r.type === 'experience').length;

    console.log('✅ Loaded', allRequests.length, 'requests with approval details');
    console.log(`📜 Certificate/Experience breakdown: ${certificateRequests} certificate, ${experienceRequests} experience requests`);
    
    updateStatistics();
    displayRequests();
    
  } catch (error) {
    console.error('Error loading approval status:', error);
    showError('حدث خطأ في تحميل حالة الموافقات');
  }
}

function updateStatistics() {
  const total = allRequests.length;
  const pending = allRequests.filter(r => 
    r.approval_progress && r.approval_progress.pending_count > 0
  ).length;
  const complete = allRequests.filter(r => 
    r.approval_progress && r.approval_progress.final_decision === 'approved'
  ).length;
  const yourPending = allRequests.filter(r => {
    if (!r.approval_progress || !r.approval_progress.approvals) return false;
    return r.approval_progress.approvals.some(a => 
      a.approver_id === currentUserId && a.status === 'pending'
    );
  }).length;
  
  document.getElementById('totalRequests').textContent = total;
  document.getElementById('pendingApprovals').textContent = pending;
  document.getElementById('fullyApproved').textContent = complete;
  document.getElementById('yourPending').textContent = yourPending;
}

function displayRequests() {
  console.log('🔍 Starting display of', filteredRequests.length, 'filtered requests');
  
  // Enhanced request separation with better completion detection
  const pendingRequests = filteredRequests.filter(r => !isRequestCompleted(r));
  const completedRequests = filteredRequests.filter(r => isRequestCompleted(r));
  
  console.log('📊 Enhanced request filtering:', {
    total: filteredRequests.length,
    pending: pendingRequests.length,
    completed: completedRequests.length,
    pendingStatuses: [...new Set(pendingRequests.map(r => r.status))],
    completedStatuses: [...new Set(completedRequests.map(r => r.status))]
  });
  
  console.log('📊 Display split:', { 
    pending: pendingRequests.length, 
    completed: completedRequests.length,
    pendingIds: pendingRequests.map(r => `${r.type}-${r.id}`),
    completedIds: completedRequests.map(r => `${r.type}-${r.id}`)
  });
  
  // Update counts
  document.getElementById('pendingCount').textContent = `(${pendingRequests.length})`;
  document.getElementById('completedCount').textContent = `(${completedRequests.length})`;
  
  // Display pending requests
  const pendingContainer = document.getElementById('pendingRequestsContainer');
  if (pendingRequests.length === 0) {
    pendingContainer.innerHTML = `
      <div class="empty-state" style="padding: 40px 20px;">
        <div class="empty-icon" style="font-size: 48px;">✨</div>
        <h3>لا توجد طلبات معلقة</h3>
        <p>جميع الطلبات إما مكتملة أو تمت تصفيتها</p>
      </div>
    `;
    console.log('📋 No pending requests to display');
  } else {
    pendingContainer.innerHTML = pendingRequests.map(request => renderRequestCard(request)).join('');
    const certificateCards = pendingRequests.filter(r => r.type === 'certificate').length;
    const experienceCards = pendingRequests.filter(r => r.type === 'experience').length;
    console.log(`📋 Displayed ${pendingRequests.length} pending requests: ${certificateCards} certificate, ${experienceCards} experience`);
  }

  // Display completed requests
  const completedContainer = document.getElementById('completedRequestsContainer');
  if (completedRequests.length === 0) {
    completedContainer.innerHTML = `
      <div class="empty-state" style="padding: 40px 20px;">
        <div class="empty-icon" style="font-size: 48px;">📋</div>
        <p>لا توجد طلبات مكتملة</p>
      </div>
    `;
    console.log('📋 No completed requests to display');
  } else {
    completedContainer.innerHTML = completedRequests.map(request => renderRequestCard(request, true)).join('');
    const certificateCards = completedRequests.filter(r => r.type === 'certificate').length;
    const experienceCards = completedRequests.filter(r => r.type === 'experience').length;
    console.log(`📋 Displayed ${completedRequests.length} completed requests: ${certificateCards} certificate, ${experienceCards} experience`);
  }
}

/**
 * Check if a request is completed (fully approved OR rejected)
 */
function isRequestCompleted(request) {
  if (!request.approval_progress) return false;
  
  const progress = request.approval_progress;
  
  // Check 1: Final decision is approved or rejected
  if (progress.final_decision === 'approved' || progress.final_decision === 'rejected') {
    return true;
  }
  
  // Check 2: No pending approvals and has total approvers
  if (progress.pending_count === 0 && progress.total_approvers > 0) {
    return true;
  }
  
  // Check 3: Request status indicates completion
  const completedStatuses = ['مكتمل', 'مرفوض', 'completed', 'approved', 'rejected'];
  if (request.status && completedStatuses.some(s => request.status.includes(s))) {
    return true;
  }
  
  return false;
}

function renderRequestCard(request, isCompleted = false) {
  const progress = request.approval_progress || {};
  const approvals = progress.approvals || [];

  const totalApprovers = progress.total_approvers || approvals.length || 0;
  const approvedCount = progress.approved_count || 0;
  const rejectedCount = progress.rejected_count || 0;
  const progressPercent = totalApprovers > 0 ? (approvedCount / totalApprovers * 100) : 0;
  
  // Calculate if request is overdue (72+ hours)
  const createdTime = new Date(request.created_at || request.request_date);
  const now = new Date();
  const hoursSinceCreation = (now - createdTime) / (1000 * 60 * 60);
  const isOverdue = hoursSinceCreation >= 72 && !isCompleted;
  const daysOverdue = Math.floor(hoursSinceCreation / 24);

  // Page logs for certificate and experience cards
  if (request.type === 'certificate' || request.type === 'experience') {
    console.log(`📜 RENDERING ${request.type.toUpperCase()} CARD:`, {
      id: request.id,
      reference: request.reference_number,
      employee: request.employee_name,
      type_ar: request.type_ar,
      progress: `${approvedCount}/${totalApprovers}`,
      final_decision: progress.final_decision,
      is_completed: isCompleted
    });
  }
  
  // Find next approver (only for pending requests)
  const nextApprover = !isCompleted ? approvals.find(a => a.status === 'pending') : null;
  const isYourTurn = nextApprover && nextApprover.approver_id === currentUserId;
  
  // Define colors for each request type
  const typeColors = {
    onboarding: {
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      border: '#10b981',
      icon: '📝',
      bg: '#f0fdf4',
      text: '#065f46'
    },
    clearance: {
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      border: '#ef4444',
      icon: '📋',
      bg: '#fef2f2',
      text: '#991b1b'
    },
    delegation: {
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      border: '#f59e0b',
      icon: '🔄',
      bg: '#fffbeb',
      text: '#92400e'
    },
    certificate: {
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      border: '#8b5cf6',
      icon: '📜',
      bg: '#faf5ff',
      text: '#6b21a8'
    },
    experience: {
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      border: '#06b6d4',
      icon: '📄',
      bg: '#f0f9ff',
      text: '#075985'
    },
    leave: {
      gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
      border: '#14b8a6',
      icon: '🏖️',
      bg: '#f0fdfa',
      text: '#115e59'
    },
    exit: {
      gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      border: '#ec4899',
      icon: '🚪',
      bg: '#fdf2f8',
      text: '#9f1239'
    },
    direct: { // Alias for onboarding
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      border: '#10b981',
      icon: '📝',
      bg: '#f0fdf4',
      text: '#065f46'
    },
    assignment: {
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      border: '#3b82f6',
      icon: '📋',
      bg: '#eff6ff',
      text: '#1e40af'
    },
    assignment_termination: {
      gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      border: '#f97316',
      icon: '⏹️',
      bg: '#fff7ed',
      text: '#9a3412'
    },
    internal_transfer: {
      gradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
      border: '#a855f7',
      icon: '↔️',
      bg: '#faf5ff',
      text: '#6b21a8'
    },
    maternity_leave: {
      gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      border: '#ec4899',
      icon: '🤰',
      bg: '#fdf2f8',
      text: '#9f1239'
    },
    housing_allowance: {
      gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      border: '#22c55e',
      icon: '🏠',
      bg: '#f0fdf4',
      text: '#166534'
    },
    travel_order: {
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      border: '#0ea5e9',
      icon: '✈️',
      bg: '#f0f9ff',
      text: '#075985'
    },
    reward_refund: {
      gradient: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
      border: '#eab308',
      icon: '💰',
      bg: '#fefce8',
      text: '#854d0e'
    },
    airlines_ticket: {
      gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      border: '#6366f1',
      icon: '🎫',
      bg: '#eef2ff',
      text: '#3730a3'
    }
  };
  
  const typeStyle = typeColors[request.type] || {
    gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
    border: '#6b7280',
    icon: '📄',
    bg: '#f9fafb',
    text: '#374151'
  };
  
  // Add visual indicator for completed status and overdue
  const cardStyle = `border-left: 4px solid ${isOverdue ? 'var(--danger)' : typeStyle.border}; background: ${isCompleted ? '#f8fafc' : (isOverdue ? '#fef2f2' : typeStyle.bg)}; box-shadow: 0 2px 8px rgba(0,0,0,${isCompleted ? '0.05' : '0.1'});` + 
    (isCompleted ? ' opacity: 0.75;' : '');
  
  return `
    <div class="request-card" style="${cardStyle}">
      ${isOverdue ? `
        <div style="background: linear-gradient(135deg, #fee2e2, #fecaca); border: 2px solid #ef4444; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">⚠️</span>
          <div>
            <div style="font-weight: 700; color: #991b1b;">طلب متأخر - ${daysOverdue} يوم</div>
            <div style="font-size: 13px; color: #7f1d1d;">تجاوز الطلب الحد الزمني المسموح (72 ساعة)</div>
          </div>
        </div>
      ` : ''}
      <div class="request-header">
        <div>
          <span class="request-type" style="background: ${typeStyle.gradient}; padding: 6px 14px; border-radius: 8px; color: white; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
            ${typeStyle.icon} ${request.type_ar}
          </span>
          <div class="request-title" style="margin-top: 8px; font-size: 18px; font-weight: 700; color: ${typeStyle.text};">
            ${request.reference_number || '#' + request.id}
          </div>
        </div>
        <div style="text-align: left;">
          <div style="font-size: 13px; color: var(--muted);">الموظف</div>
          <div style="font-weight: 600;">${request.employee_name || request.employee?.name || 'غير محدد'}</div>
        </div>
      </div>
      
      <div class="approval-progress">
        <div class="progress-header">
          <span class="progress-text">
            ${approvedCount} من ${totalApprovers} موافقات
          </span>
          <span class="progress-text" style="color: ${progressPercent === 100 ? 'var(--success)' : 'var(--warning)'};">
            ${Math.round(progressPercent)}%
          </span>
        </div>
        <div class="progress-bar" style="background: #e5e7eb; height: 10px; border-radius: 6px; overflow: hidden; border: 1px solid rgba(0,0,0,0.05);">
          <div class="progress-fill" style="width: ${progressPercent}%; background: ${typeStyle.gradient}; height: 100%; transition: width 0.3s; box-shadow: inset 0 1px 2px rgba(255,255,255,0.3);"></div>
        </div>
      </div>
      
      <div class="request-info">
        <div class="info-item">
          <span class="info-label">القسم</span>
          <span class="info-value">${request.employee_dept || request.employee?.department || 'غير محدد'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">تاريخ الإنشاء</span>
          <span class="info-value">${formatDate(request.created_at || request.request_date)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">الحالة النهائية</span>
          <span class="info-value" style="color: ${
            progress.final_decision === 'approved' ? 'var(--success)' :
            progress.final_decision === 'rejected' ? 'var(--danger)' :
            'var(--warning)'
          };">
            ${progress.final_decision === 'approved' ? '✅ مكتمل (موافق عليه)' : 
              progress.final_decision === 'rejected' ? '❌ مرفوض' : 
              rejectedCount > 0 ? '❌ مرفوض' :
              `⏳ قيد الموافقة (${approvedCount}/${totalApprovers})`}
          </span>
        </div>
        ${nextApprover ? `
          <div class="info-item">
            <span class="info-label">الموافق التالي</span>
            <span class="info-value" style="color: ${isYourTurn ? 'var(--primary)' : 'var(--text)'};">
              ${isYourTurn ? '🔔 أنت!' : nextApprover.approver_name || 'غير محدد'}
            </span>
          </div>
        ` : ''}
      </div>
      
      <!-- Visual Timeline -->
      <div style="margin: 20px 0;">
        <div style="font-weight: 700; font-size: 14px; margin-bottom: 12px; color: var(--text);">📊 المخطط الزمني للموافقات:</div>
        <div class="approvers-timeline" style="display: flex; flex-direction: column; gap: 12px;">
          ${approvals.map((approval, index) => {
            const isPending = approval.status === 'pending';
            const isApproved = approval.status === 'approved';
            const isRejected = approval.status === 'rejected';
            const isBlocking = isPending && index === approvals.findIndex(a => a.status === 'pending');
            const decidedTime = approval.decided_at ? new Date(approval.decided_at) : null;
            const createdAtTime = new Date(approval.created_at);
            const hoursElapsed = approval.decided_at ? 
              Math.floor((decidedTime - createdAtTime) / (1000 * 60 * 60)) :
              Math.floor((now - createdAtTime) / (1000 * 60 * 60));
            
            return `
              <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: ${
                isBlocking ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : 
                isApproved ? '#f0fdf4' : 
                isRejected ? '#fef2f2' : '#f9fafb'
              }; border-radius: 10px; border: 2px solid ${
                isBlocking ? '#fbbf24' : 
                isApproved ? '#10b981' : 
                isRejected ? '#ef4444' : '#e5e7eb'
              };">
                <div style="font-size: 28px;">${isApproved ? '✅' : isRejected ? '❌' : '⏳'}</div>
                <div style="flex: 1;">
                  <div style="font-weight: 700; color: ${isBlocking ? '#92400e' : 'var(--text)'};">
                    ${approval.approver_name}${approval.approver_id === currentUserId ? ' (أنت)' : ''}
                    ${isBlocking ? ' <span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">🚫 يعيق التقدم</span>' : ''}
                  </div>
                  <div style="font-size: 12px; color: var(--muted);">
                    ${approval.approver_role || ''} • ${isPending ? `قيد الانتظار منذ ${hoursElapsed} ساعة` : 
                      isApproved ? `تمت الموافقة بعد ${hoursElapsed} ساعة` :
                      `تم الرفض بعد ${hoursElapsed} ساعة`}
                  </div>
                  ${approval.decision_note ? `<div style="font-size: 12px; color: var(--muted); margin-top: 4px;">💬 ${approval.decision_note}</div>` : ''}
                </div>
                <div style="text-align: left; font-size: 12px; color: var(--muted);">
                  ${decidedTime ? decidedTime.toLocaleString('ar-SA', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'معلق'}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <div class="action-buttons" style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px;">
        <button class="btn btn-primary" onclick="viewDetails('${request.type}', ${request.id})"
                style="background: ${typeStyle.gradient}; border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15); font-weight: 700;">
          👁️ عرض التفاصيل
        </button>
        
        ${!isCompleted ? `
          <button class="btn" onclick="notifyPendingApprovers('${request.type}', ${request.id})"
                  style="background: #fbbf24; color: white; border: none; font-weight: 700;">
            🔔 تنبيه المعتمدين المعلقين
          </button>
          
          ${window.rolePermissions && window.rolePermissions.hasRole('ADMIN') ? `
            <button class="btn" onclick="adminOverride('${request.type}', ${request.id})"
                    style="background: #ef4444; color: white; border: none; font-weight: 700;">
              ⚡ اعتماد إداري فوري
            </button>
            
            ${approvals.some(a => a.status === 'pending') ? `
              <button class="btn" onclick="suggestCommissioner('${request.type}', ${request.id})"
                      style="background: #8b5cf6; color: white; border: none; font-weight: 600;">
                👥 إنشاء تفويض
              </button>
            ` : ''}
          ` : ''}
        ` : ''}
        
        ${isYourTurn ? `
          <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: linear-gradient(135deg, #dbeafe, #bfdbfe); border-radius: 10px; color: #1e40af; font-weight: 700;">
            🔔 قيد انتظار موافقتك
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function getApproverClass(approval) {
  if (approval.approver_id === currentUserId) {
    return 'approver-you ' + (approval.status === 'approved' ? 'approver-approved' : 
                             approval.status === 'rejected' ? 'approver-rejected' : 
                             'approver-pending');
  }
  
  return approval.status === 'approved' ? 'approver-approved' :
         approval.status === 'rejected' ? 'approver-rejected' :
         'approver-pending';
}

function getApproverIcon(status) {
  return status === 'approved' ? '✅' :
         status === 'rejected' ? '❌' :
         '⏳';
}

function formatDate(dateString) {
  if (!dateString) return 'غير محدد';
  if (window.DetailUtils && window.DetailUtils.formatDate) {
    return window.DetailUtils.formatDate(dateString);
  }
  return new Date(dateString).toLocaleDateString('ar-SA');
}

function applyFilters() {
  const typeFilter = document.getElementById('typeFilter').value;
  const statusFilter = document.getElementById('statusFilter').value;
  const searchText = document.getElementById('searchInput').value.toLowerCase();
  
  filteredRequests = allRequests.filter(request => {
    // Type filter
    if (typeFilter && request.type !== typeFilter) return false;
    
    // Status filter
    if (statusFilter === 'yours') {
      const hasYourPending = request.approval_progress?.approvals?.some(a => 
        a.approver_id === currentUserId && a.status === 'pending'
      );
      if (!hasYourPending) return false;
    } else if (statusFilter === 'pending') {
      if (!request.approval_progress || request.approval_progress.pending_count === 0) return false;
    } else if (statusFilter === 'complete') {
      if (!request.approval_progress || request.approval_progress.final_decision !== 'approved') return false;
    }
    
    // Search filter
    if (searchText) {
      const searchable = [
        request.reference_number,
        request.employee_name,
        request.employee?.name,
        request.id
      ].join(' ').toLowerCase();
      if (!searchable.includes(searchText)) return false;
    }
    
    return true;
  });
  
  displayRequests();
}

/**
 * Check if a request is completed (using unified logic)
 */
function isRequestCompleted(request) {
  // Comprehensive completion check for all request types
  const completedStatuses = [
    'مكتمل', 'موافق عليه', 'مرفوض', 'مكتملة', 'مرفوضة',
    'completed', 'approved', 'rejected', 'Completed', 'Approved', 'Rejected',
    'Fully Approved', 'Final Approved'
  ];
  
  // Check primary status field
  if (completedStatuses.includes(request.status)) {
    return true;
  }
  
  // Check final_decision field
  if (request.final_decision === 'approved' || request.final_decision === 'rejected') {
    return true;
  }
  
  // Check approval_stage field
  if (request.approval_stage === 'Completed' || request.approval_stage === 'Rejected' || request.approval_stage === 'Fully Approved') {
    return true;
  }
  
  // Check approval progress if available
  if (request.approval_progress) {
    if (request.approval_progress.final_decision === 'approved' || request.approval_progress.final_decision === 'rejected') {
      return true;
    }
    
    // Check if all approvals are complete
    if (request.approval_progress.total_approvers > 0 && 
        request.approval_progress.approved_count === request.approval_progress.total_approvers) {
      return true;
    }
  }
  
  // Use RequestStatusChecker if available as fallback
  if (window.RequestStatusChecker) {
    return window.RequestStatusChecker.isCompleted(request);
  }
  
  // Fallback logic
  if (!request.approval_progress) return false;
  
  const progress = request.approval_progress;
  
  // Final decision is approved or rejected
  if (progress.final_decision === 'approved' || progress.final_decision === 'rejected') {
    return true;
  }
  
  // Any approver rejected
  if (progress.rejected_count > 0) {
    return true;
  }
  
  // All approvers approved
  if (progress.total_approvers > 0 && 
      progress.approved_count === progress.total_approvers) {
    return true;
  }
  
  return false;
}

// Approval/rejection removed - this is a READ-ONLY status page
// Users must navigate to detail pages to approve/reject requests

function viewDetails(type, id) {
  const detailPages = {
    'clearance': 'admin-clearance-detail.html',
    'onboarding': 'admin-direct-detail.html',
    'delegation': 'admin-delegation-detail.html',
    'certificate': 'admin-certificate-detail.html',
    'experience': 'hidden/admin-experience-detail.html',
    'leave': 'admin-leave-detail.html',
    'exit': 'admin-exit-detail.html',
    'assignment': 'admin-assignment-detail.html',
    'assignment_termination': 'admin-assignment-termination-detail.html',
    'internal_transfer': 'admin-internal-transfer-detail.html',
    'maternity_leave': 'admin-maternity-leave-detail.html',
    'housing_allowance': 'admin-housing-allowance-detail.html',
    'travel_order': 'admin-travel-order-detail.html',
    'reward_refund': 'admin-reward-refund-detail.html',
    'airlines_ticket': 'admin-airlines-ticket-detail.html',
    'direct': 'admin-direct-detail.html'
  };
  
  const page = detailPages[type] || 'admin-direct-detail.html';
  window.location.href = `${page}?id=${id}`;
}

function showLoading() {
  const pendingContainer = document.getElementById('pendingRequestsContainer');
  const completedContainer = document.getElementById('completedRequestsContainer');
  
  if (pendingContainer) {
    pendingContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⏳</div>
        <p>جاري تحميل البيانات...</p>
      </div>
    `;
  }
  
  if (completedContainer) {
    completedContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⏳</div>
        <p>جاري تحميل البيانات...</p>
      </div>
    `;
  }
}

function showError(message) {
  const pendingContainer = document.getElementById('pendingRequestsContainer');
  
  if (pendingContainer) {
    pendingContainer.innerHTML = `
      <div class="empty-state-beautiful">
        <div class="empty-state-icon-large">⚠️</div>
        <h3 class="empty-state-title">حدث خطأ</h3>
        <p class="empty-state-text">${message}</p>
        <button class="btn-beautiful btn-beautiful-primary" onclick="loadApprovalStatus()">إعادة المحاولة</button>
      </div>
    `;
  }
}

// ==========================================
// NEW FEATURES: Notifications and Actions
// ==========================================

/**
 * Notify all pending approvers for a request
 */
async function notifyPendingApprovers(requestType, requestId) {
  try {
    if (!confirm('هل تريد إرسال تنبيه لجميع المعتمدين المعلقين لهذا الطلب؟')) {
      return;
    }

    const authToken = localStorage.getItem('authToken');
    const response = await fetch(`http://localhost:3037/api/requests/${requestType}/${requestId}/notify-approvers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('فشل إرسال التنبيهات');
    }

    const result = await response.json();
    alert(result.message || 'تم إرسال التنبيهات بنجاح');
    console.log('✅ Approvers notified:', result);

  } catch (error) {
    console.error('❌ Error notifying approvers:', error);
    alert('حدث خطأ: ' + error.message);
  }
}

/**
 * Admin override - force approve request
 */
async function adminOverride(requestType, requestId) {
  const reason = prompt('يرجى إدخال سبب الاعتماد الإداري الفوري:');
  
  if (!reason || reason.trim() === '') {
    alert('يجب إدخال سبب للاعتماد الإداري');
    return;
  }

  if (!confirm(`هل أنت متأكد من اعتماد هذا الطلب إدارياً؟\n\nالسبب: ${reason}`)) {
    return;
  }

  try {
    const authToken = localStorage.getItem('authToken');
    const response = await fetch(`http://localhost:3037/api/admin/approvals/fix-request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requestType,
        requestId,
        action: 'approve'
      })
    });

    if (!response.ok) {
      throw new Error('فشل الاعتماد الإداري');
    }

    const result = await response.json();
    alert(result.message || 'تم اعتماد الطلب بنجاح');
    
    // Reload the page
    setTimeout(() => loadApprovalStatus(), 1000);

  } catch (error) {
    console.error('❌ Error with admin override:', error);
    alert('حدث خطأ: ' + error.message);
  }
}

/**
 * Suggest creating commissioner ticket for pending approver
 */
function suggestCommissioner(requestType, requestId) {
  const message = `يبدو أن هناك معتمدين معلقين على هذا الطلب.\n\nهل تريد إنشاء تفويض (Commissioner Ticket) لشخص آخر للموافقة بدلاً منهم؟\n\nسيتم نقلك إلى صفحة إدارة المفوضين.`;
  
  if (confirm(message)) {
    // Navigate to commissioner page with pre-filled scope
    window.location.href = `admin-commissioner.html?scope=${requestType}&requestId=${requestId}`;
  }
}

console.log('✅ Admin approval status script loaded');

