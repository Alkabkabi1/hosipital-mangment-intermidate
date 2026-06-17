// Clearance Request Form JavaScript
// Handles clearance request form functionality

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  if (!requireAuth()) return;

  // Initialize form
  initializeForm();
  setupEventListeners();
  loadFormData();
});

function initializeForm() {
  // Set current date as default for last work day
  const lastWorkDayInput = document.getElementById('lastWorkDay');
  if (lastWorkDayInput) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    lastWorkDayInput.value = futureDate.toISOString().split('T')[0];
  }
}

function setupEventListeners() {
  const submitBtn = document.getElementById('btnSubmit');
  
  if (submitBtn) {
    submitBtn.addEventListener('click', handleFormSubmit);
  }

  // Real-time validation
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    input.addEventListener('blur', validateField);
    input.addEventListener('input', clearFieldError);
  });
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
    const response = await apiClient.createClearance(formData);
    
    showSuccess('تم إرسال طلب الإخلاء بنجاح!');
    
    // Clear form and redirect after delay
    setTimeout(() => {
      window.location.href = window.resolveFrontendPath('employee-dashboard.html');
    }, 2000);
    
  } catch (error) {
    console.error('Clearance submission error:', error);
    if (window.handleApiError) {
      window.handleApiError(error, 'إرسال طلب الإخلاء');
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
  const requiredFields = [
    { id: 'empName', message: 'الاسم الكامل مطلوب' },
    { id: 'empEmail', message: 'البريد الإلكتروني مطلوب' },
    { id: 'clearReason', message: 'سبب الطلب مطلوب' },
    { id: 'lastWorkDay', message: 'آخر يوم عمل متوقع مطلوب' }
  ];

  // Validate required fields
  requiredFields.forEach(field => {
    const element = document.getElementById(field.id);
    if (!element || !element.value.trim()) {
      showFieldError(element, field.message);
      isValid = false;
    }
  });

  // Validate email format
  const emailField = document.getElementById('empEmail');
  if (emailField && emailField.value.trim()) {
    if (!FormValidationUtils.isValidEmail(emailField.value.trim())) {
      showFieldError(emailField, 'البريد الإلكتروني غير صحيح');
      isValid = false;
    }
  }

  // Validate date
  const lastWorkDayField = document.getElementById('lastWorkDay');
  if (lastWorkDayField && lastWorkDayField.value) {
    if (FormValidationUtils.isDateInPast(lastWorkDayField.value)) {
      showFieldError(lastWorkDayField, 'تاريخ آخر يوم عمل يجب أن يكون في المستقبل');
      isValid = false;
    }
  }

  return isValid;
}

function collectFormData() {
  const user = apiClient.getCurrentUser();
  
  return {
    employee_id: user ? user.employee_id : null,
    employee_name: document.getElementById('empName')?.value || '',
    employee_number: document.getElementById('empJobNo')?.value || '',
    employee_email: document.getElementById('empEmail')?.value || '',
    department: document.getElementById('empDept')?.value || '',
    position: document.getElementById('empTitle')?.value || '',
    phone: document.getElementById('empMobile')?.value || '',
    reason: document.getElementById('clearReason')?.value || '',
    last_working_day: document.getElementById('lastWorkDay')?.value || '',
    handover_notes: document.getElementById('handoverNotes')?.value || '',
    attachments: getFileAttachments()
  };
}

function getFileAttachments() {
  const fileInput = document.getElementById('attachments');
  if (!fileInput || !fileInput.files.length) return [];
  
  const files = Array.from(fileInput.files);
  return files.map(file => ({
    name: file.name,
    size: file.size,
    type: file.type
  }));
}

function validateField(e) {
  const field = e.target;
  const value = field.value.trim();
  
  // Clear previous error
  clearFieldError(field);
  
  // Validate based on field type
  switch (field.id) {
    case 'empEmail':
      if (value && !FormValidationUtils.isValidEmail(value)) {
        showFieldError(field, 'البريد الإلكتروني غير صحيح');
      }
      break;
      
    case 'empMobile':
      if (value && !FormValidationUtils.isValidPhone(value)) {
        showFieldError(field, 'رقم الجوال غير صحيح');
      }
      break;
      
    case 'lastWorkDay':
      if (value && FormValidationUtils.isDateInPast(value)) {
        showFieldError(field, 'تاريخ آخر يوم عمل يجب أن يكون في المستقبل');
      }
      break;
  }
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

function loadFormData() {
  // Load user data if available
  const user = apiClient.getCurrentUser();
  if (user) {
    if (document.getElementById('empName')) {
      document.getElementById('empName').value = user.name || '';
    }
    if (document.getElementById('empEmail')) {
      document.getElementById('empEmail').value = user.email || '';
    }
  }
}

// Add form-specific CSS
const style = document.createElement('style');
style.textContent = `
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
document.head.appendChild(style);
