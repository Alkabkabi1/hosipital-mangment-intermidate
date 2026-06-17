// Admin Credentials Approval - Dedicated Page
// Handles the full view of all pending credentials with filtering and search

let allCredentials = [];
let currentFilter = 'all';

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎓 Initializing credentials approval page...');
  
  // Check authentication
  if (typeof window.waitForDependencies === 'function') {
    window.waitForDependencies(async () => {
      await initializePage();
    }, ['apiClient']);
  } else {
    setTimeout(initializePage, 500);
  }
});

async function initializePage() {
  try {
    // Check if user is authenticated
    if (!window.apiClient) {
      console.error('❌ API client not available');
      window.location.href = 'login.html';
      return;
    }
    
    const user = window.apiClient.getCurrentUser();
    if (!user) {
      console.error('❌ User not authenticated');
      window.location.href = 'login.html';
      return;
    }
    
    // Check if user is admin or HR
    if (!['admin', 'hr'].includes(user.role?.toLowerCase())) {
      console.error('❌ Insufficient permissions');
      alert('ليس لديك صلاحية للوصول لهذه الصفحة');
      window.location.href = 'employee-dashboard.html';
      return;
    }
    
    console.log('✅ User authenticated:', user.name, '- Role:', user.role);
    
    // Load credentials
    await loadAllCredentials();
    
  } catch (error) {
    console.error('❌ Initialization error:', error);
    showError('حدث خطأ في تحميل الصفحة');
  }
}

async function loadAllCredentials() {
  const container = document.getElementById('credentialsList');
  
  try {
    console.log('🔄 Loading all pending credentials...');
    
    // Show loading state
    container.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p style="color: var(--text-muted); font-weight: 600;">جاري تحميل البيانات...</p>
      </div>
    `;
    
    // Fetch grouped credentials
    const response = await window.apiClient.makeRequest('/employee/admin/pending-credentials');
    allCredentials = response.data || response || [];
    
    console.log('✅ Loaded credentials:', allCredentials);
    
    // Update statistics
    updateStatistics();
    
    // Render credentials
    renderCredentials();
    
  } catch (error) {
    console.error('❌ Error loading credentials:', error);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h2 class="empty-title">حدث خطأ في تحميل البيانات</h2>
        <p class="empty-text">${error.message || 'خطأ غير معروف'}</p>
        <button class="btn btn-white" onclick="loadAllCredentials()" style="margin-top: 20px; background: var(--primary); color: white;">
          🔄 إعادة المحاولة
        </button>
      </div>
    `;
  }
}

function updateStatistics() {
  const totalCerts = allCredentials.reduce((sum, emp) => sum + emp.certificates.length, 0);
  const totalLics = allCredentials.reduce((sum, emp) => sum + emp.licenses.length, 0);
  const total = totalCerts + totalLics;
  
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statCertificates').textContent = totalCerts;
  document.getElementById('statLicenses').textContent = totalLics;
  
  console.log('📊 Statistics updated:', { total, certificates: totalCerts, licenses: totalLics });
}

function renderCredentials() {
  const container = document.getElementById('credentialsList');
  
  // Filter credentials based on current filter
  let filteredCredentials = allCredentials.filter(emp => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'certificates') return emp.certificates.length > 0;
    if (currentFilter === 'licenses') return emp.licenses.length > 0;
    return true;
  });
  
  // Apply search filter
  const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
  if (searchTerm) {
    filteredCredentials = filteredCredentials.filter(emp => {
      const matchesName = emp.employee_name?.toLowerCase().includes(searchTerm);
      const matchesEmail = emp.employee_email?.toLowerCase().includes(searchTerm);
      const matchesDept = emp.department_name?.toLowerCase().includes(searchTerm);
      const matchesCert = emp.certificates.some(c => c.certificate_name?.toLowerCase().includes(searchTerm));
      const matchesLic = emp.licenses.some(l => l.license_name?.toLowerCase().includes(searchTerm));
      
      return matchesName || matchesEmail || matchesDept || matchesCert || matchesLic;
    });
  }
  
  // Show empty state if no results
  if (filteredCredentials.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h2 class="empty-title">لا توجد نتائج</h2>
        <p class="empty-text">${searchTerm ? 'لم يتم العثور على نتائج مطابقة للبحث' : 'جميع الشهادات والتراخيص تمت معالجتها'}</p>
      </div>
    `;
    return;
  }
  
  // Render employee cards
  const html = filteredCredentials.map((emp, index) => renderEmployeeCard(emp, index === 0)).join('');
  container.innerHTML = html;
  
  console.log('✅ Rendered', filteredCredentials.length, 'employee cards');
}

function renderEmployeeCard(employee, isFirstCard = false) {
  const certCount = employee.certificates.length;
  const licCount = employee.licenses.length;
  const totalItems = certCount + licCount;
  
  // Get initials for avatar
  const initials = employee.employee_name
    ?.split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('') || '؟';
  
  return `
    <div class="employee-card ${!isFirstCard ? '' : ''}" data-employee-id="${employee.employee_id}">
      <!-- Employee Header -->
      <div class="employee-header" onclick="toggleEmployeeCard(${employee.employee_id})" title="انقر للتوسيع/الطي">
        <div class="employee-info">
          <div class="employee-avatar">${initials}</div>
          <div class="employee-details">
            <h3>${employee.employee_name || 'غير محدد'}</h3>
            <div class="employee-meta">
              <span>📧 ${employee.employee_email || 'غير محدد'}</span>
              <span>🏢 ${employee.department_name || 'غير محدد'}</span>
              ${employee.job_title ? `<span>💼 ${employee.job_title}</span>` : ''}
              ${employee.employee_number ? `<span>🔢 ${employee.employee_number}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="employee-badge">
          <span>${totalItems} ${totalItems === 1 ? 'طلب' : 'طلبات'}</span>
          <span class="toggle-arrow">▼</span>
        </div>
      </div>
      
      <!-- Credentials Content -->
      <div class="credentials-content">
        ${certCount > 0 ? renderCertificatesSection(employee.certificates) : ''}
        ${licCount > 0 ? renderLicensesSection(employee.licenses) : ''}
      </div>
    </div>
  `;
}

function renderCertificatesSection(certificates) {
  return `
    <div class="credential-section">
      <div class="section-title">
        🎓 الشهادات العلمية (${certificates.length})
      </div>
      ${certificates.map(cert => renderCertificateItem(cert)).join('')}
    </div>
  `;
}

function renderCertificateItem(cert) {
  const typeLabel = getCertificateTypeArabic(cert.certificate_type);
  const typeClass = `type-${cert.certificate_type}`;
  
  return `
    <div class="credential-item">
      <div class="credential-header">
        <div>
          <div class="credential-title">${cert.certificate_name}</div>
          <span class="type-badge ${typeClass}">${typeLabel}</span>
        </div>
        <div style="text-align: left; color: var(--text-muted); font-size: 12px;">
          #${cert.id}
        </div>
      </div>
      
      <div class="credential-meta">
        <div class="credential-meta-item">
          🏛️ <strong>الجهة:</strong> ${cert.issuing_institution}
        </div>
        ${cert.field_of_study ? `
        <div class="credential-meta-item">
          📚 <strong>التخصص:</strong> ${cert.field_of_study}
        </div>
        ` : ''}
        ${cert.issue_date ? `
        <div class="credential-meta-item">
          📅 <strong>تاريخ الإصدار:</strong> ${formatDate(cert.issue_date)}
        </div>
        ` : ''}
        <div class="credential-meta-item">
          ⏰ <strong>تاريخ الإضافة:</strong> ${formatDateTime(cert.created_at)}
        </div>
      </div>
      
      ${cert.description ? `
      <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 12px; font-size: 13px; color: var(--text-muted);">
        💬 ${cert.description}
      </div>
      ` : ''}
      
      <div class="credential-actions">
        <button class="action-btn btn-approve" onclick="approveCredential('certificate', ${cert.id})">
          ✓ موافقة
        </button>
        <button class="action-btn btn-reject" onclick="rejectCredential('certificate', ${cert.id}, '${cert.certificate_name}')">
          ✗ رفض
        </button>
      </div>
    </div>
  `;
}

function renderLicensesSection(licenses) {
  return `
    <div class="credential-section">
      <div class="section-title">
        🪪 التراخيص والاعتمادات المهنية (${licenses.length})
      </div>
      ${licenses.map(lic => renderLicenseItem(lic)).join('')}
    </div>
  `;
}

function renderLicenseItem(lic) {
  const typeLabel = getLicenseTypeArabic(lic.license_type);
  const typeClass = `type-${lic.license_type}`;
  const expiryInfo = getExpiryInfo(lic.expiry_date);
  
  return `
    <div class="credential-item">
      <div class="credential-header">
        <div>
          <div class="credential-title">${lic.license_name}</div>
          <span class="type-badge ${typeClass}">${typeLabel}</span>
        </div>
        <div style="text-align: left; color: var(--text-muted); font-size: 12px;">
          #${lic.id}
        </div>
      </div>
      
      <div class="credential-meta">
        <div class="credential-meta-item">
          🔢 <strong>رقم الترخيص:</strong> ${lic.license_number}
        </div>
        <div class="credential-meta-item">
          🏛️ <strong>الجهة المانحة:</strong> ${lic.issuing_authority}
        </div>
        ${lic.issue_date ? `
        <div class="credential-meta-item">
          📅 <strong>تاريخ الإصدار:</strong> ${formatDate(lic.issue_date)}
        </div>
        ` : ''}
        <div class="credential-meta-item" style="${expiryInfo.style}">
          ${expiryInfo.icon} <strong>تاريخ الانتهاء:</strong> ${formatDate(lic.expiry_date)}
        </div>
        <div class="credential-meta-item">
          ⏰ <strong>تاريخ الإضافة:</strong> ${formatDateTime(lic.created_at)}
        </div>
      </div>
      
      ${lic.description ? `
      <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 12px; font-size: 13px; color: var(--text-muted);">
        💬 ${lic.description}
      </div>
      ` : ''}
      
      ${expiryInfo.warning ? `
      <div style="background: ${expiryInfo.warningBg}; padding: 12px; border-radius: 8px; margin-bottom: 12px; font-size: 13px; color: ${expiryInfo.warningColor}; font-weight: 600;">
        ${expiryInfo.warning}
      </div>
      ` : ''}
      
      <div class="credential-actions">
        <button class="action-btn btn-approve" onclick="approveCredential('license', ${lic.id})">
          ✓ موافقة
        </button>
        <button class="action-btn btn-reject" onclick="rejectCredential('license', ${lic.id}, '${lic.license_name}')">
          ✗ رفض
        </button>
      </div>
    </div>
  `;
}

// Filtering
function filterCredentials(filter) {
  currentFilter = filter;
  
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');
  
  // Re-render
  renderCredentials();
  
  console.log('🔍 Filter applied:', filter);
}

// Search
function searchCredentials() {
  renderCredentials();
}

// Approve credential
async function approveCredential(type, id) {
  try {
    console.log(`🔄 Approving ${type} ID ${id}`);
    
    const endpoint = type === 'certificate' 
      ? `/employee/admin/certificates/${id}/approve`
      : `/employee/admin/licenses/${id}/approve`;
    
    await window.apiClient.makeRequest(endpoint, { method: 'POST' });
    
    showSuccess(`تم الموافقة على ${type === 'certificate' ? 'الشهادة' : 'الترخيص'} بنجاح`);
    
    // Reload credentials
    setTimeout(() => {
      loadAllCredentials();
    }, 500);
    
  } catch (error) {
    console.error(`❌ Error approving ${type}:`, error);
    showError(`حدث خطأ في الموافقة: ${error.message || 'خطأ غير معروف'}`);
  }
}

// Reject credential
async function rejectCredential(type, id, name) {
  try {
    // Show confirmation
    const confirmed = await showConfirm({
      title: 'تأكيد الرفض',
      message: `هل أنت متأكد من رفض:<br><strong>"${name}"</strong><br><br>⚠️ سيتم حذف البيانات نهائياً ولا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'رفض نهائياً',
      cancelText: 'إلغاء',
      type: 'danger'
    });
    
    if (!confirmed) return;
    
    console.log(`🔄 Rejecting ${type} ID ${id}`);
    
    const endpoint = type === 'certificate' 
      ? `/employee/admin/certificates/${id}/reject`
      : `/employee/admin/licenses/${id}/reject`;
    
    await window.apiClient.makeRequest(endpoint, { method: 'POST' });
    
    showSuccess(`تم رفض ${type === 'certificate' ? 'الشهادة' : 'الترخيص'}`);
    
    // Reload credentials
    setTimeout(() => {
      loadAllCredentials();
    }, 500);
    
  } catch (error) {
    console.error(`❌ Error rejecting ${type}:`, error);
    showError(`حدث خطأ في الرفض: ${error.message || 'خطأ غير معروف'}`);
  }
}

// Helper functions
function getCertificateTypeArabic(type) {
  const types = {
    'bachelor': 'بكالوريوس',
    'master': 'ماجستير',
    'phd': 'دكتوراه',
    'diploma': 'دبلوم',
    'certificate': 'شهادة',
    'training': 'دورة تدريبية',
    'other': 'أخرى'
  };
  return types[type] || type;
}

function getLicenseTypeArabic(type) {
  const types = {
    'medical': 'طبي',
    'nursing': 'تمريض',
    'pharmacy': 'صيدلة',
    'laboratory': 'مختبرات',
    'radiology': 'أشعة',
    'professional': 'مهني',
    'other': 'أخرى'
  };
  return types[type] || type;
}

function getExpiryInfo(expiryDate) {
  if (!expiryDate) return { icon: '📅', style: '', warning: null };
  
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return {
      icon: '⛔',
      style: 'color: #dc2626; font-weight: 700;',
      warning: `⚠️ هذا الترخيص منتهي منذ ${Math.abs(diffDays)} يوم!`,
      warningBg: '#fee2e2',
      warningColor: '#991b1b'
    };
  } else if (diffDays <= 30) {
    return {
      icon: '⚠️',
      style: 'color: #f59e0b; font-weight: 700;',
      warning: `⏰ سينتهي هذا الترخيص خلال ${diffDays} يوم فقط!`,
      warningBg: '#fef3c7',
      warningColor: '#92400e'
    };
  } else if (diffDays <= 90) {
    return {
      icon: '⏳',
      style: 'color: #3b82f6;',
      warning: null
    };
  } else {
    return {
      icon: '✅',
      style: 'color: #10b981;',
      warning: null
    };
  }
}

function formatDate(dateString) {
  if (!dateString) return 'غير محدد';
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatDateTime(dateString) {
  if (!dateString) return 'غير محدد';
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function showSuccess(message) {
  if (window.showSuccess) {
    window.showSuccess(message);
  } else {
    alert(message);
  }
}

function showError(message) {
  if (window.showError) {
    window.showError(message);
  } else {
    alert(message);
  }
}

// Toggle employee card expand/collapse
function toggleEmployeeCard(employeeId) {
  const card = document.querySelector(`[data-employee-id="${employeeId}"]`);
  if (card) {
    card.classList.toggle('collapsed');
  }
}

// Collapse all cards
function collapseAllCards() {
  document.querySelectorAll('.employee-card').forEach(card => {
    card.classList.add('collapsed');
  });
}

// Expand all cards
function expandAllCards() {
  document.querySelectorAll('.employee-card').forEach(card => {
    card.classList.remove('collapsed');
  });
}

// Make functions global
window.approveCredential = approveCredential;
window.rejectCredential = rejectCredential;
window.filterCredentials = filterCredentials;
window.searchCredentials = searchCredentials;
window.toggleEmployeeCard = toggleEmployeeCard;
window.collapseAllCards = collapseAllCards;
window.expandAllCards = expandAllCards;

