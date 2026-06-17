/**
 * Role-Based Approval Inbox
 * Shows pending requests that user can approve based on their roles
 */

// Load toast notifications
if (typeof window.showToast === 'undefined') {
    const toastScript = document.createElement('script');
    toastScript.src = '../jS/toast-notifications.js';
    document.head.appendChild(toastScript);
}

const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
if (!authUser) {
    location.href = 'login.html';
}

let pendingApprovals = [];
let currentRequest = null;

/**
 * Initialize page
 */
async function init() {
    try {
        await loadUserRoles();
        await loadPendingApprovals();
        updateKPIs();
        renderApprovalsTable();
    } catch (error) {
        console.error('Initialization error:', error);
        showError('فشل تحميل البيانات');
    }
}

/**
 * Load and display user's roles
 */
async function loadUserRoles() {
    const userRoles = authUser.roles || [authUser.role?.toUpperCase()] || ['EMPLOYEE'];
    const roleBadgesContainer = document.getElementById('myRoleBadges');
    
    const roleNames = {
        'ADMIN': 'مدير النظام',
        'MANAGER': 'مدير',
        'HR': 'موارد بشرية',
        'FINANCE': 'مالية',
        'IT': 'تقنية معلومات',
        'EMPLOYEE': 'موظف'
    };
    
    roleBadgesContainer.innerHTML = userRoles
        .map(role => `<span class="role-badge">${roleNames[role] || role}</span>`)
        .join('');
}

/**
 * Load pending approvals from API
 */
async function loadPendingApprovals() {
    try {
        const response = await window.apiClient.makeRequest('/approvals/pending');
        
        if (response && response.success) {
            const allApprovals = response.data || [];
            
            // Deduplicate by request (user with multiple roles sees same request multiple times)
            const uniqueMap = new Map();
            allApprovals.forEach(approval => {
                const key = `${approval.request_type}-${approval.request_id}`;
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, approval);
                } else {
                    // Keep the one with lowest approval_order (user approves first as this role)
                    const existing = uniqueMap.get(key);
                    if (approval.approval_order < existing.approval_order) {
                        uniqueMap.set(key, approval);
                    }
                }
            });
            
            pendingApprovals = Array.from(uniqueMap.values());
            console.log(`✅ Loaded ${pendingApprovals.length} unique pending approvals (from ${allApprovals.length} total)`);
        } else {
            pendingApprovals = [];
            console.warn('No pending approvals found');
        }
    } catch (error) {
        console.error('Failed to load pending approvals:', error);
        pendingApprovals = [];
        showError('فشل تحميل الطلبات قيد الانتظار');
    }
}

/**
 * Update KPI cards
 */
function updateKPIs() {
    const total = pendingApprovals.length;
    const clearance = pendingApprovals.filter(a => a.request_type === 'clearance').length;
    const onboarding = pendingApprovals.filter(a => a.request_type === 'onboarding').length;
    const delegation = pendingApprovals.filter(a => a.request_type === 'delegation').length;
    
    document.getElementById('totalPending').textContent = total;
    document.getElementById('clearancePending').textContent = clearance;
    document.getElementById('onboardingPending').textContent = onboarding;
    document.getElementById('delegationPending').textContent = delegation;
}

/**
 * Render approvals table
 */
function renderApprovalsTable() {
    const tbody = document.getElementById('approvalsTable');
    
    if (pendingApprovals.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <div class="empty-icon">✓</div>
                    <div>لا توجد طلبات قيد الانتظار</div>
                    <div style="font-size: 0.875rem; margin-top: 0.5rem;">ممتاز! لا توجد طلبات تحتاج موافقتك حالياً</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    pendingApprovals.forEach(approval => {
        const requestTypeAr = getRequestTypeAr(approval.request_type);
        const approvedCount = approval.approved_count || 0;
        const totalApprovers = approval.total_approvers || 1;
        const progress = (approvedCount / totalApprovers) * 100;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${approval.request_id}</strong></td>
            <td>${requestTypeAr}</td>
            <td>
                ${approval.request_owner_name || 'غير محدد'}<br>
                <small style="color: var(--muted);">${approval.request_owner_email || ''}</small>
            </td>
            <td>${formatDate(approval.created_at)}</td>
            <td>
                <div style="font-size: 0.75rem; color: var(--muted); margin-bottom: 0.25rem;">
                    ${approvedCount} من ${totalApprovers} موافقات
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </td>
            <td>
                <span class="status-badge status-pending">
                    ${approval.approval_stage || 'قيد الانتظار'}
                </span>
            </td>
            <td>
                <button class="btn btn-success" onclick="openApprovalModal('${approval.request_type}', ${approval.request_id})" style="font-size: 0.875rem;">
                    ✓ اعتماد
                </button>
                <button class="btn btn-danger" onclick="openRejectionModal('${approval.request_type}', ${approval.request_id})" style="font-size: 0.875rem;">
                    ✗ رفض
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Open approval modal
 */
function openApprovalModal(requestType, requestId) {
    currentRequest = { requestType, requestId };
    document.getElementById('approvalNote').value = '';
    document.getElementById('approvalModal').style.display = 'flex';
}

/**
 * Open rejection modal
 */
function openRejectionModal(requestType, requestId) {
    currentRequest = { requestType, requestId };
    document.getElementById('rejectionNote').value = '';
    document.getElementById('rejectionModal').style.display = 'flex';
}

/**
 * Close modal
 */
function closeModal() {
    document.getElementById('approvalModal').style.display = 'none';
    document.getElementById('rejectionModal').style.display = 'none';
    currentRequest = null;
}

/**
 * Confirm approval
 */
async function confirmApproval() {
    if (!currentRequest) return;
    
    const note = document.getElementById('approvalNote').value;
    
    try {
        const response = await window.apiClient.makeRequest(
            `/requests/${currentRequest.requestType}/${currentRequest.requestId}/approve`,
            {
                method: 'POST',
                body: JSON.stringify({ note })
            }
        );
        
        if (response && response.success) {
            if (window.showToast) {
                window.showToast(response.message || 'تم اعتماد الطلب بنجاح', 'success');
            } else {
                alert(`✅ ${response.message || 'تم اعتماد الطلب بنجاح'}`);
            }
            closeModal();
            await refreshData();
        } else {
            if (window.showToast) {
                window.showToast(response.message || 'فشل اعتماد الطلب', 'error');
            } else {
                alert(`⚠️ ${response.message || 'فشل اعتماد الطلب'}`);
            }
        }
    } catch (error) {
        console.error('Approval error:', error);
        const errorMsg = error.message || 'حدث خطأ أثناء اعتماد الطلب. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.';
        if (window.showToast) {
            window.showToast(errorMsg, 'error');
        } else {
            alert(`⚠️ ${errorMsg}`);
        }
    }
}

/**
 * Confirm rejection
 */
async function confirmRejection() {
    if (!currentRequest) return;
    
    const note = document.getElementById('rejectionNote').value.trim();
    
    if (!note) {
        if (window.showToast) {
            window.showToast('يجب إدخال سبب الرفض', 'warning');
        } else {
            alert('⚠️ يجب إدخال سبب الرفض');
        }
        return;
    }
    
    try {
        const response = await window.apiClient.makeRequest(
            `/requests/${currentRequest.requestType}/${currentRequest.requestId}/reject`,
            {
                method: 'POST',
                body: JSON.stringify({ note })
            }
        );
        
        if (response && response.success) {
            if (window.showToast) {
                window.showToast(response.message || 'تم رفض الطلب', 'success');
            } else {
                alert(`✅ ${response.message || 'تم رفض الطلب'}`);
            }
            closeModal();
            await refreshData();
        } else {
            if (window.showToast) {
                window.showToast(response.message || 'فشل رفض الطلب', 'error');
            } else {
                alert(`⚠️ ${response.message || 'فشل رفض الطلب'}`);
            }
        }
    } catch (error) {
        console.error('Rejection error:', error);
        const errorMsg = error.message || 'حدث خطأ أثناء رفض الطلب. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.';
        if (window.showToast) {
            window.showToast(errorMsg, 'error');
        } else {
            alert(`⚠️ ${errorMsg}`);
        }
    }
}

/**
 * Refresh data
 */
async function refreshData() {
    await loadPendingApprovals();
    updateKPIs();
    renderApprovalsTable();
}

/**
 * Get request type in Arabic
 */
function getRequestTypeAr(type) {
    const types = {
        'clearance': 'إخلاء طرف',
        'onboarding': 'مباشرة عمل',
        'delegation': 'تفويض',
        'direct': 'طلب مباشر'
    };
    return types[type] || type;
}

/**
 * Format date
 */
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Show error message
 */
function showError(message) {
    if (window.showToast) {
        window.showToast(message, 'error');
    } else {
        alert(message);
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

// Close modal on outside click
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal();
    }
});

