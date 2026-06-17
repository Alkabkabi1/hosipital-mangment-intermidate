// Employee Request History Page
let allRequests = [];
let filteredRequests = [];

// Wait for dependencies before initializing
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Loading request history page...');
  
  // Check authentication
  const authUser = apiClient.getCurrentUser();
  if (!authUser) {
    window.location.href = window.resolveFrontendPath ? window.resolveFrontendPath('login.html') : 'login.html';
    return;
  }
  
  // Update user info
  const avatar = document.getElementById('avatar');
  if (avatar && authUser.email) {
    avatar.textContent = authUser.email[0].toUpperCase();
    avatar.onclick = () => window.location.href = window.resolveFrontendPath ? window.resolveFrontendPath('employee-profile.html') : 'employee-profile.html';
  }
  
  // Wait for dependencies then load data
  if (typeof window.waitForDependencies === 'function') {
    window.waitForDependencies(() => {
      console.log('✅ Request history: All dependencies loaded');
      loadAllRequests();
    }, ['apiClient', 'resolveFrontendPath']);
  } else {
    setTimeout(loadAllRequests, 1000);
  }
});

async function loadAllRequests() {
  console.log('📊 Loading all requests...');
  
  try {
    // Fetch all request types
    const [clearances, onboardings, delegations, certificates, experiences, exits, leaves] = await Promise.allSettled([
      apiClient.getMyClearances().catch(() => []),
      apiClient.getMyOnboardings().catch(() => []),
      apiClient.getMyDelegations().catch(() => []),
      apiClient.getMyCertificates().catch(() => []),
      apiClient.getMyExperiences().catch(() => []),
      apiClient.getMyExits().catch(() => []),
      apiClient.getMyLeaveRequests().catch(() => [])
    ]);
    
    // Extract data
    const clearanceArray = Array.isArray(clearances.value) ? clearances.value : (clearances.value?.data || []);
    const onboardingArray = Array.isArray(onboardings.value) ? onboardings.value : (onboardings.value?.data || []);
    const delegationData = delegations.value?.data || delegations.value || [];
    const delegationArray = Array.isArray(delegationData) ? delegationData : [];
    const certificateArray = Array.isArray(certificates.value) ? certificates.value : (certificates.value?.data || []);
    const experienceArray = Array.isArray(experiences.value) ? experiences.value : (experiences.value?.data || []);
    const exitArray = Array.isArray(exits.value) ? exits.value : (exits.value?.data || []);
    const leaveArray = Array.isArray(leaves.value) ? leaves.value : (leaves.value?.data || []);
    
    // Combine all requests with type labels
    allRequests = [
      ...clearanceArray.map(item => ({ ...item, type: 'clearance', type_ar: 'إخلاء طرف' })),
      ...onboardingArray.map(item => ({ ...item, type: 'onboarding', type_ar: 'مباشرة عمل' })),
      ...delegationArray.map(item => ({ ...item, type: 'delegation', type_ar: 'تفويض' })),
      ...certificateArray.map(item => ({ ...item, type: 'certificate', type_ar: 'شهادة تعريف' })),
      ...experienceArray.map(item => ({ ...item, type: 'experience', type_ar: 'شهادة خبرة' })),
      ...exitArray.map(item => ({ ...item, type: 'exit', type_ar: 'إنهاء العمل' })),
      ...leaveArray.map(item => ({ ...item, type: 'leave_request', type_ar: 'طلب إجازة' }))
    ];
    
    console.log(`✅ Loaded ${allRequests.length} total requests`);
    
    // Update statistics
    updateStatistics();
    
    // Initial display (no filter)
    filteredRequests = [...allRequests];
    renderTable();
    
  } catch (error) {
    console.error('❌ Error loading requests:', error);
    showError('حدث خطأ أثناء تحميل الطلبات');
  }
}

function updateStatistics() {
  const total = allRequests.length;
  const pending = allRequests.filter(r => {
    const status = (r.status || '').toLowerCase();
    return status.includes('pending') || status.includes('submitted') || status === 'in_progress';
  }).length;
  const approved = allRequests.filter(r => (r.status || '').toLowerCase().includes('approved')).length;
  const rejected = allRequests.filter(r => (r.status || '').toLowerCase().includes('rejected')).length;
  
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statApproved').textContent = approved;
  document.getElementById('statRejected').textContent = rejected;
}

function applyFilters() {
  const typeFilter = document.getElementById('typeFilter').value;
  const statusFilter = document.getElementById('statusFilter').value;
  
  filteredRequests = allRequests.filter(request => {
    const typeMatch = !typeFilter || request.type === typeFilter;
    const statusMatch = !statusFilter || (request.status || '').toLowerCase().includes(statusFilter.toLowerCase());
    return typeMatch && statusMatch;
  });
  
  console.log(`🔍 Filtered to ${filteredRequests.length} requests`);
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('requestsTableBody');
  
  if (!tbody) {
    console.error('❌ Table body not found');
    return;
  }
  
  if (filteredRequests.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;color:#6b7280;padding:40px;">
          لا توجد طلبات
        </td>
      </tr>
    `;
    return;
  }
  
  // Sort by creation date (most recent first)
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const dateA = new Date(a.created_at || a.request_date || a.createdAt || 0);
    const dateB = new Date(b.created_at || b.request_date || b.createdAt || 0);
    return dateB - dateA;
  });
  
  const html = sortedRequests.map(request => {
    const referenceNumber = request.reference_number || `#${request.id}`;
    const createdDate = request.created_at || request.request_date || request.createdAt;
    const updatedDate = request.updated_at || request.updatedAt || createdDate;
    const statusClass = getStatusClass(request.status);
    
    return `
      <tr style="cursor:pointer;" onclick="viewRequestDetails('${request.type}', ${request.id})">
        <td>${referenceNumber}</td>
        <td>${request.type_ar}</td>
        <td><span class="badge status-${statusClass}">${request.status || 'غير محدد'}</span></td>
        <td>${formatDate(createdDate)}</td>
        <td>${formatDate(updatedDate)}</td>
        <td>
          <button class="btn-sm" onclick="event.stopPropagation(); viewRequestDetails('${request.type}', ${request.id})">
            عرض
          </button>
        </td>
      </tr>
    `;
  }).join('');
  
  tbody.innerHTML = html;
  console.log(`✅ Rendered ${sortedRequests.length} requests`);
}

function getStatusClass(status) {
  if (!status) return 'pending';
  
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('approved') || statusLower.includes('معتمد')) return 'approved';
  if (statusLower.includes('rejected') || statusLower.includes('مرفوض')) return 'rejected';
  if (statusLower.includes('completed') || statusLower.includes('مكتمل')) return 'completed';
  if (statusLower.includes('pending') || statusLower.includes('معلق')) return 'pending';
  if (statusLower.includes('submitted') || statusLower.includes('مقدم')) return 'submitted';
  
  return 'pending';
}

function formatDate(dateString) {
  if (!dateString) return 'غير محدد';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'غير محدد';
    
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'غير محدد';
  }
}

function viewRequestDetails(type, id) {
  console.log(`🔍 Viewing request: ${type} #${id}`);
  
  // Navigate to appropriate detail page based on type
  // Use employee detail pages for employee context
  const detailPages = {
    'clearance': 'employee-clearance-detail.html',
    'onboarding': 'employee-onboarding-detail.html',
    'delegation': 'employee-delegation-detail.html',
    'certificate': 'employee-certificate-detail.html',
    'experience': 'employee-experience-detail.html',
    'exit': 'my-exit-requests.html',
    'leave_request': 'employee-leave-request.html',
    'maternity_leave': 'employee-maternity-leave-request.html',
    'housing_allowance': 'housing-allowance-request.html'
  };
  
  const detailPage = detailPages[type];
  if (detailPage) {
    window.location.href = `${detailPage}?id=${id}`;
  } else {
    console.warn(`⚠️ No detail page found for type: ${type}`);
  }
}

function showError(message) {
  const tbody = document.getElementById('requestsTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;color:#ef4444;padding:40px;">
          ❌ ${message}
        </td>
      </tr>
    `;
  }
}

// Global logout function
function logout() {
  console.log('🔄 Logging out...');
  localStorage.removeItem('authUser');
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  const loginUrl = window.resolveFrontendPath ? window.resolveFrontendPath('login.html') : 'login.html';
  window.location.href = loginUrl;
}

