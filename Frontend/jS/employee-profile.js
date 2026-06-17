// Employee Profile JavaScript
// Handles employee profile functionality

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  if (!requireAuth()) return;

  // Initialize profile
  loadProfile();
  setupEventListeners();
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
      input.addEventListener('input', clearFieldError);
    });
  }
}

async function loadProfile() {
  try {
    showLoadingState();
    
    const profile = await apiClient.getProfile();
    displayProfile(profile);
    
  } catch (error) {
    console.error('Profile loading error:', error);
    showError('حدث خطأ في تحميل الملف الشخصي');
  } finally {
    hideLoadingState();
  }
}

function displayProfile(profile) {
  console.log('📋 Displaying enhanced profile data:', profile);
  
  // Display comprehensive employee information
  const elements = {
    // Personal Information
    fullNameAr: document.getElementById('fullNameAr'),
    fullNameEn: document.getElementById('fullNameEn'),
    employeeNumber: document.getElementById('employeeNumber'),
    nationalId: document.getElementById('nationalId'),
    nationality: document.getElementById('nationality'),
    gender: document.getElementById('gender'),
    birthDate: document.getElementById('birthDate'),
    hireDate: document.getElementById('hireDate'),
    
    // Job Information
    departmentName: document.getElementById('departmentName'),
    departmentCode: document.getElementById('departmentCode'),
    position: document.getElementById('position'),
    jobTitleName: document.getElementById('jobTitleName'),
    jobCategory: document.getElementById('jobCategory'),
    contractType: document.getElementById('contractType'),
    employmentStatus: document.getElementById('employmentStatus'),
    contractStartDate: document.getElementById('contractStartDate'),
    employmentType: document.getElementById('employmentType'),
    
    // Contact Information
    phonePrimary: document.getElementById('phonePrimary'),
    phoneSecondary: document.getElementById('phoneSecondary'),
    phoneAppUsers: document.getElementById('phoneAppUsers'),
    emailPersonal: document.getElementById('emailPersonal'),
    emailWork: document.getElementById('emailWork'),
    
    // Legacy elements (if they exist)
    userName: document.getElementById('userName'),
    userEmail: document.getElementById('userEmail'),
    userRole: document.getElementById('userRole'),
    employeeId: document.getElementById('employeeId'),
    department: document.getElementById('department'),
    phone: document.getElementById('phone'),
    joinDate: document.getElementById('joinDate')
  };

  // Update all fields with enhanced data
  // Use App_Users data first, then fallback to Employees table
  const arabicName = profile.full_name_ar || profile.name || '—';
  updateElement(elements.fullNameAr, arabicName);
  
  // Auto-translate Arabic name to English in real-time
  const englishName = profile.full_name_en || translateArabicToEnglish(arabicName);
  updateElement(elements.fullNameEn, englishName);
  
  updateElement(elements.employeeNumber, profile.app_users_employee_number || profile.employee_number || '—');
  updateElement(elements.nationalId, profile.app_users_national_id || profile.national_id || '—');
  updateElement(elements.nationality, profile.app_users_nationality || profile.nationality || '—');
  updateElement(elements.gender, profile.gender || '—');
  updateElement(elements.birthDate, formatDate(profile.birth_date));
  updateElement(elements.hireDate, formatDate(profile.hire_date));
  
  updateElement(elements.departmentName, profile.app_users_department_name || profile.department_name || '—');
  updateElement(elements.departmentCode, profile.department_code || '—');
  updateElement(elements.position, profile.position || '—');
  updateElement(elements.jobTitleName, profile.app_users_job_title || profile.job_title_name_ar || '—');
  updateElement(elements.jobCategory, profile.job_category || '—');
  updateElement(elements.contractType, profile.contract_type || '—');
  updateElement(elements.employmentStatus, profile.employment_status || '—');
  updateElement(elements.contractStartDate, formatDate(profile.contract_start_date));
  
  // Excel columns from App_Users - with logging for debugging
  console.log('📋 Excel data from profile:', {
    employment_type: profile.app_users_employment_type,
    phone: profile.app_users_phone,
    job_title: profile.app_users_job_title,
    elements_check: {
      employmentType: elements.employmentType ? 'found' : 'NOT FOUND',
      phoneAppUsers: elements.phoneAppUsers ? 'found' : 'NOT FOUND'
    }
  });
  
  // Employment type from Excel column I
  if (elements.employmentType) {
    const empTypeValue = profile.app_users_employment_type || profile.contract_type || '—';
    const empTypeArabic = translateEmploymentType(empTypeValue);
    console.log('✅ Setting employmentType to:', empTypeValue, '→', empTypeArabic);
    updateElement(elements.employmentType, empTypeArabic);
  } else {
    console.error('❌ employmentType element NOT FOUND in DOM!');
  }
  
  updateElement(elements.phonePrimary, profile.phone_primary || profile.app_users_phone || '—');
  updateElement(elements.phoneSecondary, profile.phone_secondary || '—');
  
  // Phone from Excel column G
  if (elements.phoneAppUsers) {
    const phoneValue = profile.app_users_phone || profile.phone_primary || '—';
    console.log('✅ Setting phoneAppUsers to:', phoneValue);
    updateElement(elements.phoneAppUsers, phoneValue);
  } else {
    console.error('❌ phoneAppUsers element NOT FOUND in DOM!');
  }
  
  updateElement(elements.emailPersonal, profile.email || '—');
  updateElement(elements.emailWork, profile.email_work || '—');

  // Legacy compatibility
  updateElement(elements.userName, profile.full_name_ar || profile.name);
  updateElement(elements.userEmail, profile.email);
  updateElement(elements.userRole, getRoleDisplayName(profile.role));
  updateElement(elements.employeeId, profile.employee_id);
  updateElement(elements.department, profile.app_users_department_name || profile.department_name);
  updateElement(elements.position, profile.app_users_job_title || profile.position);
  updateElement(elements.phone, profile.app_users_phone || profile.phone_primary);
  updateElement(elements.joinDate, formatDate(profile.created_at));
  
  // Update chips with Excel data
  const chipDept = document.getElementById('chipDept');
  const chipTitle = document.getElementById('chipTitle');
  if (chipDept) chipDept.textContent = (profile.app_users_department_name || profile.department_name || '—').substring(0, 30);
  if (chipTitle) chipTitle.textContent = (profile.app_users_job_title || profile.position || '—').substring(0, 30);

  // Fill form inputs for editing (if they exist)
  const formElements = {
    nameInput: document.getElementById('nameInput'),
    emailInput: document.getElementById('emailInput'),
    phoneInput: document.getElementById('phoneInput')
  };

  if (formElements.nameInput) formElements.nameInput.value = profile.name || '';
  if (formElements.emailInput) formElements.emailInput.value = profile.email || '';
  if (formElements.phoneInput) formElements.phoneInput.value = profile.phone_primary || '';

  // Store original data for cancel functionality
  window.originalProfileData = {
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phone_primary || ''
  };
}

function updateElement(element, value) {
  if (element) {
    element.textContent = value || 'غير محدد';
  }
}

// Translate Arabic name to English in real-time
function translateArabicToEnglish(arabicName) {
  if (!arabicName || arabicName === '—' || arabicName === 'غير محدد') {
    return '—';
  }
  
  // Arabic to English letter mapping (transliteration)
  const transliterationMap = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'a',
    'ب': 'b', 'ت': 't', 'ث': 'th',
    'ج': 'j', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd',
    'ط': 't', 'ظ': 'dh', 'ع': 'a', 'غ': 'gh',
    'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l',
    'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w',
    'ي': 'y', 'ى': 'a', 'ة': 'h', 'ء': 'a',
    ' ': ' '
  };
  
  let result = '';
  for (let i = 0; i < arabicName.length; i++) {
    const char = arabicName[i];
    result += transliterationMap[char] || char;
  }
  
  // Capitalize first letter of each word
  return result.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function getRoleDisplayName(role) {
  const roleNames = {
    employee: 'موظف',
    admin: 'مدير',
    hr: 'موارد بشرية',
    manager: 'مدير قسم'
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

function formatDate(dateString) {
  if (!dateString) return 'غير محدد';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Function to translate Arabic name to English in real-time
function translateArabicNameToEnglish(arabicName) {
  if (!arabicName || arabicName === '—' || arabicName === 'غير محدد') {
    return '—';
  }
  
  // Transliteration map for Arabic to English
  const transliterationMap = {
    'ا': 'A', 'أ': 'A', 'إ': 'I', 'آ': 'A',
    'ب': 'B',
    'ت': 'T',
    'ث': 'TH',
    'ج': 'J',
    'ح': 'H',
    'خ': 'KH',
    'د': 'D',
    'ذ': 'TH',
    'ر': 'R',
    'ز': 'Z',
    'س': 'S',
    'ش': 'SH',
    'ص': 'S',
    'ض': 'D',
    'ط': 'T',
    'ظ': 'Z',
    'ع': 'A',
    'غ': 'GH',
    'ف': 'F',
    'ق': 'Q',
    'ك': 'K',
    'ل': 'L',
    'م': 'M',
    'ن': 'N',
    'ه': 'H',
    'و': 'W',
    'ي': 'Y',
    'ى': 'A',
    'ة': 'H',
    'ء': 'A'
  };
  
  let result = '';
  for (let i = 0; i < arabicName.length; i++) {
    const char = arabicName[i];
    if (char === ' ') {
      result += ' ';
    } else if (transliterationMap[char]) {
      result += transliterationMap[char];
    } else if (/[A-Za-z0-9]/.test(char)) {
      // Keep English letters and numbers as is
      result += char.toUpperCase();
    }
  }
  
  // Capitalize first letter of each word
  return result
    .split(' ')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
    .trim() || '—';
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
  clearAllFieldErrors();
}

async function saveProfile() {
  if (!validateProfileForm()) {
    return;
  }

  const saveBtn = document.getElementById('saveProfileBtn');
  showLoading(saveBtn, 'جاري الحفظ...');

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
    await loadProfile();
    
    // Exit edit mode
    cancelEdit();
    
  } catch (error) {
    console.error('Profile update error:', error);
    showError(error.message || 'حدث خطأ في تحديث الملف الشخصي');
  } finally {
    hideLoading(saveBtn, 'حفظ التغييرات');
  }
}

function validateProfileForm() {
  clearAllFieldErrors();
  
  let isValid = true;
  
  // Name validation
  const nameInput = document.getElementById('nameInput');
  if (!nameInput.value.trim()) {
    showFieldError(nameInput, 'الاسم مطلوب');
    isValid = false;
  } else if (nameInput.value.trim().length < 2) {
    showFieldError(nameInput, 'الاسم يجب أن يكون حرفين على الأقل');
    isValid = false;
  }

  // Email validation
  const emailInput = document.getElementById('emailInput');
  if (!emailInput.value.trim()) {
    showFieldError(emailInput, 'البريد الإلكتروني مطلوب');
    isValid = false;
  } else if (!isValidEmail(emailInput.value.trim())) {
    showFieldError(emailInput, 'البريد الإلكتروني غير صحيح');
    isValid = false;
  }

  // Phone validation (optional)
  const phoneInput = document.getElementById('phoneInput');
  if (phoneInput.value.trim() && !isValidPhone(phoneInput.value.trim())) {
    showFieldError(phoneInput, 'رقم الهاتف غير صحيح');
    isValid = false;
  }

  return isValid;
}

function validateField(e) {
  const field = e.target;
  const value = field.value.trim();
  
  clearFieldError(field);
  
  switch (field.id) {
    case 'nameInput':
      if (!value) {
        showFieldError(field, 'الاسم مطلوب');
      } else if (value.length < 2) {
        showFieldError(field, 'الاسم يجب أن يكون حرفين على الأقل');
      }
      break;
      
    case 'emailInput':
      if (!value) {
        showFieldError(field, 'البريد الإلكتروني مطلوب');
      } else if (!isValidEmail(value)) {
        showFieldError(field, 'البريد الإلكتروني غير صحيح');
      }
      break;
      
    case 'phoneInput':
      if (value && !isValidPhone(value)) {
        showFieldError(field, 'رقم الهاتف غير صحيح');
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

async function handleChangePassword(e) {
  e.preventDefault();
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;
  
  // Clear previous errors
  clearAllFieldErrors();
  
  // Validation
  let isValid = true;
  
  if (!currentPassword) {
    showFieldError(document.getElementById('currentPassword'), 'كلمة المرور الحالية مطلوبة');
    isValid = false;
  }
  
  if (!newPassword) {
    showFieldError(document.getElementById('newPassword'), 'كلمة المرور الجديدة مطلوبة');
    isValid = false;
  } else if (newPassword.length < 6) {
    showFieldError(document.getElementById('newPassword'), 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    isValid = false;
  }
  
  if (newPassword !== confirmNewPassword) {
    showFieldError(document.getElementById('confirmNewPassword'), 'كلمات المرور غير متطابقة');
    isValid = false;
  }
  
  if (!isValid) return;
  
  const submitBtn = document.getElementById('changePasswordSubmitBtn');
  showLoading(submitBtn, 'جاري التغيير...');
  
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
    hideLoading(submitBtn, 'تغيير كلمة المرور');
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

// Utility functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

function showFieldError(field, message) {
  if (!field) return;
  
  clearFieldError(field);
  
  field.classList.add('error');
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.textContent = message;
  
  field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
  if (!field) return;
  
  field.classList.remove('error');
  const errorDiv = field.parentNode.querySelector('.field-error');
  if (errorDiv) {
    errorDiv.remove();
  }
}

function clearAllFieldErrors() {
  const errorElements = document.querySelectorAll('.field-error');
  errorElements.forEach(error => error.remove());
  
  const errorFields = document.querySelectorAll('.error');
  errorFields.forEach(field => field.classList.remove('error'));
}

function showLoadingState() {
  const loadingElements = document.querySelectorAll('.loading-placeholder');
  loadingElements.forEach(element => {
    element.style.display = 'block';
  });
  
  const contentElements = document.querySelectorAll('.profile-content');
  contentElements.forEach(element => {
    element.style.opacity = '0.5';
  });
}

function hideLoadingState() {
  const loadingElements = document.querySelectorAll('.loading-placeholder');
  loadingElements.forEach(element => {
    element.style.display = 'none';
  });
  
  const contentElements = document.querySelectorAll('.profile-content');
  contentElements.forEach(element => {
    element.style.opacity = '1';
  });
}

// Add profile-specific CSS
const style = document.createElement('style');
style.textContent = `
  .profile-edit {
    display: none;
  }
  
  #editActions {
    display: none;
    gap: 10px;
    margin-top: 20px;
  }
  
  .profile-card {
    background: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    margin-bottom: 20px;
  }
  
  .profile-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .profile-avatar {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #2B6CB0, #60a5fa);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 32px;
    font-weight: bold;
  }
  
  .profile-info h2 {
    margin: 0 0 5px 0;
    color: #374151;
  }
  
  .profile-info p {
    margin: 0;
    color: #6b7280;
  }
  
  .profile-fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }
  
  .field-group {
    display: flex;
    flex-direction: column;
  }
  
  .field-label {
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  }
  
  .field-value {
    color: #6b7280;
    padding: 10px;
    background: #f9fafb;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    border-radius: 12px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #6b7280;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .form-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }
  
  .btn-secondary {
    background: #6b7280;
    color: white;
  }
  
  .loading-placeholder {
    display: none;
    text-align: center;
    padding: 40px;
    color: #6b7280;
  }
  
  .field-error {
    color: #dc3545;
    font-size: 14px;
    margin-top: 5px;
    text-align: right;
    animation: fadeIn 0.3s ease-in;
  }
  
  .input.error {
    border-color: #dc3545 !important;
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);
