// Delegation Request Form JavaScript
// Handles delegation request form functionality

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  if (!requireAuth()) return;

  // Initialize form
  initializeForm();
  setupEventListeners();
  loadDelegationTypes();
});

function initializeForm() {
  // Set current date as default
  const requestDateInput = document.getElementById('requestDate');
  if (requestDateInput) {
    requestDateInput.value = new Date().toISOString().split('T')[0];
  }

  // Set default start date as tomorrow
  const startDateInput = document.getElementById('startDate');
  if (startDateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    startDateInput.value = tomorrow.toISOString().split('T')[0];
  }
}

function setupEventListeners() {
  const form = document.getElementById('delegationForm');
  const submitBtn = document.getElementById('submitBtn');
  const delegationTypeSelect = document.getElementById('delegationType');
  
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
  
  if (delegationTypeSelect) {
    delegationTypeSelect.addEventListener('change', handleDelegationTypeChange);
  }

  // Real-time validation
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    input.addEventListener('blur', validateField);
    input.addEventListener('input', clearFieldError);
  });

  // Date validation
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  if (startDateInput && endDateInput) {
    startDateInput.addEventListener('change', validateDates);
    endDateInput.addEventListener('change', validateDates);
  }

  // Employee search
  const employeeSearchInput = document.getElementById('employeeSearch');
  if (employeeSearchInput) {
    employeeSearchInput.addEventListener('input', debounce(searchEmployees, 300));
  }
}

function loadDelegationTypes() {
  const delegationTypeSelect = document.getElementById('delegationType');
  if (!delegationTypeSelect) return;

  const types = [
    { value: '', text: 'اختر نوع التفويض' },
    { value: 'authority', text: 'تفويض سلطة' },
    { value: 'responsibility', text: 'تفويض مسؤولية' },
    { value: 'signature', text: 'تفويض توقيع' },
    { value: 'approval', text: 'تفويض موافقة' },
    { value: 'other', text: 'أخرى' }
  ];

  delegationTypeSelect.innerHTML = types.map(type => 
    `<option value="${type.value}">${type.text}</option>`
  ).join('');
}

function handleDelegationTypeChange(e) {
  const selectedType = e.target.value;
  const customTypeContainer = document.getElementById('customTypeContainer');
  const scopeContainer = document.getElementById('scopeContainer');
  
  // Show/hide custom type input
  if (customTypeContainer) {
    customTypeContainer.style.display = selectedType === 'other' ? 'block' : 'none';
  }
  
  // Update scope description placeholder based on type
  const scopeTextarea = document.getElementById('scopeDescription');
  if (scopeTextarea) {
    const placeholders = {
      authority: 'حدد نطاق السلطة المفوضة (مثال: الموافقة على المشتريات حتى 10,000 ريال)',
      responsibility: 'حدد المسؤوليات المفوضة (مثال: إدارة فريق المبيعات، متابعة المشاريع)',
      signature: 'حدد نطاق التوقيع المفوض (مثال: توقيع العقود، الموافقة على الإجازات)',
      approval: 'حدد نطاق الموافقات المفوضة (مثال: موافقة الطلبات، اعتماد التقارير)',
      other: 'حدد نطاق التفويض المطلوب'
    };
    
    scopeTextarea.placeholder = placeholders[selectedType] || 'حدد نطاق التفويض';
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  const formData = collectFormData();
  const submitBtn = document.getElementById('submitBtn');
  
  showLoading(submitBtn, 'جاري إرسال الطلب...');
  
  try {
    const response = await apiClient.createDelegation(formData);
    
    showSuccess('تم إرسال طلب التفويض بنجاح!');
    
    // Clear form and redirect after delay
    setTimeout(() => {
      window.location.href = window.resolveFrontendPath('employee-dashboard.html');
    }, 2000);
    
  } catch (error) {
    console.error('Delegation submission error:', error);
    if (window.handleApiError) {
      window.handleApiError(error, 'إرسال طلب التفويض');
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
    { id: 'referenceNumber', message: 'رقم المرجع مطلوب' },
    { id: 'requestDate', message: 'تاريخ الطلب مطلوب' },
    { id: 'delegationType', message: 'نوع التفويض مطلوب' },
    { id: 'scopeDescription', message: 'وصف نطاق التفويض مطلوب' }
  ];

  // Validate required fields
  requiredFields.forEach(field => {
    const element = document.getElementById(field.id);
    if (!element || !element.value.trim()) {
      showFieldError(element, field.message);
      isValid = false;
    }
  });

  // Validate custom delegation type if selected
  const delegationType = document.getElementById('delegationType');
  if (delegationType && delegationType.value === 'other') {
    const customType = document.getElementById('customType');
    if (!customType || !customType.value.trim()) {
      showFieldError(customType, 'يرجى تحديد نوع التفويض');
      isValid = false;
    }
  }

  // Validate dates if provided
  if (!validateDates()) {
    isValid = false;
  }

  // Validate delegated employee if provided
  const delegatedEmployeeId = document.getElementById('delegatedEmployeeId');
  const employeeSearch = document.getElementById('employeeSearch');
  
  if (employeeSearch && employeeSearch.value.trim() && (!delegatedEmployeeId || !delegatedEmployeeId.value)) {
    showFieldError(employeeSearch, 'يرجى اختيار موظف صحيح من القائمة');
    isValid = false;
  }

  return isValid;
}

function validateDates() {
  const startDate = document.getElementById('startDate');
  const endDate = document.getElementById('endDate');
  
  if (!startDate || !endDate || !startDate.value || !endDate.value) {
    return true; // Dates are optional
  }
  
  const startDateValue = new Date(startDate.value);
  const endDateValue = new Date(endDate.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let isValid = true;

  // Start date should not be in the past
  if (startDateValue < today) {
    showFieldError(startDate, 'تاريخ البداية لا يمكن أن يكون في الماضي');
    isValid = false;
  }

  // End date should be after start date
  if (endDateValue <= startDateValue) {
    showFieldError(endDate, 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية');
    isValid = false;
  }

  // Maximum delegation period (e.g., 6 months)
  const maxDate = new Date(startDateValue);
  maxDate.setMonth(maxDate.getMonth() + 6);
  
  if (endDateValue > maxDate) {
    showFieldError(endDate, 'فترة التفويض لا يمكن أن تزيد عن 6 أشهر');
    isValid = false;
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
    case 'referenceNumber':
      if (value && value.length < 3) {
        showFieldError(field, 'رقم المرجع يجب أن يكون 3 أحرف على الأقل');
      }
      break;
      
    case 'scopeDescription':
      if (value && value.length < 10) {
        showFieldError(field, 'وصف النطاق يجب أن يكون 10 أحرف على الأقل');
      } else if (value && value.length > 1000) {
        showFieldError(field, 'وصف النطاق يجب أن يكون أقل من 1000 حرف');
      }
      break;
      
    case 'limitations':
      if (value && value.length > 500) {
        showFieldError(field, 'القيود يجب أن تكون أقل من 500 حرف');
      }
      break;
      
    case 'reason':
      if (value && value.length > 500) {
        showFieldError(field, 'السبب يجب أن يكون أقل من 500 حرف');
      }
      break;
  }
}

function collectFormData() {
  const delegationType = document.getElementById('delegationType').value;
  const actualDelegationType = delegationType === 'other' 
    ? document.getElementById('customType')?.value.trim() 
    : delegationType;

  return {
    reference_number: document.getElementById('referenceNumber').value.trim(),
    request_date: document.getElementById('requestDate').value,
    delegation_type: actualDelegationType,
    start_date: document.getElementById('startDate')?.value || null,
    end_date: document.getElementById('endDate')?.value || null,
    reason: document.getElementById('reason')?.value.trim() || null,
    delegated_to_employee_id: document.getElementById('delegatedEmployeeId')?.value || null,
    scope_description: document.getElementById('scopeDescription').value.trim(),
    limitations: document.getElementById('limitations')?.value.trim() || null
  };
}

// Employee search functionality
async function searchEmployees(query) {
  if (query.length < 2) {
    hideEmployeeSearchResults();
    return;
  }

  try {
    // This would typically call an API endpoint to search employees
    // For now, we'll simulate with a basic search
    const employees = await simulateEmployeeSearch(query);
    showEmployeeSearchResults(employees);
    
  } catch (error) {
    console.error('Employee search error:', error);
    hideEmployeeSearchResults();
  }
}

function simulateEmployeeSearch(query) {
  // Simulate API call - replace with actual API call
  return new Promise(resolve => {
    setTimeout(() => {
      const mockEmployees = [
        { id: 1, name: 'أحمد محمد علي', department: 'تقنية المعلومات', position: 'مطور' },
        { id: 2, name: 'فاطمة عبدالله', department: 'الموارد البشرية', position: 'أخصائية' },
        { id: 3, name: 'محمد صالح', department: 'المالية', position: 'محاسب' },
        { id: 4, name: 'نورا أحمد', department: 'التسويق', position: 'منسقة' }
      ];
      
      const filtered = mockEmployees.filter(emp => 
        emp.name.includes(query) || emp.department.includes(query)
      );
      
      resolve(filtered);
    }, 300);
  });
}

function showEmployeeSearchResults(employees) {
  const searchInput = document.getElementById('employeeSearch');
  if (!searchInput) return;

  // Remove existing results
  hideEmployeeSearchResults();

  if (employees.length === 0) {
    return;
  }

  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'employee-search-results';
  
  resultsContainer.innerHTML = employees.map(employee => `
    <div class="employee-result" onclick="selectEmployee(${employee.id}, '${employee.name}')">
      <div class="employee-name">${employee.name}</div>
      <div class="employee-details">${employee.position} - ${employee.department}</div>
    </div>
  `).join('');

  searchInput.parentNode.appendChild(resultsContainer);
}

function hideEmployeeSearchResults() {
  const existingResults = document.querySelector('.employee-search-results');
  if (existingResults) {
    existingResults.remove();
  }
}

function selectEmployee(employeeId, employeeName) {
  const employeeSearchInput = document.getElementById('employeeSearch');
  const employeeIdInput = document.getElementById('delegatedEmployeeId');
  
  if (employeeSearchInput) {
    employeeSearchInput.value = employeeName;
  }
  
  if (employeeIdInput) {
    employeeIdInput.value = employeeId;
  }
  
  hideEmployeeSearchResults();
  clearFieldError(employeeSearchInput);
}

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Helper functions (same as clearance-request.js)
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

// Add delegation-specific CSS
const style = document.createElement('style');
style.textContent = `
  .employee-search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
  }
  
  .employee-result {
    padding: 12px;
    cursor: pointer;
    border-bottom: 1px solid #f3f4f6;
    transition: background-color 0.2s;
  }
  
  .employee-result:hover {
    background-color: #f9fafb;
  }
  
  .employee-result:last-child {
    border-bottom: none;
  }
  
  .employee-name {
    font-weight: 600;
    color: #374151;
    margin-bottom: 4px;
  }
  
  .employee-details {
    font-size: 14px;
    color: #6b7280;
  }
  
  .form-group {
    position: relative;
  }
  
  #customTypeContainer {
    display: none;
    margin-top: 15px;
  }
  
  .delegation-type-info {
    background: #f0f9ff;
    border: 1px solid #e0f2fe;
    border-radius: 8px;
    padding: 12px;
    margin-top: 10px;
    font-size: 14px;
    color: #0369a1;
  }
`;
document.head.appendChild(style);

// Stage-E: Wrap delegation create to auto-queue on failure with banner
(function(){
  if (!window.apiClient || window.apiClient.__dlgWrapped) return;
  const orig = window.apiClient.createDelegation?.bind(window.apiClient);
  if (!orig) return;
  window.apiClient.__dlgWrapped = true;
  window.apiClient.createDelegation = async function(data){
    try {
      return await orig(data);
    } catch (error) {
      try {
        const key = 'requestsDelegation';
        const optimisticId = 'dlg_' + Date.now();
        const user = JSON.parse(localStorage.getItem('authUser')||'null');
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        list.unshift({ id: optimisticId, optimisticId, ...data, status: 'قيد الاعتماد', createdAt: new Date().toISOString(), createdBy: user?.email || null, syncing: true, syncFailed: false });
        localStorage.setItem(key, JSON.stringify(list));
        if (window.renderSyncBanner) {
          window.renderSyncBanner('sync-banner', 'تم حفظ الطلب وسيتم إرساله عند توفر الاتصال… ⏳', { tone: 'info' });
        }
        if (window.scheduleSync) {
          window.scheduleSync({ type: 'create', endpoint: '/delegation', method: 'POST', data, key, optimisticId });
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
      throw error;
    }
  };
})();
