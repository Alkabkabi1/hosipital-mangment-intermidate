// Direct Request Inline JavaScript - Extracted from direct-request.html
// This file contains all the inline JavaScript for better organization and CSP compliance

document.addEventListener('DOMContentLoaded', function() {
  // Wait for dependencies before initializing
  if (typeof window.waitForDependencies === 'function') {
    window.waitForDependencies(() => {
      initializeDirectRequestPage();
    }, ['apiClient', 'NotificationStore', 'resolveFrontendPath']);
  } else {
    console.warn('⚠️ Dependency guard not available, initializing immediately');
    setTimeout(initializeDirectRequestPage, 1000);
  }
});

function initializeDirectRequestPage() {
  try {
    /* ===== حماية الصفحة ===== */
    const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
    if (!authUser) { 
      window.location.href = window.resolveFrontendPath('login.html'); 
      return;
    }
    if (authUser && authUser.role === 'admin') { 
      window.location.href = window.resolveFrontendPath('admin-dashboard.html'); 
      return;
    }

    console.log('✅ Direct request page initialized for user:', authUser.name);

    /* ===== ضمان وجود adminEmails لو كانت فاضية ===== */
    ensureAdminEmails();

    /* ===== تهيئة النموذج ===== */
    setupDirectRequestForm();
    
  } catch (error) {
    console.error('❌ Error initializing direct request page:', error);
    if (window.handleApiError) {
      window.handleApiError(error, 'تهيئة صفحة طلب المباشرة');
    }
  }
}

function ensureAdminEmails() {
  try {
    let admins = JSON.parse(localStorage.getItem('adminEmails') || '[]');
    if (!Array.isArray(admins)) admins = [];
    if (!admins.length) {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      admins = users.filter(u => u && u.role === 'admin' && u.email)
        .map(u => String(u.email).toLowerCase());
      if (!admins.length) admins = ['admin@dev.local']; // Updated default
      localStorage.setItem('adminEmails', JSON.stringify(admins));
    }
  } catch (error) {
    console.error('❌ Error ensuring admin emails:', error);
  }
}

function setupDirectRequestForm() {
  /* ===== تحديث البيانات الشخصية تلقائياً ===== */
  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  if (authUser) {
    const firstNameField = document.getElementById('firstName');
    const secondNameField = document.getElementById('secondName');
    const emailField = document.getElementById('email');
    
    if (firstNameField && !firstNameField.value && authUser.name) {
      const nameParts = authUser.name.split(' ');
      firstNameField.value = nameParts[0] || '';
      if (secondNameField && nameParts.length > 1) {
        secondNameField.value = nameParts.slice(1).join(' ');
      }
    }
    
    if (emailField && !emailField.value && authUser.email) {
      emailField.value = authUser.email;
    }
  }

  /* ===== إرسال النموذج ===== */
  // Note: Form submission is handled by direct-request.js handleFormSubmit()
  // This prevents duplicate form handlers

  /* ===== زر الإلغاء ===== */
  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      if (confirm('هل أنت متأكد من إلغاء الطلب؟')) {
        window.location.href = window.resolveFrontendPath('employee-dashboard.html');
      }
    });
  }
}

async function handleDirectRequestSubmit(event) {
  event.preventDefault();
  
  // Get submit button and store original text BEFORE try block
  const submitBtn = document.getElementById('btnSubmit');
  let originalText = '';
  if (submitBtn) {
    originalText = submitBtn.textContent || 'إرسال الطلب';
  }
  
  try {
    // Use the form's collectFormData function if available, otherwise use FormData
    let data = {};
    if (typeof collectFormData === 'function') {
      data = collectFormData();
    } else {
      const formData = new FormData(event.target);
      data = Object.fromEntries(formData.entries());
    }
    
    // Add metadata
    const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
    data.createdBy = authUser?.email || '';
    data.createdAt = new Date().toISOString();
    data.status = 'قيد الاعتماد';
    data.type = 'onboarding';
    
    // Show loading
    if (submitBtn) {
      submitBtn.textContent = 'جاري الإرسال...';
      submitBtn.disabled = true;
    }

    // PROPER DATA FLOW: Save to DATABASE FIRST
    console.log('📝 Saving request to DATABASE...');
    
    try {
      // Save to database via API (should work now with fixed SQL)
      const result = await window.apiClient.createOnboarding(data);
      console.log('✅ Request saved to DATABASE successfully:', result);
      
      if (window.showSuccess) {
        window.showSuccess(`تم إرسال طلب المباشرة بنجاح! الرقم المرجعي: ${result.reference_number}`);
      }
      
      // Redirect after delay
      setTimeout(() => {
        window.location.href = window.resolveFrontendPath('employee-dashboard.html');
      }, 2000);
      
    } catch (apiError) {
      console.error('❌ Database save failed:', apiError);
      
      // FALLBACK: Save to localStorage if database fails
      console.log('⚠️ Falling back to localStorage...');
      const requestId = 'onb_' + Date.now();
      const referenceNumber = 'ONB-' + Date.now();
      
      const requestData = {
        ...data,
        id: requestId,
        reference_number: referenceNumber,
        status: 'قيد الاعتماد',
        created_at: new Date().toISOString(),
        employee_name: `${data.firstName} ${data.secondName}`,
        employee_email: data.email || authUser.email,
        employee_dept: data.department || 'غير محدد',
        type: 'onboarding'
      };
      
      const requests = JSON.parse(localStorage.getItem('requestsOnboarding') || '[]');
      requests.unshift(requestData);
      localStorage.setItem('requestsOnboarding', JSON.stringify(requests));
      
      if (window.showSuccess) {
        window.showSuccess(`تم حفظ الطلب محلياً - سيتم إرساله عند إصلاح قاعدة البيانات. الرقم المرجعي: ${referenceNumber}`);
      }
      
      setTimeout(() => {
        window.location.href = window.resolveFrontendPath('employee-dashboard.html');
      }, 2000);
    }
    
  } catch (error) {
    console.error('❌ Direct request submission error:', error);
    
    if (window.handleApiError) {
      window.handleApiError(error, 'إرسال طلب المباشرة');
    }
    
    // Restore button
    if (submitBtn && originalText) {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }
}

console.log('📝 Direct request inline script loaded');
