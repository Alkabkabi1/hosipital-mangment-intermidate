// Direct Request (Onboarding) Form JavaScript
// Handles onboarding/direct request form functionality

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  if (!requireAuth()) return;

  // Auto-fill from full profile data
  loadAndFillProfileData();

  // Initialize form
  initializeForm();
  setupEventListeners();
  loadDepartments();
});

// Function to load and fill profile data automatically
async function loadAndFillProfileData() {
  try {
    const profile = await window.apiClient.getProfile();
    
    console.log('📋 Auto-filling onboarding form with profile data:', profile);
    
    // Container 1: Basic Info - fill from App_Users Excel data
    const firstNameField = document.getElementById('firstName');
    const secondNameField = document.getElementById('secondName');
    const thirdNameField = document.getElementById('thirdName');
    
    if (profile.first_name_ar) {
      if (firstNameField) firstNameField.value = profile.first_name_ar;
      if (secondNameField) secondNameField.value = profile.second_name_ar || '';
      if (thirdNameField) thirdNameField.value = profile.third_name_ar || '';
    } else if (profile.full_name_ar) {
      const nameParts = profile.full_name_ar.split(' ');
      if (firstNameField) firstNameField.value = nameParts[0] || '';
      if (secondNameField) secondNameField.value = nameParts[1] || '';
      if (thirdNameField) thirdNameField.value = nameParts[2] || '';
    } else if (profile.name) {
      const nameParts = profile.name.split(' ');
      if (firstNameField) firstNameField.value = nameParts[0] || '';
      if (secondNameField) secondNameField.value = nameParts[1] || '';
      if (thirdNameField) thirdNameField.value = nameParts[2] || '';
    }
    
    // Job title from App_Users Excel data
    const jobTitleField = document.getElementById('jobTitle');
    if (jobTitleField && (profile.app_users_job_title || profile.job_title_name_ar || profile.position)) {
      jobTitleField.value = profile.app_users_job_title || profile.job_title_name_ar || profile.position;
    }
    
    // Work ID from App_Users Excel data
    const workIdField = document.getElementById('workId');
    if (workIdField && (profile.app_users_employee_number || profile.employee_number)) {
      workIdField.value = profile.app_users_employee_number || profile.employee_number;
    }
    
    // Nationality from App_Users Excel data
    const nationalityField = document.getElementById('nationality');
    if (nationalityField && (profile.app_users_nationality || profile.nationality)) {
      nationalityField.value = profile.app_users_nationality || profile.nationality;
    }
    
    // Container 3: Fourth degree name
    const fourthNameField = document.getElementById('fourthName');
    const fatherNameField = document.getElementById('fatherName');
    const grandpaNameField = document.getElementById('grandpaName');
    const familyNameField = document.getElementById('familyName');
    
    if (profile.first_name_ar) {
      if (fourthNameField) fourthNameField.value = profile.first_name_ar;
      if (fatherNameField) fatherNameField.value = profile.second_name_ar || '';
      if (grandpaNameField) grandpaNameField.value = profile.third_name_ar || '';
      if (familyNameField) familyNameField.value = profile.family_name_ar || '';
    } else if (profile.full_name_ar) {
      const nameParts = profile.full_name_ar.split(' ');
      if (fourthNameField) fourthNameField.value = nameParts[0] || '';
      if (fatherNameField) fatherNameField.value = nameParts[1] || '';
      if (grandpaNameField) grandpaNameField.value = nameParts[2] || '';
      if (familyNameField) familyNameField.value = nameParts.slice(3).join(' ') || '';
    }
    
    // Employee number (National ID/Residence)
    const employeeNumberField = document.getElementById('employeeNumber');
    if (employeeNumberField && (profile.app_users_national_id || profile.national_id)) {
      employeeNumberField.value = profile.app_users_national_id || profile.national_id;
    }
    
    // Department (select by value)
    const departmentField = document.getElementById('department');
    if (departmentField && (profile.app_users_department_name || profile.department_name)) {
      // Wait for departments to load then select
      setTimeout(() => {
        const departmentName = profile.app_users_department_name || profile.department_name;
        const option = Array.from(departmentField.options).find(opt => 
          opt.textContent.includes(departmentName) || opt.value === departmentName
        );
        if (option) {
          departmentField.value = option.value;
        }
      }, 500);
    }
    
    // Gender
    const genderField = document.getElementById('gender');
    if (genderField && profile.gender) {
      genderField.value = profile.gender === 'male' ? 'male' : profile.gender === 'female' ? 'female' : '';
    }
    
    // Birth date
    const birthDateField = document.getElementById('birthDate');
    if (birthDateField && profile.birth_date) {
      const birthDate = new Date(profile.birth_date);
      if (!isNaN(birthDate.getTime())) {
        birthDateField.value = birthDate.toISOString().split('T')[0];
      }
    }
    
    // Employment type
    const employmentTypeField = document.getElementById('employmentType');
    if (employmentTypeField && (profile.app_users_employment_type || profile.contract_type)) {
      const empType = profile.app_users_employment_type || profile.contract_type;
      // Map to form values
      if (empType === 'permanent' || empType.includes('مدني')) {
        employmentTypeField.value = 'civil_service';
      } else if (empType === 'contract' || empType.includes('عقد')) {
        employmentTypeField.value = 'self_employment';
      } else if (empType.includes('جزئي')) {
        employmentTypeField.value = 'partial_assignment';
      }
    }
    
  } catch (error) {
    console.error('Error loading profile data for auto-fill:', error);
    // Fallback to basic authUser data
    const emailField = document.getElementById('empEmail');
    const phoneField = document.getElementById('empMobile');
    
    if (emailField && authUser.email) {
      emailField.value = authUser.email;
      emailField.readOnly = true;
      emailField.style.backgroundColor = '#f5f5f5';
      emailField.style.cursor = 'not-allowed';
    }
    
    if (phoneField && authUser.phone) {
      phoneField.value = authUser.phone;
      phoneField.readOnly = true;
      phoneField.style.backgroundColor = '#f5f5f5';
      phoneField.style.cursor = 'not-allowed';
    }
  }
}

function initializeForm() {
  // Set application date as today
  const applicationDateInput = document.getElementById('applicationDate');
  if (applicationDateInput) {
    applicationDateInput.value = new Date().toISOString().split('T')[0];
  }

  // Set start date as next week
  const startDateInput = document.getElementById('startDate');
  if (startDateInput) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    startDateInput.value = futureDate.toISOString().split('T')[0];
  }
}

function setupEventListeners() {
  const form = document.getElementById('directRequestForm');
  const submitBtn = document.getElementById('btnSubmit');
  
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  } else if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleFormSubmit(e);
    });
  }

  // Real-time validation
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    input.addEventListener('blur', validateField);
    input.addEventListener('input', clearFieldError);
  });

  // Date validation
  const applicationDateInput = document.getElementById('applicationDate');
  const startDateInput = document.getElementById('startDate');
  
  if (applicationDateInput && startDateInput) {
    applicationDateInput.addEventListener('change', validateDates);
    startDateInput.addEventListener('change', validateDates);
  }
}

async function loadDepartments() {
  const departmentSelect = document.getElementById('department');
  if (!departmentSelect) return;

  try {
    // Try employee endpoint first (uses App_Users.department_name) - accessible to all authenticated users
    if (window.apiClient && typeof window.apiClient.getDepartments === 'function') {
      try {
        const deptResponse = await window.apiClient.getDepartments();
        let departments = [];
        
        // Handle response format (could be { success: true, data: [...] } or direct array)
        if (deptResponse && deptResponse.success && Array.isArray(deptResponse.data)) {
          departments = deptResponse.data;
        } else if (deptResponse && Array.isArray(deptResponse)) {
          departments = deptResponse;
        }
        
        if (departments.length > 0) {
          departmentSelect.innerHTML = '<option value="">اختر القسم</option>' +
            departments.map(dept => `<option value="${dept.name_ar || dept.name}">${dept.name_ar || dept.name}</option>`).join('');
          console.log('✅ Loaded', departments.length, 'departments from App_Users table');
          return;
        }
      } catch (employeeError) {
        console.log('⚠️ Employee departments endpoint failed, trying admin endpoint:', employeeError.message);
        // Fall through to try admin endpoint
      }
    }
    
    // Fallback: Try admin endpoint (for users with admin permissions)
    if (window.apiClient && typeof window.apiClient.getAllDepartmentsAdmin === 'function') {
      try {
      const departments = await window.apiClient.getAllDepartmentsAdmin();
        if (departments && Array.isArray(departments) && departments.length > 0) {
        departmentSelect.innerHTML = '<option value="">اختر القسم</option>' +
          departments.map(dept => `<option value="${dept.department_id || dept.id}">${dept.name_ar || dept.name}</option>`).join('');
          console.log('✅ Loaded', departments.length, 'departments from admin endpoint');
        return;
        }
      } catch (adminError) {
        // Admin endpoint failed, will fall through to mock data
        console.log('⚠️ Admin departments endpoint also failed, using mock data');
      }
    }
    
    // Fallback to mock data if API fails
    const departments = await getMockDepartments();
    departmentSelect.innerHTML = '<option value="">اختر القسم</option>' +
      departments.map(dept => `<option value="${dept.id}">${dept.name_ar}</option>`).join('');
      
  } catch (error) {
    console.error('Error loading departments:', error);
    // Fallback to mock data
    const departments = await getMockDepartments();
    departmentSelect.innerHTML = '<option value="">اختر القسم</option>' +
      departments.map(dept => `<option value="${dept.id}">${dept.name_ar}</option>`).join('');
    
    // Only show error if it's not a permission issue (403)
    const isPermissionError = error.message && (error.message.includes('Forbidden') || error.message.includes('403'));
    if (!isPermissionError && window.handleApiError) {
      window.handleApiError(error, 'تحميل الأقسام');
    } else {
      console.warn('Could not load departments from API, using mock data');
    }
  }
}

function getMockDepartments() {
  return Promise.resolve([
    { id: 1, name_ar: 'تقنية المعلومات', name_en: 'IT' },
    { id: 2, name_ar: 'الموارد البشرية', name_en: 'HR' },
    { id: 3, name_ar: 'المالية', name_en: 'Finance' },
    { id: 4, name_ar: 'التسويق', name_en: 'Marketing' },
    { id: 5, name_ar: 'العمليات', name_en: 'Operations' },
    { id: 6, name_ar: 'الشؤون الطبية', name_en: 'Medical Affairs' },
    { id: 7, name_ar: 'التمريض', name_en: 'Nursing' },
    { id: 8, name_ar: 'الصيدلية', name_en: 'Pharmacy' }
  ]);
}

async function handleFormSubmit(e) {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  const formData = collectFormData();
  const submitBtn = document.getElementById('btnSubmit');
  
  showLoading(submitBtn, 'جاري إرسال الطلب...');
  
  try {
    const response = await apiClient.createOnboarding(formData);
    
    showSuccess('تم إرسال طلب المباشرة بنجاح!');
    
    // Clear form and redirect after delay
    setTimeout(() => {
      window.location.href = window.resolveFrontendPath('employee-dashboard.html');
    }, 2000);
    
  } catch (error) {
    console.error('Direct request submission error:', error);
    if (window.handleApiError) {
      window.handleApiError(error, 'إرسال طلب المباشرة');
    } else {
      showError(error.message || 'حدث خطأ في إرسال الطلب');
    }
  } finally {
    hideLoading(submitBtn, 'إرسال الطلب');
  }
}

function validateForm() {
  clearAllFieldErrors();
  
  let isValid = true;
  
  // Validate required fields
  const requiredFields = [
    { id: 'firstName', message: 'الاسم الأول مطلوب' },
    { id: 'secondName', message: 'الاسم الثاني مطلوب' },
    { id: 'thirdName', message: 'الاسم الثالث مطلوب' },
    { id: 'jobTitle', message: 'المسمى الوظيفي مطلوب' },
    { id: 'workId', message: 'الرقم الوظيفي مطلوب' },
    { id: 'reasonForJob', message: 'سبب إعطاء الوظيفة مطلوب' },
    { id: 'documentNumber', message: 'رقم المستند مطلوب' },
    { id: 'applicationDate', message: 'تاريخ الطلب مطلوب' },
    { id: 'startDate', message: 'تاريخ المباشرة مطلوب' },
    { id: 'fourthName', message: 'الاسم مطلوب' },
    { id: 'fatherName', message: 'اسم الأب مطلوب' },
    { id: 'grandpaName', message: 'اسم الجد مطلوب' },
    { id: 'familyName', message: 'اسم العائلة مطلوب' },
    { id: 'transactionNumber', message: 'رقم المعاملة مطلوب' },
    { id: 'transactionDate', message: 'تاريخ المعاملة مطلوب' },
    { id: 'employeeStatus', message: 'حالة الموظف مطلوبة' },
    { id: 'employeeNumber', message: 'رقم الهوية/الإقامة مطلوب' },
    { id: 'department', message: 'القسم مطلوب' },
    { id: 'birthDate', message: 'تاريخ الميلاد مطلوب' },
    { id: 'appointmentDate', message: 'تاريخ التعيين مطلوب' },
    { id: 'employmentType', message: 'نوع التوظيف مطلوب' },
    { id: 'nationality', message: 'الجنسية مطلوبة' },
    { id: 'gender', message: 'الجنس مطلوب' },
    { id: 'onboardingReason', message: 'سبب المباشرة مطلوب' }
  ];

  requiredFields.forEach(field => {
    const element = document.getElementById(field.id);
    if (!element || !element.value.trim()) {
      showFieldError(element, field.message);
      isValid = false;
    }
  });

  // Validate dates
  const applicationDate = document.getElementById('applicationDate');
  const startDate = document.getElementById('startDate');
  const birthDate = document.getElementById('birthDate');
  const appointmentDate = document.getElementById('appointmentDate');
  const transactionDate = document.getElementById('transactionDate');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Validate startDate is after applicationDate
  if (applicationDate && startDate && applicationDate.value && startDate.value) {
    const appDate = new Date(applicationDate.value);
    const start = new Date(startDate.value);
    
    if (start <= appDate) {
      showFieldError(startDate, 'تاريخ المباشرة يجب أن يكون بعد تاريخ الطلب');
      isValid = false;
    }
    
    // Start date should not be too far in the future (e.g., 1 year)
    const maxStartDate = new Date(today);
    maxStartDate.setFullYear(maxStartDate.getFullYear() + 1);
    if (start > maxStartDate) {
      showFieldError(startDate, 'تاريخ المباشرة لا يمكن أن يكون بعد سنة من الآن');
      isValid = false;
    }
  }

  // Validate birthDate is in the past
  if (birthDate && birthDate.value) {
    const birth = new Date(birthDate.value);
    if (birth >= today) {
      showFieldError(birthDate, 'تاريخ الميلاد يجب أن يكون في الماضي');
      isValid = false;
    }
    
    // Birth date should be reasonable (not more than 100 years ago)
    const minBirthDate = new Date(today);
    minBirthDate.setFullYear(minBirthDate.getFullYear() - 100);
    if (birth < minBirthDate) {
      showFieldError(birthDate, 'تاريخ الميلاد غير صحيح');
      isValid = false;
    }
  }

  // Validate appointmentDate - can be in past or future, but must be before startDate
  if (appointmentDate && appointmentDate.value) {
    const appointment = new Date(appointmentDate.value);
    
    // Appointment date should be before start date
    if (startDate && startDate.value) {
      const start = new Date(startDate.value);
      if (appointment > start) {
        showFieldError(appointmentDate, 'تاريخ التعيين يجب أن يكون قبل أو يساوي تاريخ المباشرة');
        isValid = false;
      }
    }
    
    // Appointment date should be reasonable (not more than 50 years ago)
    const minAppointmentDate = new Date(today);
    minAppointmentDate.setFullYear(minAppointmentDate.getFullYear() - 50);
    if (appointment < minAppointmentDate) {
      showFieldError(appointmentDate, 'تاريخ التعيين غير صحيح');
      isValid = false;
    }
  }

  // Validate transactionDate should be before or equal to applicationDate
  if (transactionDate && transactionDate.value && applicationDate && applicationDate.value) {
    const transDate = new Date(transactionDate.value);
    const appDate = new Date(applicationDate.value);
    
    if (transDate > appDate) {
      showFieldError(transactionDate, 'تاريخ المعاملة يجب أن يكون قبل أو يساوي تاريخ الطلب');
      isValid = false;
    }
  }

  return isValid;
}

function validateDates() {
  const applicationDate = document.getElementById('applicationDate');
  const startDate = document.getElementById('startDate');
  const transactionDate = document.getElementById('transactionDate');
  
  if (!applicationDate || !startDate) return true;
  
  const appDateValue = new Date(applicationDate.value);
  const startDateValue = new Date(startDate.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let isValid = true;

  // Start date should be after application date
  if (startDateValue <= appDateValue) {
    showFieldError(startDate, 'تاريخ المباشرة يجب أن يكون بعد تاريخ الطلب');
    isValid = false;
  }
  
  // Validate transaction date if provided
  if (transactionDate && transactionDate.value) {
    const transDateValue = new Date(transactionDate.value);
    if (transDateValue > appDateValue) {
      showFieldError(transactionDate, 'تاريخ المعاملة يجب أن يكون قبل أو يساوي تاريخ الطلب');
      isValid = false;
    }
  }

  return isValid;
}

function validateField(e) {
  const field = e.target;
  const value = field.value.trim();
  
  // Clear previous error
  clearFieldError(field);
  
  // Field-specific validation
  switch (field.id) {
    case 'workId':
    case 'employeeNumber':
    case 'documentNumber':
    case 'transactionNumber':
      if (value && value.length < 3) {
        showFieldError(field, 'يجب أن يكون الرقم 3 أحرف على الأقل');
      }
      break;
  }
}

function collectFormData() {
  // Helper to get value or undefined (not empty string) for optional fields
  const getValue = (id, trim = true) => {
    const el = document.getElementById(id);
    if (!el) return undefined;
    const val = trim ? el.value.trim() : el.value;
    return val || undefined;
  };
  
  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  
  return {
    // Container 1: Basic Info (all required)
    firstName: getValue('firstName') || '',
    secondName: getValue('secondName') || '',
    thirdName: getValue('thirdName') || '',
    jobTitle: getValue('jobTitle') || '',
    workId: getValue('workId') || '',
    nationality: getValue('nationality') || '',
    reasonForJob: getValue('reasonForJob') || '',

    // Container 2: Document & Dates (all required)
    documentNumber: getValue('documentNumber') || '',
    applicationDate: getValue('applicationDate', false) || '',
    startDate: getValue('startDate', false) || '',

    // Container 3: Details
    // Fourth degree name (all required)
    fourthName: getValue('fourthName') || '',
    fatherName: getValue('fatherName') || '',
    grandpaName: getValue('grandpaName') || '',
    familyName: getValue('familyName') || '',
    
    // Transaction (required)
    transactionNumber: getValue('transactionNumber') || '',
    transactionDate: getValue('transactionDate', false) || '',
    
    // Employee info
    employeeStatus: getValue('employeeStatus') || '',
    employeeNumber: getValue('employeeNumber') || '',
    department: getValue('department') || '',
    group: getValue('group'), // Optional
    rank: getValue('rank'), // Optional
    
    // Dates (required)
    birthDate: getValue('birthDate', false) || '',
    appointmentDate: getValue('appointmentDate', false) || '',
    
    // Employment details (all required)
    employmentType: getValue('employmentType') || '',
    gender: getValue('gender') || '',
    onboardingReason: getValue('onboardingReason') || '',

    // Additional fields for backend compatibility
    requestDate: getValue('applicationDate', false) || new Date().toISOString().split('T')[0],
    email: authUser?.email || undefined, // Will be filled from auth user if available
    phone: getValue('phone') // Optional
  };
}

// Helper functions
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
  if (!field || !field.classList || !field.parentNode) {
    console.warn('⚠️ clearFieldError: Invalid field element:', field);
    return;
  }
  
  field.classList.remove('error');
  const errorDiv = field.parentNode.querySelector('.field-error');
  if (errorDiv && typeof errorDiv.remove === 'function') {
    errorDiv.remove();
  }
}

function clearAllFieldErrors() {
  const errorElements = document.querySelectorAll('.field-error');
  errorElements.forEach(error => error.remove());
  
  const errorFields = document.querySelectorAll('.error');
  errorFields.forEach(field => field.classList.remove('error'));
}

// Add direct request-specific CSS
const directRequestStyles = document.createElement('style');
directRequestStyles.textContent = `
  .field-error {
    color: #dc3545;
    font-size: 14px;
    margin-top: 5px;
    text-align: right;
    animation: fadeIn 0.3s ease-in;
  }
  
  .input.error,
  .select.error,
  .textarea.error {
    border-color: #dc3545 !important;
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
document.head.appendChild(directRequestStyles);

// Stage-E: Wrap onboarding create to auto-queue on failure with banner
(function(){
  if (!window.apiClient || window.apiClient.__onbWrapped) return;
  const orig = window.apiClient.createOnboarding?.bind(window.apiClient);
  if (!orig) return;
  window.apiClient.__onbWrapped = true;
  window.apiClient.createOnboarding = async function(data){
    try {
      return await orig(data);
    } catch (error) {
      try {
        const key = 'requestsOnboarding';
        const optimisticId = 'onb_' + Date.now();
        const user = JSON.parse(localStorage.getItem('authUser')||'null');
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        list.unshift({ id: optimisticId, optimisticId, ...data, status: 'قيد الاعتماد', createdAt: new Date().toISOString(), createdBy: user?.email || null, syncing: true, syncFailed: false });
        localStorage.setItem(key, JSON.stringify(list));
        if (window.renderSyncBanner) {
          window.renderSyncBanner('sync-banner', 'تم حفظ الطلب وسيتم إرساله عند توفر الاتصال… ⏳', { tone: 'info' });
        }
        if (window.scheduleSync) {
          window.scheduleSync({ type: 'create', endpoint: '/onboarding', method: 'POST', data, key, optimisticId });
        }
        const onFailed = (ev) => {
          const d = ev && ev.detail || {}; if (d.key !== key || String(d.optimisticId) !== String(optimisticId)) return;
          if (window.renderSyncBanner) {
            const retryBtn = `<button class=\"btn\" type=\"button\" onclick=\"window.retrySync && window.retrySync('${optimisticId}')\">إعادة المحاولة</button>`;
            window.renderSyncBanner('sync-banner', `تعذر الإرسال. اضغط للمحاولة مرة أخرى. ${retryBtn}`, { tone: 'warning' });
          }
        };
        const onUpdated = (ev) => {
          const d = ev && ev.detail || {}; if (d.key !== key) return;
          try {
            const cur = JSON.parse(localStorage.getItem(key) || '[]');
            const anySyncing = cur.some(x => x && x.syncing === true);
            if (!anySyncing) {
              window.hideSyncBanner && window.hideSyncBanner('sync-banner');
              window.showSuccess && window.showSuccess('تم الإرسال بنجاح ✅');
              window.removeEventListener('sync:updated', onUpdated);
              window.removeEventListener('sync:failed', onFailed);
            }
          } catch (_) {}
        };
        window.addEventListener('sync:failed', onFailed);
        window.addEventListener('sync:updated', onUpdated);
      } catch (_) {}
      throw error; // preserve original error for caller
    }
  };
})();
