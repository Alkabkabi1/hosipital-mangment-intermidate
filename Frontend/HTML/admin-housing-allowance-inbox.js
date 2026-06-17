// Admin Housing Allowance Inbox - JavaScript
document.addEventListener('DOMContentLoaded', () => {
  loadHousingAllowanceRequests();
  setupFilters();
  updateKPIs();
});

let allRequests = [];
let filteredRequests = [];

async function loadHousingAllowanceRequests() {
  try {
    console.log('🔄 Loading ALL housing allowance requests using DASHBOARD approach...');
    
    // Use the EXACT same approach as the working admin dashboard
    const allApiRequests = await apiClient.makeRequest('/admin/requests/recent?limit=100&onlyPending=false').catch(() => []);
    
    console.log('📊 Admin API response:', allApiRequests.length, 'total requests');
    
    // Filter for housing_allowance requests only
    const housingRequests = Array.isArray(allApiRequests) ? allApiRequests.filter(r => r.type === 'housing_allowance') : [];
    
    console.log('📊 Housing allowance requests found:', housingRequests.length);
    console.log('📊 Sample housing data:', housingRequests[0]);
    
    allRequests = housingRequests;
    filteredRequests = [...allRequests];
    updateKPIs();
    renderTable();
    
  } catch (error) {
    console.error('Error loading housing allowance requests:', error);
    console.log('⚠️ Falling back to localStorage...');
    allRequests = JSON.parse(localStorage.getItem('requestsHousingAllowance') || '[]');
    filteredRequests = [...allRequests];
    updateKPIs();
    renderTable();
  }
}

function updateKPIs() {
  const pending = allRequests.filter(r => r.status === 'قيد الاعتماد' || r.status === 'pending' || r.status === 'submitted').length;
  const done = allRequests.filter(r => r.status === 'مكتمل' || r.status === 'approved').length;
  const rejected = allRequests.filter(r => r.status === 'مرفوض' || r.status === 'rejected').length;
  
  document.getElementById('kPending').textContent = pending;
  document.getElementById('kDone').textContent = done;
  document.getElementById('kReject').textContent = rejected;
  document.getElementById('kAll').textContent = allRequests.length;
}

function setupFilters() {
  document.getElementById('fStatus').addEventListener('change', apply);
  document.getElementById('fSearch').addEventListener('input', apply);
}

function apply() {
  const status = document.getElementById('fStatus').value;
  const search = document.getElementById('fSearch').value.toLowerCase();
  
  filteredRequests = allRequests.filter(r => {
    const matchStatus = !status || r.status === status;
    const matchSearch = !search || 
      (r.employee_name || '').toLowerCase().includes(search) ||
      (r.employee_number || '').toLowerCase().includes(search) ||
      (r.department || '').toLowerCase().includes(search) ||
      (r.reference_number || '').toLowerCase().includes(search);
    
    return matchStatus && matchSearch;
  });
  
  renderTable();
}

function resetF() {
  document.getElementById('fStatus').value = '';
  document.getElementById('fSearch').value = '';
  filteredRequests = [...allRequests];
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('rows');
  tbody.innerHTML = '';
  
  if (filteredRequests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--muted)">لا توجد طلبات</td></tr>';
    return;
  }
  
  filteredRequests.forEach((req, idx) => {
    const tr = document.createElement('tr');
    tr.className = 'row';
    
    const refNum = req.reference_number || `HA-${req.id}`;
    const empName = req.employee_name || req.employeeName || 'غير محدد';
    const dept = req.department || req.employee_dept || 'غير محدد';
    const status = req.status || 'غير محدد';
    const approver = getCurrentApprover(req);
    const dueDate = getDueDate(req);
    const createdDate = formatDate(req.created_at || req.submittedAt);
    
    tr.innerHTML = `
      <td>${refNum}</td>
      <td>${empName}</td>
      <td>${dept}</td>
      <td>${renderStatusBadge(status)}</td>
      <td>${approver}</td>
      <td>${dueDate}</td>
      <td>${createdDate}</td>
      <td>
        <a href="admin-housing-allowance-detail.html?id=${req.id}" class="btn-sm">
          👁️ عرض
        </a>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
}

function getCurrentApprover(req) {
  if (req.current_approver_name) {
    return req.current_approver_name;
  }
  if (req.approval_stage) {
    return req.approval_stage;
  }
  return 'غير محدد';
}

function getDueDate(req) {
  if (req.due_date) {
    const dueDate = new Date(req.due_date);
    const now = new Date();
    const isLate = dueDate < now;
    const dateStr = formatDate(req.due_date);
    return `<span class="badge-due ${isLate ? 'late' : 'ok'}">${dateStr}</span>`;
  }
  return '—';
}

function renderStatusBadge(status) {
  let badgeClass = 'b-pend';
  let statusText = status;
  
  if (status === 'مكتمل' || status === 'approved' || status === 'Approved') {
    badgeClass = 'b-done';
    statusText = 'مكتمل';
  } else if (status === 'مرفوض' || status === 'rejected' || status === 'Rejected') {
    badgeClass = 'b-rej';
    statusText = 'مرفوض';
  } else if (status === 'قيد الاعتماد' || status === 'pending' || status === 'submitted') {
    badgeClass = 'b-pend';
    statusText = 'قيد الاعتماد';
  }
  
  return `<span class="badge ${badgeClass}">${statusText}</span>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA');
  } catch {
    return dateStr;
  }
}

function exportCSV() {
  const headers = ['رقم المرجع', 'اسم الموظف', 'القسم', 'الحالة', 'المعتمد الحالي', 'تاريخ الإنشاء'];
  const rows = filteredRequests.map(req => [
    req.reference_number || `HA-${req.id}`,
    req.employee_name || req.employeeName || '',
    req.department || req.employee_dept || '',
    req.status || '',
    getCurrentApprover(req),
    formatDate(req.created_at || req.submittedAt)
  ]);
  
  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.map(cell => `"${cell}"`).join(',') + '\n';
  });
  
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `housing_allowance_requests_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

function exportExcel() {
  // Simple Excel export using HTML table
  const table = document.querySelector('.table');
  const html = table.outerHTML;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `housing_allowance_requests_${new Date().toISOString().split('T')[0]}.xls`;
  link.click();
}

