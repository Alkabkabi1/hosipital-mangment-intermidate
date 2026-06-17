/**
 * Commissioner Approval Inbox
 * Shows pending requests that user can approve as commissioner
 */

const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
if (!authUser) {
    location.href = 'login.html';
}

let commissionerStatus = null;
let pendingRequests = [];
let currentRequest = null;

/**
 * Initialize page
 */
async function init() {
    try {
        await loadCommissionerStatus();
        await loadPendingRequests();
        updateKPIs();
        renderRequestsTable();
    } catch (error) {
        console.error('Initialization error:', error);
        showError('فشل تحميل البيانات');
    }
}

/**
 * Load commissioner status
 */
async function loadCommissionerStatus() {
    try {
        commissionerStatus = await window.CommissionerManager.getUserCommissionerStatus(authUser.email);
        
        const bannerEl = document.getElementById('commissionerBanner');
        const bannerTextEl = document.getElementById('bannerText');
        const scopesEl = document.getElementById('commissionerScopes');
        
        if (!bannerEl || !bannerTextEl || !scopesEl) {
            console.error('Banner elements not found in DOM');
            return;
        }
        
        if (!commissionerStatus.isCommissioner || commissionerStatus.status !== 'active') {
            // Not an active commissioner
            bannerEl.innerHTML = `
                <div class="banner-content">
                    <div class="banner-title">⚠️ ليست لديك صلاحيات مفوض نشطة</div>
                    <div class="banner-text">للوصول إلى هذه الصفحة، يجب أن يكون لديك تفويض نشط من الإدارة</div>
                </div>
            `;
            return;
        }
        
        // Display commissioner info
        const scopes = commissionerStatus.permissions || [];
        const validUntil = commissionerStatus.validUntil;
        
        bannerTextEl.textContent = `لديك صلاحيات تفويض نشطة حتى ${formatDate(validUntil)}`;
        
        scopesEl.innerHTML = scopes.map(scope => {
            const scopeNames = {
                'clearance': 'إخلاء طرف',
                'onboarding': 'مباشرة عمل',
                'delegation': 'تفويض'
            };
            return `<span class="scope-badge">${scopeNames[scope] || scope}</span>`;
        }).join('');
        
        console.log('✅ Commissioner status loaded:', commissionerStatus);
    } catch (error) {
        console.error('Failed to load commissioner status:', error);
    }
}

/**
 * Load pending requests that commissioner can approve
 */
async function loadPendingRequests() {
    try {
        if (!commissionerStatus || !commissionerStatus.isCommissioner) {
            pendingRequests = [];
            return;
        }
        
        // ✅ FIXED: Use the multi-approval endpoint instead of employee endpoint
        const response = await window.apiClient.makeRequest('/approvals/pending');
        
        if (response && response.success) {
            const allApprovals = response.data || [];
            
            // Filter by commissioner scopes
            const scopes = commissionerStatus.permissions || [];
            pendingRequests = allApprovals.filter(approval => 
                scopes.includes(approval.request_type)
            );
            
            console.log(`✅ Loaded ${pendingRequests.length} pending requests for commissioner (from ${allApprovals.length} total)`);
        } else {
            pendingRequests = [];
            console.warn('No pending approvals returned from API');
        }
    } catch (error) {
        console.error('Failed to load pending requests:', error);
        pendingRequests = [];
        showError('فشل تحميل الطلبات قيد الانتظار: ' + (error.message || 'خطأ غير معروف'));
    }
}

/**
 * Update KPI cards
 */
function updateKPIs() {
    const total = pendingRequests.length;
    const clearance = pendingRequests.filter(r => r.request_type === 'clearance').length;
    const onboarding = pendingRequests.filter(r => r.request_type === 'onboarding').length;
    const delegation = pendingRequests.filter(r => r.request_type === 'delegation').length;
    
    document.getElementById('totalPending').textContent = total;
    document.getElementById('clearancePending').textContent = clearance;
    document.getElementById('onboardingPending').textContent = onboarding;
    document.getElementById('delegationPending').textContent = delegation;
}

/**
 * Render requests table
 */
function renderRequestsTable() {
    const tbody = document.getElementById('requestsTable');
    
    if (!commissionerStatus || !commissionerStatus.isCommissioner) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <div>ليست لديك صلاحيات مفوض نشطة</div>
                </td>
            </tr>
        `;
        return;
    }
    
    if (pendingRequests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-icon">✓</div>
                    <div>لا توجد طلبات قيد الانتظار</div>
                    <div style="font-size: 0.875rem; margin-top: 0.5rem;">ممتاز! لا توجد طلبات تحتاج موافقتك كمفوض</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    pendingRequests.forEach(request => {
        // ✅ FIXED: Handle data structure from /approvals/pending endpoint
        const requestId = request.request_id || request.clearance_id || request.onboarding_id || request.delegation_id || request.id;
        const requestTypeAr = getRequestTypeAr(request.request_type);
        const submitterEmail = request.request_owner_email || request.employee_email || request.submitter_email || 'غير محدد';
        const submitterName = request.request_owner_name || '';
        const createdAt = request.created_at || request.request_date;
        const approvedCount = request.approved_count || 0;
        const totalApprovers = request.total_approvers || 1;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${requestId}</strong></td>
            <td>${requestTypeAr}</td>
            <td>
                ${submitterName ? submitterName + '<br>' : ''}
                <small style="color: var(--muted);">${submitterEmail}</small>
            </td>
            <td>${formatDate(createdAt)}</td>
            <td>
                <span class="status-badge status-pending">
                    ${request.request_status || request.status || 'قيد الانتظار'}
                </span>
                <div style="font-size: 0.75rem; color: var(--muted); margin-top: 0.25rem;">
                    ${approvedCount} من ${totalApprovers} موافقات
                </div>
            </td>
            <td>
                <button class="btn btn-success" onclick="openApprovalModal('${request.request_type}', ${requestId})" style="font-size: 0.875rem;">
                    ✓ اعتماد
                </button>
                <button class="btn btn-danger" onclick="openRejectionModal('${request.request_type}', ${requestId})" style="font-size: 0.875rem;">
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
                body: JSON.stringify({ note: note || 'موافقة من مفوض' })
            }
        );
        
        if (response && response.success) {
            if (window.showToast) {
                window.showToast(response.message || 'تم اعتماد الطلب بنجاح بصلاحية المفوض', 'success');
            } else {
                alert(`✅ ${response.message || 'تم اعتماد الطلب بنجاح بصلاحية المفوض'}`);
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
    await loadCommissionerStatus();
    await loadPendingRequests();
    updateKPIs();
    renderRequestsTable();
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

