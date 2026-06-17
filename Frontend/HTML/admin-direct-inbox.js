// Admin Direct Inbox JavaScript
// Handles the direct requests inbox page

// Safety guard for missing apiClient
if (typeof window.apiClient === 'undefined') {
  console.error('apiClient missing — ensure ../jS/api-client.js is loaded before this script.');
}

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication and admin role
  const authUser = JSON.parse(localStorage.getItem('authUser')||'null');
  if (!authUser) {
    window.location.href = window.resolveFrontendPath ? window.resolveFrontendPath('login.html') : 'login.html';
    return;
  }
  if (authUser.role !== 'admin') {
    window.location.href = window.resolveFrontendPath ? window.resolveFrontendPath('employee-dashboard.html') : 'employee-dashboard.html';
    return;
  }

  // Initialize page
  loadDirectRequests();
  updateKPIs();
});

let allRequests = [];
let filteredRequests = [];

async function loadDirectRequests() {
  try {
    console.log('🔄 Loading ALL onboarding requests using DASHBOARD approach...');
    
    // Use the EXACT same approach as the working admin dashboard
    const allApiRequests = await apiClient.makeRequest('/admin/requests/recent?limit=100&onlyPending=false').catch(() => []);
    
    console.log('📊 Admin API response:', allApiRequests.length, 'total requests');
    
    // Filter for onboarding requests only
    const onboardingRequests = Array.isArray(allApiRequests) ? allApiRequests.filter(r => r.type === 'onboarding') : [];
    
    console.log('📊 Onboarding requests found:', onboardingRequests.length);
    console.log('📊 Sample onboarding data:', onboardingRequests[0]);
    
    allRequests = onboardingRequests;
    filteredRequests = [...allRequests];
    updateKPIs();
    renderTable();
    
  } catch (error) {
    console.error('Error loading direct requests:', error);
    console.log('⚠️ Falling back to localStorage...');
    allRequests = JSON.parse(localStorage.getItem('requestsOnboarding') || '[]');
    filteredRequests = [...allRequests];
    updateKPIs();
    renderTable();
  }
}

function updateKPIs() {
  const pending = allRequests.filter(r => ['قيد الاعتماد', 'قيد الانتظار', 'قيد المراجعة'].includes(r.status)).length;
  const completed = allRequests.filter(r => ['مكتمل', 'موافق عليه'].includes(r.status)).length;
  const rejected = allRequests.filter(r => r.status === 'مرفوض').length;
  const total = allRequests.length;

  console.log('📊 Direct Inbox KPIs:', { pending, completed, rejected, total });
  console.log('📊 All requests statuses:', allRequests.map(r => r.status));

  document.getElementById('kPending').textContent = pending;
  document.getElementById('kDone').textContent = completed;
  document.getElementById('kReject').textContent = rejected;
  document.getElementById('kAll').textContent = total;
}

function renderTable() {
  const tbody = document.getElementById('rows');
  tbody.innerHTML = '';

  filteredRequests.forEach(request => {
    const row = document.createElement('tr');
    row.className = 'row';
    
    const currentApprover = (request.approvers || []).find(a => a.status === 'قيد الاعتماد');
    const approverText = currentApprover ? 
      (currentApprover.name || currentApprover.role || 'غير محدد') : '-';
    
    // Calculate due date status
    let dueStatus = '-';
    if (currentApprover && currentApprover.dueAt) {
      const dueDate = new Date(currentApprover.dueAt);
      const now = new Date();
      const diffHours = Math.ceil((dueDate - now) / (1000 * 60 * 60));
      
      if (diffHours < 0) {
        dueStatus = `<span class="badge-due late">متأخر ${Math.abs(diffHours)} ساعة</span>`;
      } else if (diffHours <= 24) {
        dueStatus = `<span class="badge-due late">متبقي ${diffHours} ساعة</span>`;
      } else {
        dueStatus = `<span class="badge-due ok">متبقي ${Math.ceil(diffHours/24)} يوم</span>`;
      }
    }

    const statusBadge = getStatusBadge(request.status);
    const createdDate = new Date(request.createdAt).toLocaleDateString('ar-SA');

    row.innerHTML = `
      <td>${request.id}</td>
      <td>${request.employee?.name || '-'}</td>
      <td>${request.employee?.dept || '-'}</td>
      <td>${statusBadge}</td>
      <td>${approverText}</td>
      <td>${dueStatus}</td>
      <td>${createdDate}</td>
      <td><button class="btn-sm" onclick="openDetails('${request.id}')">فتح</button></td>
    `;

    tbody.appendChild(row);
  });
}


function getStatusBadge(status) {
  const badges = {
    'قيد الاعتماد': '<span class="badge b-pend">قيد الاعتماد</span>',
    'مكتمل': '<span class="badge b-done">مكتمل</span>',
    'مرفوض': '<span class="badge b-rej">مرفوض</span>'
  };
  return badges[status] || `<span class="badge">${status}</span>`;
}

function openDetails(requestId) {
  window.location.href = `admin-direct-detail.html?id=${requestId}`;
}

// Filter functions
function apply() {
  const statusFilter = document.getElementById('fStatus').value;
  const searchFilter = document.getElementById('fSearch').value.toLowerCase();

  filteredRequests = allRequests.filter(request => {
    const matchesStatus = !statusFilter || request.status === statusFilter;
    const matchesSearch = !searchFilter || 
      (request.employee?.name || '').toLowerCase().includes(searchFilter) ||
      (request.employee?.dept || '').toLowerCase().includes(searchFilter) ||
      String(request.id).includes(searchFilter);

    return matchesStatus && matchesSearch;
  });

  renderTable();
}

function resetF() {
  document.getElementById('fStatus').value = '';
  document.getElementById('fSearch').value = '';
  filteredRequests = [...allRequests];
  renderTable();
}

// Export functions
function exportCSV() {
  const headers = ['الرقم', 'الموظف', 'القسم', 'الحالة', 'تاريخ الطلب', 'تاريخ المباشرة', 'المسمى الوظيفي'];
  const csvData = [headers];

  filteredRequests.forEach(request => {
    csvData.push([
      request.id,
      request.employee?.name || '',
      request.employee?.dept || '',
      (window.getStatusDisplay ? window.getStatusDisplay(request.status) : request.status),
      new Date(request.createdAt).toLocaleDateString('ar-SA'),
      request.details?.startDate || '',
      request.details?.position || ''
    ]);
  });

  const csvContent = csvData.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');

  downloadFile(csvContent, 'direct_requests.csv', 'text/csv');
  showSuccess('تم تصدير البيانات بنجاح');
}

function exportExcel() {
  // For now, export as CSV (Excel functionality can be added later)
  exportCSV();
}


// Utility functions
function downloadFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

function showSuccess(message) {
  // Simple alert for now - can be enhanced with better UI
  alert(message);
}

function showError(message) {
  alert('خطأ: ' + message);
}

function showInfo(message) {
  alert(message);
}

