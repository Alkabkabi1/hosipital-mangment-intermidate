// Admin Detail Comprehensive Data Display
// Populates ALL form fields from the database payload_json

/**
 * Displays all employee form data from payload_json
 */
window.displayEmployeeFormData = function(data) {
  const card = document.getElementById('employeeFormDataCard');
  const grid = document.getElementById('employeeFormDataGrid');
  
  if (!card || !grid) return;
  
  const items = [];
  
  // Container 1: Basic Info (الأسماء)
  if (data.firstName) items.push({ label: 'الاسم الأول', value: data.firstName });
  if (data.secondName) items.push({ label: 'الاسم الثاني', value: data.secondName });
  if (data.thirdName) items.push({ label: 'الاسم الثالث', value: data.thirdName });
  if (data.fourthName) items.push({ label: 'الاسم الرابع', value: data.fourthName });
  if (data.fatherName) items.push({ label: 'اسم الأب', value: data.fatherName });
  if (data.grandpaName) items.push({ label: 'اسم الجد', value: data.grandpaName });
  if (data.familyName) items.push({ label: 'اسم العائلة', value: data.familyName });
  if (data.fullName) items.push({ label: 'الاسم الرباعي الكامل', value: data.fullName });
  
  // Employee identification
  if (data.workId) items.push({ label: 'الرقم الوظيفي', value: data.workId });
  if (data.employeeNumber || data.employee_number) {
    items.push({ label: 'رقم الهوية/الإقامة', value: data.employeeNumber || data.employee_number });
  }
  if (data.nationality) items.push({ label: 'الجنسية', value: data.nationality });
  if (data.gender) {
    const genderText = data.gender === 'male' ? 'ذكر' : data.gender === 'female' ? 'أنثى' : data.gender;
    items.push({ label: 'الجنس', value: genderText });
  }
  if (data.birthDate) {
    items.push({ label: 'تاريخ الميلاد', value: window.DetailUtils ? window.DetailUtils.formatDate(data.birthDate) : data.birthDate });
  }
  if (data.phone) items.push({ label: 'رقم الهاتف', value: data.phone });
  
  // Display if we have data
  if (items.length > 0) {
    card.style.display = 'block';
    grid.innerHTML = items.map(item => `
      <div><strong>${item.label}:</strong> <b>${escapeHtml(String(item.value))}</b></div>
    `).join('');
  } else {
    card.style.display = 'none';
  }
};

/**
 * Displays document and transaction information
 */
window.displayDocumentInfo = function(data) {
  const card = document.getElementById('documentInfoCard');
  const grid = document.getElementById('documentInfoGrid');
  
  if (!card || !grid) return;
  
  const items = [];
  
  // Container 2: Document & Dates
  if (data.documentNumber || data.document_number) {
    items.push({ label: 'رقم المستند', value: data.documentNumber || data.document_number });
  }
  if (data.applicationDate) {
    items.push({ label: 'تاريخ الطلب', value: window.DetailUtils ? window.DetailUtils.formatDate(data.applicationDate) : data.applicationDate });
  }
  if (data.startDate || data.start_date) {
    items.push({ label: 'تاريخ المباشرة', value: window.DetailUtils ? window.DetailUtils.formatDate(data.startDate || data.start_date) : (data.startDate || data.start_date) });
  }
  if (data.transactionNumber || data.transaction_number) {
    items.push({ label: 'رقم المعاملة المبنية عليها', value: data.transactionNumber || data.transaction_number });
  }
  if (data.transactionDate || data.transaction_date) {
    items.push({ label: 'تاريخ المعاملة', value: window.DetailUtils ? window.DetailUtils.formatDate(data.transactionDate || data.transaction_date) : (data.transactionDate || data.transaction_date) });
  }
  if (data.appointmentDate) {
    items.push({ label: 'تاريخ التعيين', value: window.DetailUtils ? window.DetailUtils.formatDate(data.appointmentDate) : data.appointmentDate });
  }
  
  // Display if we have data
  if (items.length > 0) {
    card.style.display = 'block';
    grid.innerHTML = items.map(item => `
      <div><strong>${item.label}:</strong> <b>${escapeHtml(String(item.value))}</b></div>
    `).join('');
  } else {
    card.style.display = 'none';
  }
};

/**
 * Displays employment details
 */
window.displayEmploymentDetails = function(data) {
  const card = document.getElementById('employmentDetailsCard');
  const grid = document.getElementById('employmentDetailsGrid');
  
  if (!card || !grid) return;
  
  const items = [];
  
  // Container 3: Details
  if (data.jobTitle || data.job_title) {
    items.push({ label: 'المسمى الوظيفي', value: data.jobTitle || data.job_title });
  }
  if (data.department || data.employee_dept) {
    items.push({ label: 'القسم', value: data.department || data.employee_dept });
  }
  if (data.employeeStatus || data.employee_status) {
    const statusText = (data.employeeStatus || data.employee_status) === 'full_assignment' ? 'مكلف كامل' : 
                      (data.employeeStatus || data.employee_status) === 'partial_assignment' ? 'مكلف جزئي' :
                      data.employeeStatus || data.employee_status;
    items.push({ label: 'حالة الموظف', value: statusText });
  }
  if (data.employmentType || data.employment_type) {
    const empType = data.employmentType || data.employment_type;
    const typeMap = {
      'civil_service': 'خدمة مدنية',
      'self_employment': 'عمل حر',
      'surplus_workforce': 'قوى عاملة فائضة',
      'locum': 'بدل',
      'partial_assignment': 'تكليف جزئي'
    };
    items.push({ label: 'نوع التوظيف', value: typeMap[empType] || empType });
  }
  if (data.reasonForJob || data.reason_for_job) {
    const reason = data.reasonForJob || data.reason_for_job;
    const reasonMap = {
      'transfer': 'النقل',
      'assignment': 'التكليف',
      'appointment': 'التعيين',
      'secondment': 'الايفاد',
      'scholarship': 'الابتعاث'
    };
    items.push({ label: 'سبب إعطاء الوظيفة', value: reasonMap[reason] || reason });
  }
  if (data.onboardingReason || data.onboarding_reason) {
    const reason = data.onboardingReason || data.onboarding_reason;
    const reasonMap = {
      'transfer': 'النقل',
      'assignment': 'التكليف',
      'appointment': 'التعيين',
      'secondment': 'الايفاد',
      'scholarship': 'الابتعاث'
    };
    items.push({ label: 'سبب المباشرة', value: reasonMap[reason] || reason });
  }
  if (data.group) items.push({ label: 'المجموعة', value: data.group });
  if (data.rank) items.push({ label: 'الرتبة', value: data.rank });
  
  // Display if we have data
  if (items.length > 0) {
    card.style.display = 'block';
    grid.innerHTML = items.map(item => `
      <div><strong>${item.label}:</strong> <b>${escapeHtml(String(item.value))}</b></div>
    `).join('');
  } else {
    card.style.display = 'none';
  }
};

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

console.log('✅ Admin detail comprehensive data display loaded');

