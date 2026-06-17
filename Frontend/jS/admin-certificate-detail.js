// Admin Certificate Detail JavaScript
// Handles detailed view and management of certificate requests

document.addEventListener('DOMContentLoaded', function() {
  // Check if data is already loaded by HTML page
  if (window.currentCertificate) {
    setupPrintExportListeners();
    return;
  }

  // Wait for dependencies
  if (typeof window.DetailUtils === 'undefined') {
    console.error('DetailUtils not loaded');
    setTimeout(() => {
      if (typeof window.DetailUtils === 'undefined') {
        alert('خطأ: لم يتم تحميل المكتبات المطلوبة');
        return;
      }
      initializePage();
    }, 500);
  } else {
    initializePage();
  }
});

function initializePage() {
  // Check authentication
  if (!window.DetailUtils.requireAuth()) return;
  
  // Check authorization - ONLY ADMIN, MANAGER, or HR
  if (!canAccessCertificateDetail()) {
    window.DetailUtils.showError('ليس لديك صلاحية للوصول إلى هذه الصفحة. مطلوب: دور ADMIN أو MANAGER أو HR.');
    setTimeout(() => {
      window.location.href = window.resolveFrontendPath ? 
        window.resolveFrontendPath('employee-dashboard.html') : 
        'employee-dashboard.html';
    }, 3000);
    return;
  }

  // Get certificate ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const certificateId = urlParams.get('id');
  
  if (!certificateId) {
    showError('معرف الطلب غير صحيح');
    setTimeout(() => {
      window.location.href = 'admin-certificate-inbox.html';
    }, 2000);
    return;
  }

  // Initialize page
  loadCertificateDetails(certificateId);
  setupEventListeners();
}

function canAccessCertificateDetail() {
  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  if (!authUser) return false;
  
  // Check 1: ADMIN role
  if (window.rolePermissions && window.rolePermissions.hasRole('ADMIN')) {
    console.log('✅ Certificate access granted: User is ADMIN');
    return true;
  }
  
  // Check 2: MANAGER role
  if (window.rolePermissions && window.rolePermissions.hasRole('MANAGER')) {
    console.log('✅ Certificate access granted: User is MANAGER');
    return true;
  }
  
  // Check 3: HR role
  if (window.rolePermissions && window.rolePermissions.hasRole('HR')) {
    console.log('✅ Certificate access granted: User is HR');
    return true;
  }
  
  // Check 4: Admin role (legacy)
  if (authUser.role === 'admin') {
    console.log('✅ Certificate access granted: User is admin (legacy)');
    return true;
  }
  
  console.log('❌ Certificate access denied: User must be ADMIN, MANAGER, or HR');
  return false;
}

let currentCertificate = null;

function setupEventListeners() {
  // Back button
  const backBtn = document.getElementById('btnBack');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'admin-certificate-inbox.html';
    });
  }

  // Setup print/export listeners
  setupPrintExportListeners();

  // Status update buttons
  const approveBtn = document.getElementById('btnApproveReq');
  const rejectBtn = document.getElementById('btnRejectReq');
  
  console.log('🔘 Setting up certificate button listeners...', { approveBtn: !!approveBtn, rejectBtn: !!rejectBtn });
  
  if (approveBtn) {
    approveBtn.onclick = null;
    approveBtn.addEventListener('click', () => {
      console.log('👍 Approve button clicked');
      updateCertificateStatus('مكتمل');
    });
  }
  
  if (rejectBtn) {
    rejectBtn.onclick = null;
    rejectBtn.addEventListener('click', () => {
      console.log('👎 Reject button clicked');
      updateCertificateStatus('مرفوض');
    });
  }
}

async function loadCertificateDetails(certificateId) {
  try {
    window.DetailUtils.showLoading();
    
    const certificate = await window.DetailUtils.loadRequestDetails(
      'certificate',
      certificateId,
      async (apiClient) => {
        if (apiClient && typeof apiClient.getCertificateById === 'function') {
          return await apiClient.getCertificateById(certificateId);
        }
        throw new Error('getCertificateById not available');
      }
    );
    
    currentCertificate = certificate;
    window.currentCertificate = certificate; // Make it globally accessible
    
    console.log('✅ currentCertificate set:', window.currentCertificate);
    
    displayCertificateDetails(certificate);
    loadCertificateHistory(certificateId);
    
  } catch (error) {
    console.error('Certificate details loading error:', error);
    window.DetailUtils.showError('حدث خطأ في تحميل تفاصيل طلب الشهادة');
  } finally {
    window.DetailUtils.hideLoading();
  }
}

function displayCertificateDetails(certificate) {
  console.log('🎨 displayCertificateDetails called with data:', certificate);
  
  // Basic information - using IDs from the HTML
  const elements = {
    rid: document.getElementById('rid'),
    rstatus: document.getElementById('rstatus'),
    rname: document.getElementById('rname'),
    remail: document.getElementById('remail'),
    roccupation: document.getElementById('roccupation'),
    rnationality: document.getElementById('rnationality'),
    riqama: document.getElementById('riqama'),
    rpassport: document.getElementById('rpassport'),
    reducation: document.getElementById('reducation'),
    rcreated: document.getElementById('rcreated'),
    rnotes: document.getElementById('rnotes')
  };
  
  console.log('📝 Found elements:', Object.keys(elements).filter(k => elements[k]).length, 'of', Object.keys(elements).length);

  // Populate the basic info fields
  if (elements.rid) {
    elements.rid.textContent = certificate.id || certificate.certificate_id || '-';
    console.log('✅ Set certificate ID:', elements.rid.textContent);
  }
  
  if (elements.rstatus) {
    const statusBadgeHTML = getCertificateStatusBadge(certificate.status || certificate.final_decision || 'pending');
    elements.rstatus.outerHTML = statusBadgeHTML;
    console.log('✅ Set status:', certificate.status);
  }
  
  if (elements.rname) {
    elements.rname.textContent = certificate.employee_name || certificate.employee_name_from_user || 'غير محدد';
    console.log('✅ Set employee name:', elements.rname.textContent);
  }
  
  if (elements.remail) {
    elements.remail.textContent = certificate.employee_email || 'غير محدد';
    console.log('✅ Set email:', elements.remail.textContent);
  }
  
  if (elements.roccupation) {
    elements.roccupation.textContent = certificate.occupation || 'غير محدد';
    console.log('✅ Set occupation:', elements.roccupation.textContent);
  }
  
  if (elements.rnationality) {
    elements.rnationality.textContent = certificate.nationality || 'غير محدد';
  }
  
  if (elements.riqama) {
    elements.riqama.textContent = certificate.iqama_number || 'غير محدد';
  }
  
  if (elements.rpassport) {
    elements.rpassport.textContent = certificate.passport_number || 'غير محدد';
  }
  
  if (elements.reducation) {
    elements.reducation.textContent = certificate.education_place || 'غير محدد';
  }
  
  if (elements.rcreated) {
    elements.rcreated.textContent = window.DetailUtils.formatDate(certificate.created_at);
    console.log('✅ Set created date:', elements.rcreated.textContent);
  }
  
  if (elements.rnotes) {
    elements.rnotes.textContent = certificate.request_notes || certificate.admin_notes || 'لا توجد ملاحظات';
  }

  console.log('✅ All basic fields populated successfully!');

  // Update action buttons based on status
  updateActionButtons(certificate);
  
  // Display timeline
  console.log('📊 Calling displayTimeline...');
  displayTimeline(certificate);
  
  // Render department status if function exists
  if (typeof window.renderDepartmentStatus === 'function') {
    console.log('📊 Calling renderDepartmentStatus...');
    setTimeout(() => {
      window.renderDepartmentStatus();
    }, 200);
  }
  
  console.log('🎉 Page fully rendered with all data!');
}

function getCertificateStatusBadge(status) {
  const statusMap = {
    'pending': 'قيد الانتظار',
    'approved': 'موافق عليه',
    'rejected': 'مرفوض',
    'completed': 'مكتمل',
    'in_progress': 'قيد التنفيذ'
  };
  
  const statusText = statusMap[status] || status;
  const statusBadges = {
    'قيد الانتظار': '<span class="badge b-pend">قيد الانتظار</span>',
    'موافق عليه': '<span class="badge b-done">موافق عليه</span>',
    'مرفوض': '<span class="badge b-rej">مرفوض</span>',
    'مكتمل': '<span class="badge b-done">مكتمل</span>',
    'قيد التنفيذ': '<span class="badge b-pend">قيد التنفيذ</span>'
  };
  
  return statusBadges[statusText] || `<span class="badge">${statusText}</span>`;
}

function updateActionButtons(certificate) {
  const approveBtn = document.getElementById('btnApproveReq');
  const rejectBtn = document.getElementById('btnRejectReq');
  
  const status = certificate.status || certificate.final_decision || 'pending';
  const canApprove = ['pending', 'in_progress'].includes(status);
  const canReject = ['pending', 'in_progress'].includes(status);
  
  if (approveBtn) {
    approveBtn.disabled = !canApprove;
    approveBtn.style.display = canApprove ? 'inline-flex' : 'none';
  }
  
  if (rejectBtn) {
    rejectBtn.disabled = !canReject;
    rejectBtn.style.display = canReject ? 'inline-flex' : 'none';
  }
}

function displayTimeline(certificate) {
  const timelineContainer = document.getElementById('timeline');
  if (!timelineContainer) return;

  // Mock timeline data - in real app, this would come from API
  const timelineEvents = [
    {
      date: certificate.created_at,
      event: 'تم إنشاء طلب الشهادة',
      user: certificate.employee_name || 'الموظف',
      type: 'created',
      details: `المهنة: ${certificate.occupation}`
    }
  ];

  // Add status updates
  if (certificate.status !== 'pending') {
    timelineEvents.push({
      date: certificate.updated_at || certificate.created_at,
      event: `تم تحديث الحالة إلى: ${certificate.status}`,
      user: 'المدير',
      type: 'status_update'
    });
  }

  const timelineHTML = timelineEvents.map((event, index) => {
    let statusClass = 's-wait';
    let statusText = 'منتظر';
    
    if (event.type === 'created') {
      statusClass = 's-now';
      statusText = 'تم الإنشاء';
    } else if (certificate.status === 'approved') {
      statusClass = 's-acc';
      statusText = 'موافق';
    } else if (certificate.status === 'rejected') {
      statusClass = 's-rej';
      statusText = 'مرفوض';
    }
    
    return `
      <div class="step">
        <div class="order">${index + 1}</div>
        <div>
          <b>${event.user}</b><br>
          <span class="note">${event.event}</span>
        </div>
        <div style="text-align:left">
          <span class="state ${statusClass}">${statusText}</span>
        </div>
      </div>
    `;
  }).join('');

  timelineContainer.innerHTML = timelineHTML || '<div class="note">لا توجد أحداث</div>';
}

async function loadCertificateHistory(certificateId) {
  try {
    console.log('Loading history for certificate:', certificateId);
    // This would typically call an API endpoint for history
  } catch (error) {
    console.error('History loading error:', error);
  }
}

async function updateCertificateStatus(newStatus) {
  if (!currentCertificate) {
    console.error('❌ No current certificate loaded');
    return;
  }

  console.log('🔄 updateCertificateStatus called with status:', newStatus);

  let confirmMessage = `هل أنت متأكد من تحديث حالة طلب الشهادة إلى "${newStatus}"؟`;
  let reason = null;

  if (newStatus === 'مرفوض') {
    reason = prompt('سبب الرفض:');
    if (!reason) return;
  }

  if (!confirm(confirmMessage)) return;

  try {
    console.log('📡 Sending approval/rejection request to API...');
    
    const apiClient = window.DetailUtils.getApiClient();
    if (!apiClient) {
      throw new Error('API client not available');
    }

    // Use multi-approval API endpoints
    if (newStatus === 'مكتمل' || newStatus === 'موافق عليه') {
      console.log('👍 Calling approve API...');
      const response = await apiClient.makeRequest(`/requests/certificate/${currentCertificate.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ note: reason || 'موافقة' })
      });
      console.log('✅ Approve response:', response);
    } else if (newStatus === 'مرفوض') {
      console.log('👎 Calling reject API...');
      const response = await apiClient.makeRequest(`/requests/certificate/${currentCertificate.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ note: reason || 'رفض' })
      });
      console.log('✅ Reject response:', response);
    }
    
    window.DetailUtils.showSuccess(`تم تحديث حالة الطلب إلى "${newStatus}" بنجاح`);
    
    // Reload page to show updated status
    setTimeout(() => {
      console.log('🔄 Reloading certificate details...');
      window.location.reload();
    }, 1500);
    
  } catch (error) {
    console.error('❌ Status update error:', error);
    window.DetailUtils.showError('حدث خطأ في تحديث حالة الطلب: ' + (error.message || 'خطأ غير معروف'));
  }
}

function setupPrintExportListeners() {
  // Print button
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Export button
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportCertificateCSV();
    });
  }
}

function exportCertificateCSV() {
  if (!currentCertificate) {
    showError('لا توجد بيانات للتصدير');
    return;
  }

  const exportData = {
    'رقم الطلب': currentCertificate.id || '-',
    'اسم الموظف': currentCertificate.employee_name || '-',
    'المهنة': currentCertificate.occupation || '-',
    'الجنسية': currentCertificate.nationality || '-',
    'رقم الإقامة': currentCertificate.iqama_number || '-',
    'رقم الجواز': currentCertificate.passport_number || '-',
    'تاريخ الإنشاء': window.DetailUtils.formatDate(currentCertificate.created_at),
    'الحالة': currentCertificate.status || '-'
  };

  const csvContent = Object.entries(exportData)
    .map(([key, value]) => `"${key}","${value}"`)
    .join('\n');

  const finalContent = 'الحقل,القيمة\n' + csvContent;

  const blob = new Blob([finalContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `certificate_${currentCertificate.id}.csv`;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
  
  alert('تم تصدير بيانات طلب الشهادة بنجاح');
}

function showError(message) {
  if (window.DetailUtils && window.DetailUtils.showError) {
    window.DetailUtils.showError(message);
  } else {
    alert('خطأ: ' + message);
  }
}

function exportExcel() {
  exportCertificateCSV();
}

