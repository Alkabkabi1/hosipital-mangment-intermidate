// Admin Profile JavaScript
// Handles admin profile functionality with additional admin-specific features

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication and admin role
  if (!requireAuth()) return;
  if (!requireAdmin()) return;

  // Initialize profile
  loadAdminProfile();
  setupEventListeners();
  loadSystemInfo();
});

function setupEventListeners() {
  // Edit profile button
  const editBtn = document.getElementById('editProfileBtn');
  if (editBtn) {
    editBtn.addEventListener('click', toggleEditMode);
  }

  // Save profile button
  const saveBtn = document.getElementById('saveProfileBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveProfile);
  }

  // Cancel edit button
  const cancelBtn = document.getElementById('cancelEditBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', cancelEdit);
  }

  // Change password button
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', showChangePasswordModal);
  }

  // Admin settings button
  const adminSettingsBtn = document.getElementById('adminSettingsBtn');
  if (adminSettingsBtn) {
    adminSettingsBtn.addEventListener('click', showAdminSettingsModal);
  }

  // System logs button
  const systemLogsBtn = document.getElementById('systemLogsBtn');
  if (systemLogsBtn) {
    systemLogsBtn.addEventListener('click', showSystemLogs);
  }

  // Backup data button
  const backupBtn = document.getElementById('backupBtn');
  if (backupBtn) {
    backupBtn.addEventListener('click', initiateBackup);
  }

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Form validation
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    const inputs = profileForm.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
    inputs.forEach(input => {
      input.addEventListener('blur', validateField);
      input.addEventListener('input', FieldErrorUtils.clearFieldError);
    });
  }
}

async function loadAdminProfile() {
  try {
    LoadingUtils.showPageLoading();
    
    const profile = await apiClient.getProfile();
    displayProfile(profile);
    
  } catch (error) {
    console.error('Admin profile loading error:', error);
    showError('حدث خطأ في تحميل الملف الشخصي');
  } finally {
    LoadingUtils.hidePageLoading();
  }
}

function displayProfile(profile) {
  // Display basic info
  const elements = {
    adminName: document.getElementById('adminName'),
    adminEmail: document.getElementById('adminEmail'),
    adminRole: document.getElementById('adminRole'),
    employeeId: document.getElementById('employeeId'),
    department: document.getElementById('department'),
    position: document.getElementById('position'),
    phone: document.getElementById('phone'),
    joinDate: document.getElementById('joinDate'),
    lastLogin: document.getElementById('lastLogin'),
    totalLogins: document.getElementById('totalLogins'),
    // Excel data fields
    nationalId: document.getElementById('nationalId'),
    employeeNumber: document.getElementById('employeeNumber'),
    nationality: document.getElementById('nationality'),
    jobTitle: document.getElementById('jobTitle'),
    employmentType: document.getElementById('employmentType')
  };

  if (elements.adminName) elements.adminName.textContent = profile.full_name_ar || profile.name || 'غير محدد';
  if (elements.adminEmail) elements.adminEmail.textContent = profile.email || 'غير محدد';
  if (elements.adminRole) elements.adminRole.textContent = getRoleDisplayName(profile.role);
  if (elements.employeeId) elements.employeeId.textContent = profile.employee_id || 'غير محدد';
  
  // Excel data from App_Users (prioritize App_Users data over Employees table)
  if (elements.nationalId) elements.nationalId.textContent = profile.app_users_national_id || profile.national_id || 'غير محدد';
  if (elements.employeeNumber) elements.employeeNumber.textContent = profile.app_users_employee_number || profile.employee_number || 'غير محدد';
  if (elements.nationality) elements.nationality.textContent = profile.app_users_nationality || profile.nationality || 'غير محدد';
  if (elements.department) elements.department.textContent = profile.app_users_department_name || profile.department_name || 'غير محدد';
  if (elements.jobTitle) elements.jobTitle.textContent = profile.app_users_job_title || profile.job_title_name_ar || 'غير محدد';
  if (elements.position) elements.position.textContent = profile.position || profile.job_title || 'غير محدد';
  if (elements.phone) elements.phone.textContent = profile.app_users_phone || profile.phone_primary || 'غير محدد';
  if (elements.employmentType) {
    const empType = profile.app_users_employment_type || profile.contract_type || '—';
    const empTypeArabic = translateEmploymentType(empType);
    elements.employmentType.textContent = empTypeArabic;
  }
  
  if (elements.joinDate) elements.joinDate.textContent = DateUtils.formatDate(profile.created_at);
  if (elements.lastLogin) elements.lastLogin.textContent = DateUtils.formatDateTime(profile.last_login);
  if (elements.totalLogins && elements.totalLogins) elements.totalLogins.textContent = profile.login_count || '0';

  // Fill form inputs for editing
  const formElements = {
    nameInput: document.getElementById('nameInput'),
    emailInput: document.getElementById('emailInput'),
    phoneInput: document.getElementById('phoneInput')
  };

  if (formElements.nameInput) formElements.nameInput.value = profile.name || '';
  if (formElements.emailInput) formElements.emailInput.value = profile.email || '';
  if (formElements.phoneInput) formElements.phoneInput.value = profile.phone || '';

  // Store original data for cancel functionality
  window.originalProfileData = {
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phone || ''
  };

  // Update admin avatar
  updateAdminAvatar(profile.name);
}

function updateAdminAvatar(name) {
  const avatar = document.getElementById('adminAvatar');
  if (avatar && name) {
    const initials = name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
    avatar.textContent = initials;
  }
}

function getRoleDisplayName(role) {
  const roleNames = {
    admin: 'مدير النظام',
    hr: 'موارد بشرية',
    manager: 'مدير قسم',
    employee: 'موظف'
  };
  
  return roleNames[role] || role;
}

function translateEmploymentType(type) {
  if (!type || type === '—') return '—';
  
  const typeMap = {
    'permanent': 'دائم',
    'contract': 'عقد',
    'part_time': 'دوام جزئي',
    'temporary': 'مؤقت',
    'civil_service': 'خدمة مدنية',
    'self_employment': 'تشغيل ذاتي',
    'surplus_workforce': 'قوى زائدة',
    'locum': 'لوكم',
    'partial_assignment': 'تكليف جزئي'
  };
  
  return typeMap[type] || type;
}

async function loadSystemInfo() {
  try {
    // This would typically call an API endpoint for system information
    const systemInfo = await getSystemInfo();
    displaySystemInfo(systemInfo);
  } catch (error) {
    console.error('System info loading error:', error);
  }
}

async function getSystemInfo() {
  // Mock system info - replace with actual API call
  return {
    version: '1.0.0',
    uptime: '15 يوم',
    totalUsers: 156,
    activeUsers: 89,
    totalRequests: 1247,
    pendingRequests: 23,
    systemHealth: 'جيد',
    lastBackup: '2024-01-15 02:00:00'
  };
}

function displaySystemInfo(info) {
  const elements = {
    systemVersion: document.getElementById('systemVersion'),
    systemUptime: document.getElementById('systemUptime'),
    totalSystemUsers: document.getElementById('totalSystemUsers'),
    activeSystemUsers: document.getElementById('activeSystemUsers'),
    totalSystemRequests: document.getElementById('totalSystemRequests'),
    pendingSystemRequests: document.getElementById('pendingSystemRequests'),
    systemHealth: document.getElementById('systemHealth'),
    lastSystemBackup: document.getElementById('lastSystemBackup')
  };

  Object.keys(elements).forEach(key => {
    const element = elements[key];
    const infoKey = key.replace('system', '').replace('System', '').toLowerCase();
    if (element && info[infoKey] !== undefined) {
      element.textContent = info[infoKey];
    }
  });

  // Update health status color
  const healthElement = elements.systemHealth;
  if (healthElement) {
    const healthClass = getHealthStatusClass(info.systemHealth);
    healthElement.className = `health-status ${healthClass}`;
  }
}

function getHealthStatusClass(health) {
  switch (health) {
    case 'ممتاز': return 'health-excellent';
    case 'جيد': return 'health-good';
    case 'متوسط': return 'health-fair';
    case 'ضعيف': return 'health-poor';
    default: return 'health-unknown';
  }
}

function toggleEditMode() {
  const displayElements = document.querySelectorAll('.profile-display');
  const editElements = document.querySelectorAll('.profile-edit');
  const editBtn = document.getElementById('editProfileBtn');
  const actionButtons = document.getElementById('editActions');

  displayElements.forEach(el => el.style.display = 'none');
  editElements.forEach(el => el.style.display = 'block');
  
  if (editBtn) editBtn.style.display = 'none';
  if (actionButtons) actionButtons.style.display = 'flex';
}

function cancelEdit() {
  const displayElements = document.querySelectorAll('.profile-display');
  const editElements = document.querySelectorAll('.profile-edit');
  const editBtn = document.getElementById('editProfileBtn');
  const actionButtons = document.getElementById('editActions');

  displayElements.forEach(el => el.style.display = 'block');
  editElements.forEach(el => el.style.display = 'none');
  
  if (editBtn) editBtn.style.display = 'inline-flex';
  if (actionButtons) actionButtons.style.display = 'none';

  // Restore original values
  if (window.originalProfileData) {
    const nameInput = document.getElementById('nameInput');
    const emailInput = document.getElementById('emailInput');
    const phoneInput = document.getElementById('phoneInput');

    if (nameInput) nameInput.value = window.originalProfileData.name;
    if (emailInput) emailInput.value = window.originalProfileData.email;
    if (phoneInput) phoneInput.value = window.originalProfileData.phone;
  }

  // Clear any errors
  FieldErrorUtils.clearAllFieldErrors();
}

async function saveProfile() {
  if (!validateProfileForm()) {
    return;
  }

  const saveBtn = document.getElementById('saveProfileBtn');
  LoadingUtils.showLoading(saveBtn, 'جاري الحفظ...');

  try {
    const formData = {
      name: document.getElementById('nameInput').value.trim(),
      email: document.getElementById('emailInput').value.trim(),
      phone: document.getElementById('phoneInput').value.trim()
    };

    await apiClient.updateProfile(formData);
    
    showSuccess('تم تحديث الملف الشخصي بنجاح');
    
    // Update localStorage user data
    const currentUser = apiClient.getCurrentUser();
    if (currentUser) {
      currentUser.name = formData.name;
      currentUser.email = formData.email;
      localStorage.setItem('authUser', JSON.stringify(currentUser));
    }
    
    // Reload profile data
    await loadAdminProfile();
    
    // Exit edit mode
    cancelEdit();
    
  } catch (error) {
    console.error('Profile update error:', error);
    showError(error.message || 'حدث خطأ في تحديث الملف الشخصي');
  } finally {
    LoadingUtils.hideLoading(saveBtn, 'حفظ التغييرات');
  }
}

function validateProfileForm() {
  FieldErrorUtils.clearAllFieldErrors();
  
  let isValid = true;
  
  // Name validation
  const nameInput = document.getElementById('nameInput');
  if (!FormValidationUtils.isRequired(nameInput.value)) {
    FieldErrorUtils.showFieldError(nameInput, 'الاسم مطلوب');
    isValid = false;
  } else if (!FormValidationUtils.isValidTextLength(nameInput.value, 2, 100)) {
    FieldErrorUtils.showFieldError(nameInput, 'الاسم يجب أن يكون بين 2 و 100 حرف');
    isValid = false;
  }

  // Email validation
  const emailInput = document.getElementById('emailInput');
  if (!FormValidationUtils.isRequired(emailInput.value)) {
    FieldErrorUtils.showFieldError(emailInput, 'البريد الإلكتروني مطلوب');
    isValid = false;
  } else if (!FormValidationUtils.isValidEmail(emailInput.value.trim())) {
    FieldErrorUtils.showFieldError(emailInput, 'البريد الإلكتروني غير صحيح');
    isValid = false;
  }

  // Phone validation (optional)
  const phoneInput = document.getElementById('phoneInput');
  if (phoneInput.value.trim() && !FormValidationUtils.isValidPhone(phoneInput.value.trim())) {
    FieldErrorUtils.showFieldError(phoneInput, 'رقم الهاتف غير صحيح');
    isValid = false;
  }

  return isValid;
}

function validateField(e) {
  const field = e.target;
  const value = field.value.trim();
  
  FieldErrorUtils.clearFieldError(field);
  
  switch (field.id) {
    case 'nameInput':
      if (!FormValidationUtils.isRequired(value)) {
        FieldErrorUtils.showFieldError(field, 'الاسم مطلوب');
      } else if (!FormValidationUtils.isValidTextLength(value, 2, 100)) {
        FieldErrorUtils.showFieldError(field, 'الاسم يجب أن يكون بين 2 و 100 حرف');
      }
      break;
      
    case 'emailInput':
      if (!FormValidationUtils.isRequired(value)) {
        FieldErrorUtils.showFieldError(field, 'البريد الإلكتروني مطلوب');
      } else if (!FormValidationUtils.isValidEmail(value)) {
        FieldErrorUtils.showFieldError(field, 'البريد الإلكتروني غير صحيح');
      }
      break;
      
    case 'phoneInput':
      if (value && !FormValidationUtils.isValidPhone(value)) {
        FieldErrorUtils.showFieldError(field, 'رقم الهاتف غير صحيح');
      }
      break;
  }
}

function showChangePasswordModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>تغيير كلمة المرور</h3>
        <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="modal-body">
        <form id="changePasswordForm">
          <div class="form-group">
            <label for="currentPassword">كلمة المرور الحالية</label>
            <input type="password" id="currentPassword" class="input" required>
          </div>
          
          <div class="form-group">
            <label for="newPassword">كلمة المرور الجديدة</label>
            <input type="password" id="newPassword" class="input" required>
            <div class="password-strength" id="passwordStrength"></div>
          </div>
          
          <div class="form-group">
            <label for="confirmNewPassword">تأكيد كلمة المرور الجديدة</label>
            <input type="password" id="confirmNewPassword" class="input" required>
          </div>
          
          <div class="form-actions">
            <button type="submit" id="changePasswordSubmitBtn" class="btn btn-primary">
              تغيير كلمة المرور
            </button>
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Password strength indicator
  const newPasswordInput = modal.querySelector('#newPassword');
  newPasswordInput.addEventListener('input', updatePasswordStrength);
  
  // Handle form submission
  const form = modal.querySelector('#changePasswordForm');
  form.addEventListener('submit', handleChangePassword);
  
  // Close modal when clicking outside
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function updatePasswordStrength(e) {
  const password = e.target.value;
  const strengthElement = document.getElementById('passwordStrength');
  
  if (!strengthElement) return;
  
  const strength = calculatePasswordStrength(password);
  const strengthTexts = ['ضعيف جداً', 'ضعيف', 'متوسط', 'قوي', 'قوي جداً'];
  const strengthClasses = ['very-weak', 'weak', 'fair', 'good', 'strong'];
  
  strengthElement.textContent = `قوة كلمة المرور: ${strengthTexts[strength]}`;
  strengthElement.className = `password-strength ${strengthClasses[strength]}`;
}

function calculatePasswordStrength(password) {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  return Math.min(score, 4);
}

async function handleChangePassword(e) {
  e.preventDefault();
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;
  
  // Clear previous errors
  FieldErrorUtils.clearAllFieldErrors();
  
  // Validation
  let isValid = true;
  
  if (!currentPassword) {
    FieldErrorUtils.showFieldError(document.getElementById('currentPassword'), 'كلمة المرور الحالية مطلوبة');
    isValid = false;
  }
  
  if (!newPassword) {
    FieldErrorUtils.showFieldError(document.getElementById('newPassword'), 'كلمة المرور الجديدة مطلوبة');
    isValid = false;
  } else if (newPassword.length < 8) {
    FieldErrorUtils.showFieldError(document.getElementById('newPassword'), 'كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    isValid = false;
  }
  
  if (newPassword !== confirmNewPassword) {
    FieldErrorUtils.showFieldError(document.getElementById('confirmNewPassword'), 'كلمات المرور غير متطابقة');
    isValid = false;
  }
  
  if (!isValid) return;
  
  const submitBtn = document.getElementById('changePasswordSubmitBtn');
  LoadingUtils.showLoading(submitBtn, 'جاري التغيير...');
  
  try {
    await apiClient.makeRequest('/profile/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: currentPassword,
        newPassword: newPassword
      })
    });
    
    showSuccess('تم تغيير كلمة المرور بنجاح');
    document.querySelector('.modal-overlay').remove();
    
  } catch (error) {
    console.error('Password change error:', error);
    showError(error.message || 'حدث خطأ في تغيير كلمة المرور');
  } finally {
    LoadingUtils.hideLoading(submitBtn, 'تغيير كلمة المرور');
  }
}

function showAdminSettingsModal() {
  showInfo('إعدادات المدير ستكون متاحة قريباً');
}

function showSystemLogs() {
  showInfo('سجلات النظام ستكون متاحة قريباً');
}

async function initiateBackup() {
  if (!confirm('هل أنت متأكد من إجراء نسخ احتياطي للنظام؟ قد يستغرق هذا بعض الوقت.')) {
    return;
  }

  try {
    LoadingUtils.showPageLoading();
    
    // This would typically call a backup API endpoint
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate backup process
    
    showSuccess('تم إنشاء النسخة الاحتياطية بنجاح');
    
  } catch (error) {
    console.error('Backup error:', error);
    showError('حدث خطأ في إنشاء النسخة الاحتياطية');
  } finally {
    LoadingUtils.hidePageLoading();
  }
}

function handleLogout() {
  if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
    apiClient.logout();
    showSuccess('تم تسجيل الخروج بنجاح');
    setTimeout(() => {
      window.location.href = window.resolveFrontendPath('login.html');
    }, 1000);
  }
}

// Add admin profile-specific CSS
const adminProfileStyles = document.createElement('style');
adminProfileStyles.textContent = `
  .admin-profile-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .profile-header {
    background: linear-gradient(135deg, #2B6CB0, #60a5fa);
    color: white;
    border-radius: 12px;
    padding: 30px;
    margin-bottom: 30px;
    display: flex;
    align-items: center;
    gap: 30px;
  }
  
  .admin-avatar {
    width: 100px;
    height: 100px;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    font-weight: bold;
    border: 3px solid rgba(255,255,255,0.3);
  }
  
  .admin-info h1 {
    margin: 0 0 10px 0;
    font-size: 28px;
  }
  
  .admin-role {
    font-size: 18px;
    opacity: 0.9;
    margin-bottom: 5px;
  }
  
  .admin-stats {
    display: flex;
    gap: 30px;
    margin-top: 15px;
  }
  
  .admin-stat {
    text-align: center;
  }
  
  .admin-stat-number {
    font-size: 20px;
    font-weight: bold;
    display: block;
  }
  
  .admin-stat-label {
    font-size: 14px;
    opacity: 0.8;
  }
  
  .profile-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
  }
  
  .profile-section {
    background: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  .section-title {
    font-size: 20px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #e5e7eb;
  }
  
  .profile-field {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .profile-field:last-child {
    border-bottom: none;
  }
  
  .field-label {
    font-weight: 600;
    color: #374151;
  }
  
  .field-value {
    color: #6b7280;
  }
  
  .system-info {
    grid-column: 1 / -1;
  }
  
  .system-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }
  
  .system-stat-card {
    background: #f9fafb;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
  }
  
  .system-stat-number {
    font-size: 24px;
    font-weight: bold;
    color: #2B6CB0;
    margin-bottom: 5px;
  }
  
  .system-stat-label {
    color: #6b7280;
    font-size: 14px;
  }
  
  .health-status {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
  }
  
  .health-excellent { background: #d1fae5; color: #065f46; }
  .health-good { background: #dbeafe; color: #1e40af; }
  .health-fair { background: #fef3c7; color: #92400e; }
  .health-poor { background: #fee2e2; color: #991b1b; }
  .health-unknown { background: #f3f4f6; color: #374151; }
  
  .admin-actions {
    display: flex;
    gap: 15px;
    margin-top: 25px;
    flex-wrap: wrap;
  }
  
  .password-strength {
    font-size: 12px;
    margin-top: 5px;
    padding: 2px 0;
  }
  
  .password-strength.very-weak { color: #dc2626; }
  .password-strength.weak { color: #ea580c; }
  .password-strength.fair { color: #ca8a04; }
  .password-strength.good { color: #16a34a; }
  .password-strength.strong { color: #059669; }
  
  @media (max-width: 768px) {
    .profile-content {
      grid-template-columns: 1fr;
    }
    
    .profile-header {
      flex-direction: column;
      text-align: center;
      gap: 20px;
    }
    
    .admin-stats {
      justify-content: center;
    }
  }
`;
document.head.appendChild(adminProfileStyles);
