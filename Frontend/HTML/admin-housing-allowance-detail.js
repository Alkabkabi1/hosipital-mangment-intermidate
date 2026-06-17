// Admin Housing Allowance Detail - JavaScript
document.addEventListener('DOMContentLoaded', () => {
  initializePage();
  loadHousingAllowanceDetail();
  setupEventListeners();
});

const urlParams = new URLSearchParams(window.location.search);
const requestId = parseInt(urlParams.get('id'));

let currentRequest = null;
let currentApprovals = [];

function initializePage() {
  // Check authentication
  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  if (!authUser) {
    window.location.href = 'login.html';
    return;
  }
  
  // Validate request ID
  if (!requestId || isNaN(requestId)) {
    alert('معرف الطلب غير صحيح');
    window.location.href = 'admin-dashboard.html';
    return;
  }
  
  console.log('📄 Loading housing allowance request detail for ID:', requestId);
}

async function loadHousingAllowanceDetail() {
  try {
    console.log('🔄 Loading housing allowance request from API...');
    
    // Load request details
    const request = await apiClient.makeRequest(`/housing-allowance/${requestId}`);
    
    if (!request || !request.data) {
      throw new Error('Request not found');
    }
    
    currentRequest = request.data;
    console.log('✅ Housing allowance request loaded:', currentRequest);
    
    // Render request details
    renderRequestDetails(currentRequest);
    
    // Load approval chain
    await loadApprovalChain();
    
  } catch (error) {
    console.error('❌ Error loading housing allowance request:', error);
    alert('فشل في تحميل تفاصيل الطلب: ' + error.message);
    window.location.href = 'admin-housing-allowance-inbox.html';
  }
}

function renderRequestDetails(request) {
  // Basic information
  document.getElementById('rid').textContent = request.reference_number || `HA-${request.id}`;
  document.getElementById('rstatus').textContent = getStatusText(request.status);
  document.getElementById('rstatus').className = 'badge ' + getStatusClass(request.status);
  
  document.getElementById('rname').textContent = request.employee_name || '-';
  document.getElementById('rdept').textContent = request.department || '-';
  document.getElementById('rjob').textContent = request.job_title || '-';
  document.getElementById('rempnum').textContent = request.employee_number || '-';
  document.getElementById('rnationality').textContent = request.nationality || 'سعودي';
  document.getElementById('rletterdate').textContent = formatDate(request.letter_date);
  document.getElementById('rperiodstart').textContent = formatDate(request.period_start);
  document.getElementById('rperiodend').textContent = formatDate(request.period_end);
  document.getElementById('rempnotes').textContent = request.employee_notes || 'لا توجد ملاحظات';
  
  // Additional housing details
  document.getElementById('rsocialstatus').textContent = request.social_status || '-';
  document.getElementById('rallowancereason').textContent = request.allowance_reason || '-';
  document.getElementById('rhousingdir').textContent = request.housing_director || '-';
  document.getElementById('rfinancename').textContent = request.finance_name || '-';
  document.getElementById('rhrdir').textContent = request.hr_director || '-';
  document.getElementById('rhijridate').textContent = request.hijri_date || '-';
  document.getElementById('rhousingmanagernote').textContent = request.housing_manager_note || 'لا توجد ملاحظات';
  document.getElementById('rfinancenote').textContent = request.finance_note || 'لا توجد ملاحظات';
}

async function loadApprovalChain() {
  try {
    console.log('🔄 Loading approval chain...');
    
    // Load approvals from multi-approval system
    const response = await apiClient.makeRequest(`/multi-approval/requests/housing_allowance/${requestId}/approvals`);
    
    if (response && response.data) {
      const progress = response.data;
      console.log('✅ Approval progress loaded:', progress);
      
      // Update approval status display
      if (progress.approval_stage) {
        const statusBadge = document.querySelector('.status-badge');
        if (statusBadge) {
          statusBadge.textContent = progress.approval_stage;
        }
      }
      
      // Extract approvals array from progress object
      currentApprovals = progress.approvals || [];
      console.log('✅ Approval chain:', currentApprovals);
      renderApprovalChain(currentApprovals);
    } else {
      renderApprovalChain([]);
    }
    
  } catch (error) {
    console.error('❌ Error loading approval chain:', error);
    renderApprovalChain([]);
  }
}

function renderApprovalChain(approvals) {
  const timeline = document.getElementById('timeline');
  timeline.innerHTML = '';
  
  if (!approvals || approvals.length === 0) {
    timeline.innerHTML = '<div style="text-align:center;color:var(--muted);padding:20px">لم يتم تعيين معتمدين لهذا الطلب</div>';
    return;
  }
  
  approvals.forEach((approval, index) => {
    const step = document.createElement('div');
    step.className = 'step';
    
    // Order number
    const order = document.createElement('div');
    order.className = 'order';
    order.textContent = approval.approval_order || (index + 1);
    
    // Approver info
    const who = document.createElement('div');
    who.innerHTML = `
      <div><strong>${approval.approver_name || approval.role_name || 'معتمد'}</strong></div>
      <div class="note">${approval.role_name || ''}</div>
    `;
    
    // Status
    const right = document.createElement('div');
    right.style.textAlign = 'left';
    const state = document.createElement('span');
    state.className = 'state';
    
    if (approval.decision === 'approved') {
      state.classList.add('s-acc');
      state.textContent = '✅ موافق';
    } else if (approval.decision === 'rejected') {
      state.classList.add('s-rej');
      state.textContent = '❌ مرفوض';
    } else if (approval.status === 'pending' && !approval.skipped_at) {
      state.classList.add('s-now');
      state.textContent = '⏳ قيد الاعتماد';
    } else if (approval.skipped_at) {
      state.classList.add('s-wait');
      state.textContent = '⏭️ متخطى';
    } else {
      state.classList.add('s-wait');
      state.textContent = '⏸️ منتظر';
    }
    
    right.appendChild(state);
    
    // Date if decided
    if (approval.decided_at) {
      const dateEl = document.createElement('div');
      dateEl.className = 'note';
      dateEl.textContent = formatDate(approval.decided_at);
      right.appendChild(dateEl);
    }
    
    step.append(order, who, right);
    timeline.appendChild(step);
  });
}

function setupEventListeners() {
  // Back button
  document.getElementById('btnBack').addEventListener('click', () => {
    window.location.href = 'admin-housing-allowance-inbox.html';
  });
  
  // Refresh approvals
  document.getElementById('btnRefreshApprovals').addEventListener('click', () => {
    loadApprovalChain();
  });
  
  // Approve button
  document.getElementById('btnApproveReq').addEventListener('click', async () => {
    if (!confirm('هل أنت متأكد من الموافقة على هذا الطلب؟')) return;
    
    try {
      const note = prompt('أدخل ملاحظة (اختياري):');
      
      await apiClient.makeRequest(`/multi-approval/requests/housing_allowance/${requestId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ note })
      });
      
      alert('تمت الموافقة بنجاح');
      window.location.reload();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('فشل في الموافقة على الطلب: ' + error.message);
    }
  });
  
  // Reject button
  document.getElementById('btnRejectReq').addEventListener('click', async () => {
    if (!confirm('هل أنت متأكد من رفض هذا الطلب؟')) return;
    
    try {
      const note = prompt('أدخل سبب الرفض (مطلوب):');
      if (!note) {
        alert('يجب إدخال سبب الرفض');
        return;
      }
      
      await apiClient.makeRequest(`/multi-approval/requests/housing_allowance/${requestId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ note })
      });
      
      alert('تم رفض الطلب بنجاح');
      window.location.reload();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('فشل في رفض الطلب: ' + error.message);
    }
  });
  
  // Print button
  document.getElementById('printBtn').addEventListener('click', () => {
    window.print();
  });
  
  // Export button
  document.getElementById('exportBtn').addEventListener('click', () => {
    exportToCSV();
  });
}

function exportToCSV() {
  if (!currentRequest) return;
  
  const headers = ['الحقل', 'القيمة'];
  const rows = [
    ['رقم الطلب', currentRequest.reference_number || `HA-${currentRequest.id}`],
    ['الموظف', currentRequest.employee_name || ''],
    ['القسم', currentRequest.department || ''],
    ['الوظيفة', currentRequest.job_title || ''],
    ['رقم الموظف', currentRequest.employee_number || ''],
    ['الجنسية', currentRequest.nationality || 'سعودي'],
    ['تاريخ الطلب', formatDate(currentRequest.letter_date)],
    ['من تاريخ', formatDate(currentRequest.period_start)],
    ['إلى تاريخ', formatDate(currentRequest.period_end)],
    ['الحالة الاجتماعية', currentRequest.social_status || ''],
    ['سبب الصرف', currentRequest.allowance_reason || ''],
    ['الحالة', getStatusText(currentRequest.status)]
  ];
  
  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.map(cell => `"${cell}"`).join(',') + '\n';
  });
  
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `housing_allowance_${requestId}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

// Utility functions
function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA');
  } catch {
    return dateStr;
  }
}

function getStatusText(status) {
  const statusMap = {
    'submitted': 'قيد الاعتماد',
    'pending': 'قيد الاعتماد',
    'approved': 'مكتمل',
    'rejected': 'مرفوض',
    'قيد الاعتماد': 'قيد الاعتماد',
    'مكتمل': 'مكتمل',
    'مرفوض': 'مرفوض'
  };
  return statusMap[status] || status || 'غير محدد';
}

function getStatusClass(status) {
  if (status === 'approved' || status === 'مكتمل') {
    return 'b-done';
  } else if (status === 'rejected' || status === 'مرفوض') {
    return 'b-rej';
  } else {
    return 'b-pend';
  }
}

