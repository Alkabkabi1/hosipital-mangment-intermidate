// Clearance Request Inline Script - CSP-friendly, with offline sync banners

document.addEventListener('DOMContentLoaded', function() {
  // Use global notification system from notification-utils.js
  // No need for duplicate functions - window.addNotification and window.notifyAdmins are already available

  // ensure default admins
  (function ensureAdmins() {
    const stored = JSON.parse(localStorage.getItem('adminEmails') || '[]');
    if (stored.length === 0) {
      const defaults = ['admin@kauh.sa','it@kauh.sa','hr@kauh.sa'];
      localStorage.setItem('adminEmails', JSON.stringify(defaults));
    }
  })();

  // auth guard
  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  if (!authUser) { 
    window.location.href = window.resolveFrontendPath ? window.resolveFrontendPath('login.html') : 'login.html'; 
    return; 
  }
  if (authUser && authUser.role === 'admin') { 
    window.location.href = window.resolveFrontendPath ? window.resolveFrontendPath('admin-dashboard.html') : 'admin-dashboard.html'; 
    return; 
  }

  // Auto-fill all fields from authenticated user profile
  loadAndFillProfileData(authUser);

  // Function to load and fill profile data
  async function loadAndFillProfileData(authUser) {
    try {
      // Fetch full profile data from backend
      const profile = await window.apiClient.getProfile();
      
      console.log('📋 Auto-filling clearance form with profile data:', profile);
      
      // Auto-fill email
      const emailField = document.getElementById('empEmail');
      if (emailField && (profile.email || authUser.email)) {
        emailField.value = profile.email || authUser.email;
        emailField.readOnly = true;
        emailField.style.backgroundColor = '#f5f5f5';
        emailField.style.cursor = 'not-allowed';
      }
      
      // Auto-fill phone
      const phoneField = document.getElementById('empMobile');
      if (phoneField && (profile.app_users_phone || profile.phone_primary || authUser.phone)) {
        phoneField.value = profile.app_users_phone || profile.phone_primary || authUser.phone;
        phoneField.readOnly = true;
        phoneField.style.backgroundColor = '#f5f5f5';
        phoneField.style.cursor = 'not-allowed';
      }
      
      // Auto-fill name fields
      const firstNameField = document.getElementById('empFirstName');
      const secondNameField = document.getElementById('empSecondName');
      const thirdNameField = document.getElementById('empThirdName');
      
      if (profile.first_name_ar || profile.full_name_ar) {
        const nameParts = profile.full_name_ar ? profile.full_name_ar.split(' ') : [];
        if (firstNameField) firstNameField.value = profile.first_name_ar || nameParts[0] || '';
        if (secondNameField) secondNameField.value = profile.second_name_ar || nameParts[1] || '';
        if (thirdNameField) thirdNameField.value = profile.third_name_ar || nameParts[2] || '';
      }
      
      // Auto-fill employee number
      const empJobNoField = document.getElementById('empJobNo');
      if (empJobNoField && (profile.app_users_employee_number || profile.employee_number)) {
        empJobNoField.value = profile.app_users_employee_number || profile.employee_number;
      }
      
      // Auto-fill department
      const empDeptField = document.getElementById('empDept');
      if (empDeptField && (profile.app_users_department_name || profile.department_name)) {
        empDeptField.value = profile.app_users_department_name || profile.department_name;
      }
      
      // Auto-fill job title
      const empTitleField = document.getElementById('empTitle');
      if (empTitleField && (profile.app_users_job_title || profile.job_title_name_ar || profile.position)) {
        empTitleField.value = profile.app_users_job_title || profile.job_title_name_ar || profile.position;
      }
      
      console.log('✅ Clearance form auto-filled successfully');
      
    } catch (error) {
      console.error('❌ Error loading profile data for clearance form:', error);
      // Fallback to basic auth user data
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
      
      // Auto-fill name fields if available
      if (authUser.name) {
        const nameParts = authUser.name.split(' ');
        const firstNameField = document.getElementById('empFirstName');
        const secondNameField = document.getElementById('empSecondName');
        const thirdNameField = document.getElementById('empThirdName');
        
        if (firstNameField && nameParts[0]) firstNameField.value = nameParts[0];
        if (secondNameField && nameParts[1]) secondNameField.value = nameParts[1];
        if (thirdNameField && nameParts[2]) thirdNameField.value = nameParts[2];
      }
    }
  }

  // Define clearance reasons
  const clearanceReasons = {
    end_of_service: [
      { value: 'retirement', label: 'تقاعد' },
      { value: 'early_retirement', label: 'تقاعد مبكر' },
      { value: 'resignation', label: 'استقالة' },
      { value: 'replacement', label: 'استبدال' },
      { value: 'contract_not_renewed', label: 'عدم رغبة صاحب العمل في تجديد العقد' },
      { value: 'external_assignment', label: 'تكليف خارجي' },
      { value: 'other', label: 'أخرى' }
    ],
    end_mid_service: [
      { value: 'due_to_assignment', label: 'بسبب التكليف' },
      { value: 'due_to_scholarship', label: 'بسبب المنحة الدراسية' },
      { value: 'due_to_holiday', label: 'بسبب الإجازة' },
      { value: 'due_to_transportation', label: 'بسبب النقل' },
      { value: 'reason_5', label: 'السبب الخامس' },
      { value: 'reason_6', label: 'السبب السادس' },
      { value: 'other', label: 'أخرى' }
    ]
  };

  // Setup clearance type change handler
  const clearanceTypeSelect = document.getElementById('clearanceType');
  const clearReasonSelect = document.getElementById('clearReason');
  const otherReasonInput = document.getElementById('otherReason');

  if (clearanceTypeSelect && clearReasonSelect) {
    clearanceTypeSelect.addEventListener('change', function() {
      const selectedType = this.value;
      clearReasonSelect.innerHTML = '<option value="">اختر السبب</option>';
      
      if (selectedType && clearanceReasons[selectedType]) {
        clearReasonSelect.disabled = false;
        clearanceReasons[selectedType].forEach(reason => {
          const option = document.createElement('option');
          option.value = reason.value;
          option.textContent = reason.label;
          clearReasonSelect.appendChild(option);
        });
      } else {
        clearReasonSelect.disabled = true;
        clearReasonSelect.innerHTML = '<option value="">اختر نوع الإخلاء أولاً</option>';
      }
      
      // Hide other reason input when type changes
      otherReasonInput.style.display = 'none';
      otherReasonInput.required = false;
    });
  }

  // Handle reason change (for "other" option)
  if (clearReasonSelect) {
    clearReasonSelect.addEventListener('change', function() {
      if (this.value === 'other') {
        otherReasonInput.style.display = 'block';
        otherReasonInput.required = true;
      } else {
        otherReasonInput.style.display = 'none';
        otherReasonInput.required = false;
        otherReasonInput.value = ''; // Clear the value when hiding
      }
    });
  }

  // event delegation
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    try {
      switch (action) {
        case 'submit-clearance': handleClearanceSubmit(); break;
        case 'cancel-form':
        case 'go-back': history.back(); break;
      }
    } catch (err) {
      console.error('Form action error:', err);
      window.showError && window.showError('حدث خطأ في إرسال الطلب');
    }
  });

  async function handleClearanceSubmit() {
    const formData = {
      empFirstName: document.getElementById('empFirstName')?.value || '',
      empSecondName: document.getElementById('empSecondName')?.value || '',
      empThirdName: document.getElementById('empThirdName')?.value || '',
      empJobNo: document.getElementById('empJobNo')?.value || '',
      empEmail: document.getElementById('empEmail')?.value || '',
      empDept: document.getElementById('empDept')?.value || '',
      empTitle: document.getElementById('empTitle')?.value || '',
      empMobile: document.getElementById('empMobile')?.value || '',
      clearanceType: document.getElementById('clearanceType')?.value || '',
      clearReason: document.getElementById('clearReason')?.value || '',
      otherReason: document.getElementById('otherReason')?.value || '',
      lastWorkDay: document.getElementById('lastWorkDay')?.value || '',
      documentNumber: document.getElementById('documentNumber')?.value || ''
    };

    // validate
    if (!formData.empFirstName || !formData.empEmail || !formData.lastWorkDay) {
      window.showError && window.showError('الرجاء تعبئة الحقول المطلوبة');
      return;
    }

    // Validate required fields before sending
    if (!formData.empEmail || !formData.clearanceType || !formData.clearReason || !formData.lastWorkDay || !formData.documentNumber) {
      window.showError && window.showError('يرجى تعبئة جميع الحقول المطلوبة (نوع الإخلاء وسببه ورقم المستند)');
      return;
    }

    // Validate "other" reason if selected
    if (formData.clearReason === 'other' && !formData.otherReason.trim()) {
      window.showError && window.showError('يرجى إدخال السبب');
      return;
    }

    // Validate lastWorkDay is in the future
    if (formData.lastWorkDay) {
      const lastWorkDay = new Date(formData.lastWorkDay);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (lastWorkDay <= today) {
        window.showError && window.showError('آخر يوم عمل يجب أن يكون في المستقبل');
        return;
      }
    }

    // Get the reason label for display
    const selectedType = formData.clearanceType;
    const selectedReasonValue = formData.clearReason;
    let reasonLabel = '';
    if (clearanceReasons[selectedType]) {
      const reasonObj = clearanceReasons[selectedType].find(r => r.value === selectedReasonValue);
      reasonLabel = reasonObj ? reasonObj.label : selectedReasonValue;
    }
    
    // If "other" is selected, use the custom reason
    if (selectedReasonValue === 'other' && formData.otherReason.trim()) {
      reasonLabel = formData.otherReason.trim();
    }

    const payload = {
      email: formData.empEmail.trim(),
      clearanceType: formData.clearanceType,
      reason: reasonLabel || formData.clearReason,
      specificReason: formData.clearReason === 'other' ? 'other' : formData.clearReason, // Store the specific reason code
      lastWorkingDay: formData.lastWorkDay, // Should be in YYYY-MM-DD format
      documentNumber: formData.documentNumber.trim(), // Document number the clearance is based on
      // Optional fields that backend accepts
      firstName: formData.empFirstName?.trim() || '',
      secondName: formData.empSecondName?.trim() || '',
      thirdName: formData.empThirdName?.trim() || '',
      employeeNumber: formData.empJobNo?.trim() || '',
      department: formData.empDept?.trim() || '',
      jobTitle: formData.empTitle?.trim() || '',
      phone: formData.empMobile?.trim() || '',
      requestDate: new Date().toISOString().split('T')[0] // Today's date
    };
    
    // If "other" reason, include the custom reason text
    if (formData.clearReason === 'other') {
      payload.otherReasonText = formData.otherReason.trim();
    }

    console.log('📋 Clearance payload being sent:', payload);

    const scheduleOffline = (key, optimisticId) => {
      try {
        if (window.renderSyncBanner) {
          window.renderSyncBanner('sync-banner', 'تم حفظ الطلب وسيتم إرساله عند توفر الاتصال… ⏳', { tone: 'info' });
        }
        if (window.scheduleSync) {
          window.scheduleSync({ type: 'create', endpoint: '/employee/requests/clearance', method: 'POST', data: payload, key, optimisticId });
        }
        const onFailed = (ev) => {
          const d = ev && ev.detail || {}; if (d.key !== key || String(d.optimisticId) !== String(optimisticId)) return;
          if (window.renderSyncBanner) {
            const retryBtn = `<button class="btn" type="button" onclick="window.retrySync && window.retrySync('${optimisticId}')">إعادة المحاولة</button>`;
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
    };

    try {
      if (window.apiClient) {
        const response = await window.apiClient.createClearance(payload);
        if (response && response.success) {
          // Use global notification system
          window.addNotification(`تم تقديم طلب #${response.data.reference_number} (إخلاء طرف)`, {
            recipient: formData.empEmail,
            type: 'clearance_submitted', 
            requestId: response.data.id, 
            reference_number: response.data.reference_number
          });
          window.showSuccess && window.showSuccess(`تم إرسال الطلب بنجاح! الرقم المرجعي: ${response.data.reference_number}`);
          setTimeout(() => { 
            window.location.href = window.resolveFrontendPath ? window.resolveFrontendPath('employee-dashboard.html') : 'employee-dashboard.html'; 
          }, 2000);
        } else {
          const key = 'requestsClearance';
          const optimisticId = 'cl_' + Date.now();
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          list.unshift({ id: optimisticId, optimisticId, status: 'قيد الاعتماد', createdAt: new Date().toISOString(), createdBy: authUser?.email || formData.empEmail, syncing: true, syncFailed: false, employee: { email: formData.empEmail, department: formData.empDept, name: formData.empFirstName } });
          localStorage.setItem(key, JSON.stringify(list));
          scheduleOffline(key, optimisticId);
        }
      } else {
        const key = 'requestsClearance';
        const optimisticId = 'cl_' + Date.now();
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        list.unshift({ id: optimisticId, optimisticId, status: 'قيد الاعتماد', createdAt: new Date().toISOString(), createdBy: authUser?.email || formData.empEmail, syncing: true, syncFailed: false, employee: { email: formData.empEmail, department: formData.empDept, name: formData.empFirstName } });
        localStorage.setItem(key, JSON.stringify(list));
        scheduleOffline(key, optimisticId);
      }
    } catch (error) {
      console.error('Clearance submission error:', error);
      window.showError && window.showError('حدث خطأ أثناء الإرسال');
      const key = 'requestsClearance';
      const optimisticId = 'cl_' + Date.now();
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      list.unshift({ id: optimisticId, optimisticId, status: 'قيد الاعتماد', createdAt: new Date().toISOString(), createdBy: authUser?.email || formData.empEmail, syncing: true, syncFailed: false, employee: { email: formData.empEmail, department: formData.empDept, name: formData.empFirstName } });
      localStorage.setItem(key, JSON.stringify(list));
      scheduleOffline(key, optimisticId);
    }
  }

  console.log('✓ Clearance request inline script loaded');
});

