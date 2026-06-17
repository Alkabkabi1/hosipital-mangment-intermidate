// Employee Certificate Detail - View comprehensive certificate request details
// This page is accessible to employees for their own requests

document.addEventListener('DOMContentLoaded', function() {
  // Wait for dependencies
  if (typeof window.waitForDependencies === 'function') {
    window.waitForDependencies(() => {
      initializePage();
    }, ['apiClient', 'DetailUtils']);
  } else {
    setTimeout(initializePage, 500);
  }
});

function initializePage() {
  // Check authentication
  if (!window.DetailUtils.requireAuth()) return;

  // Get request ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const requestId = urlParams.get('id');
  
  if (!requestId) {
    window.DetailUtils.showError('معرف الطلب غير صحيح');
    setTimeout(() => history.back(), 2000);
    return;
  }

  // Load request details
  loadCertificateDetails(requestId);
}

async function loadCertificateDetails(requestId) {
  // Show loading
  const timelineContainer = document.getElementById('timelineContainer');
  if (timelineContainer) {
    timelineContainer.innerHTML = '<div class="timeline-item"><div class="timeline-event">جاري تحميل البيانات...</div></div>';
  }
  
  try {
    console.log('📜 Loading certificate details for ID:', requestId);
    
    const apiClient = window.DetailUtils.getApiClient();
    if (!apiClient) {
      throw new Error('API client not available');
    }
    
    const response = await apiClient.getCertificateById(requestId);
    console.log('📜 Received certificate details:', response);
    
    if (!response) {
      throw new Error('No data received');
    }
    
    // Add smooth reveal animation
    setTimeout(() => {
      displayCertificateDetails(response);
    }, 100);
    
  } catch (error) {
    console.error('Error loading certificate details:', error);
    
    // Show user-friendly error message
    if (error.status === 404) {
      showEmptyState('📜', 'الطلب غير موجود', 'لم يتم العثور على الطلب المطلوب في قاعدة البيانات');
    } else if (error.status === 403) {
      showEmptyState('🔒', 'غير مصرح', 'ليس لديك صلاحية لعرض هذا الطلب');
    } else {
      showEmptyState('⚠️', 'حدث خطأ', 'حدث خطأ في تحميل تفاصيل الطلب. يرجى المحاولة مرة أخرى.');
    }
    
    // Show option to go back
    setTimeout(() => {
      if (confirm('هل تريد العودة إلى الصفحة السابقة؟')) {
        history.back();
      }
    }, 2000);
  }
}

function showEmptyState(icon, title, message) {
  const container = document.querySelector('.container');
  if (container) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 100px 20px; text-align: center;">
        <div class="empty-state-icon" style="font-size: 72px; margin-bottom: 20px;">${icon}</div>
        <h2 style="font-size: 24px; color: var(--text); margin-bottom: 12px;">${title}</h2>
        <p style="font-size: 16px; color: var(--muted); margin-bottom: 32px;">${message}</p>
        <button class="btn btn-primary" onclick="history.back()">← العودة إلى الصفحة السابقة</button>
      </div>
    `;
  }
}

function displayCertificateDetails(data) {
  console.log('📜 Displaying certificate details:', data);
  
  // Update page title
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) {
    pageTitle.textContent = `تفاصيل طلب شهادة التعريف #${data.id || data.certificate_id}`;
  }
  
  // Basic information
  const reqId = document.getElementById('requestId');
  if (reqId) reqId.textContent = `#${data.id || data.certificate_id}`;
  
  const status = document.getElementById('currentStatus');
  if (status) status.innerHTML = getStatusBadge(data.status || data.final_decision || 'pending');
  
  const reqDate = document.getElementById('requestDate');
  if (reqDate) reqDate.textContent = window.DetailUtils.formatDate(data.created_at);
  
  const lastUpdate = document.getElementById('lastUpdate');
  if (lastUpdate) lastUpdate.textContent = window.DetailUtils.formatDate(data.updated_at || data.created_at);
  
  // Certificate Information
  displayCertificateInfo(data);
  
  // Timeline
  displayTimeline(data);
}

function displayCertificateInfo(data) {
  const grid = document.getElementById('certificateInfoGrid');
  if (!grid) return;
  
  const items = [];
  
  // Employee name
  if (data.employee_name || data.employee_name_from_user) {
    items.push({ label: 'اسم الموظف', value: data.employee_name || data.employee_name_from_user });
  }
  
  // Occupation
  if (data.occupation) {
    items.push({ label: 'المهنة', value: data.occupation });
  }
  
  // Nationality
  if (data.nationality) {
    items.push({ label: 'الجنسية', value: data.nationality });
  }
  
  // Iqama number
  if (data.iqama_number) {
    items.push({ label: 'رقم الإقامة', value: data.iqama_number });
  } else {
    items.push({ label: 'رقم الإقامة', value: 'غير محدد' });
  }
  
  // Passport number
  if (data.passport_number) {
    items.push({ label: 'رقم الجواز', value: data.passport_number });
  } else {
    items.push({ label: 'رقم الجواز', value: 'غير محدد' });
  }
  
  // Education place
  if (data.education_place) {
    items.push({ label: 'مكان التعليم', value: data.education_place });
  } else {
    items.push({ label: 'مكان التعليم', value: 'غير محدد' });
  }
  
  // Request notes
  if (data.request_notes) {
    items.push({ label: 'ملاحظات الطلب', value: data.request_notes });
  }
  
  // Admin notes
  if (data.admin_notes) {
    items.push({ label: 'ملاحظات المدير', value: data.admin_notes });
  }
  
  // Rejection reason
  if (data.rejection_reason) {
    items.push({ label: 'سبب الرفض', value: data.rejection_reason });
  }
  
  if (items.length > 0) {
    grid.innerHTML = items.map(item => `
      <div class="info-item">
        <span class="info-label">${item.label}</span>
        <span class="info-value">${escapeHtml(String(item.value))}</span>
      </div>
    `).join('');
  } else {
    grid.innerHTML = '<div class="info-item"><span class="info-label">لا توجد معلومات متاحة</span></div>';
  }
}

function displayTimeline(data) {
  const container = document.getElementById('timelineContainer');
  if (!container) return;
  
  const events = [];
  
  // Request created
  events.push({
    event: 'تم إنشاء طلب شهادة التعريف',
    date: data.created_at,
    user: data.employee_name || data.employee_name_from_user || 'الموظف',
    details: `المهنة: ${data.occupation || 'غير محدد'}`
  });
  
  // Status updates
  const currentStatus = data.status || data.final_decision || 'pending';
  if (currentStatus !== 'pending' && currentStatus !== 'قيد الاعتماد') {
    const statusText = currentStatus === 'approved' ? 'موافق عليه' :
                      currentStatus === 'rejected' ? 'مرفوض' :
                      currentStatus === 'completed' ? 'مكتمل' :
                      currentStatus;
    
    events.push({
      event: `تم تحديث الحالة إلى: ${statusText}`,
      date: data.updated_at || data.created_at,
      user: 'المدير'
    });
  }
  
  // Approved
  if (data.approved_at) {
    events.push({
      event: 'تمت الموافقة على الطلب',
      date: data.approved_at,
      user: 'المدير',
      details: data.admin_notes || null
    });
  }
  
  // Rejected
  if (data.rejection_reason || currentStatus === 'rejected') {
    events.push({
      event: 'تم رفض الطلب',
      date: data.updated_at || data.created_at,
      user: 'المدير',
      details: data.rejection_reason || data.admin_notes || null
    });
  }
  
  if (events.length === 0) {
    container.innerHTML = '<div class="timeline-item"><div class="timeline-event">لا توجد أحداث متاحة</div></div>';
    return;
  }
  
  container.innerHTML = events.map(event => `
    <div class="timeline-item">
      <div class="timeline-event">${event.event}</div>
      <div class="timeline-meta">
        📅 ${window.DetailUtils.formatDateTime(event.date)} 
        • 👤 ${event.user}
        ${event.details ? `<br>💬 ${event.details}` : ''}
      </div>
    </div>
  `).join('');
}

function getStatusBadge(status) {
  const statusMap = {
    'pending': 'قيد الانتظار',
    'approved': 'موافق عليه',
    'rejected': 'مرفوض',
    'completed': 'مكتمل',
    'in_progress': 'قيد التنفيذ'
  };
  
  const statusText = statusMap[status] || status;
  const badges = {
    'قيد الاعتماد': '<span class="status-badge status-pending">⏳ قيد الاعتماد</span>',
    'قيد الانتظار': '<span class="status-badge status-pending">⏳ قيد الانتظار</span>',
    'قيد المراجعة': '<span class="status-badge status-pending">🔍 قيد المراجعة</span>',
    'موافق عليه': '<span class="status-badge status-approved">✅ موافق عليه</span>',
    'مرفوض': '<span class="status-badge status-rejected">❌ مرفوض</span>',
    'معلق': '<span class="status-badge status-hold">⏸️ معلق</span>',
    'مكتمل': '<span class="status-badge status-approved">✅ مكتمل</span>'
  };
  
  return badges[statusText] || `<span class="status-badge">${statusText}</span>`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

console.log('✅ Employee certificate detail script loaded');

