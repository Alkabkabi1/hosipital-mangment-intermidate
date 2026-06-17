// Assignment Termination Request Inline Script - CSP-friendly, with profile auto-fill

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
      
      console.log('📋 Auto-filling assignment termination form with profile data:', profile);
      
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
      
      console.log('✅ Assignment termination form auto-filled successfully');
      
    } catch (error) {
      console.error('❌ Error loading profile data for assignment termination form:', error);
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

  // event delegation
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    try {
      switch (action) {
        case 'submit-termination': handleTerminationSubmit(); break;
        case 'cancel-form':
        case 'go-back': history.back(); break;
      }
    } catch (err) {
      console.error('Form action error:', err);
      window.showError && window.showError('حدث خطأ في إرسال الطلب');
    }
  });

  async function handleTerminationSubmit() {
    const formData = {
      empFirstName: document.getElementById('empFirstName')?.value || '',
      empSecondName: document.getElementById('empSecondName')?.value || '',
      empThirdName: document.getElementById('empThirdName')?.value || '',
      empJobNo: document.getElementById('empJobNo')?.value || '',
      empEmail: document.getElementById('empEmail')?.value || '',
      empDept: document.getElementById('empDept')?.value || '',
      empTitle: document.getElementById('empTitle')?.value || '',
      empMobile: document.getElementById('empMobile')?.value || '',
      assignmentRole: document.getElementById('assignmentRole')?.value || '',
      assignmentDepartment: document.getElementById('assignmentDepartment')?.value || '',
      assignmentStartDate: document.getElementById('assignmentStartDate')?.value || '',
      terminationDate: document.getElementById('terminationDate')?.value || '',
      returnDate: document.getElementById('returnDate')?.value || '',
      returnToDepartment: document.getElementById('returnToDepartment')?.value || '',
      returnToPosition: document.getElementById('returnToPosition')?.value || '',
      terminationReason: document.getElementById('terminationReason')?.value || '',
      assignmentPerformance: document.getElementById('assignmentPerformance')?.value || '',
      lessonsLearned: document.getElementById('lessonsLearned')?.value || '',
      requestNotes: document.getElementById('requestNotes')?.value || ''
    };

    // validate
    if (!formData.empFirstName || !formData.empEmail || !formData.assignmentRole || !formData.terminationDate) {
      window.showError && window.showError('الرجاء تعبئة الحقول المطلوبة');
      return;
    }

    // Validate required fields before sending
    if (!formData.empEmail || !formData.assignmentRole || !formData.terminationReason || !formData.terminationDate) {
      window.showError && window.showError('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    // Validate terminationDate is in the future or present
    if (formData.terminationDate) {
      const terminationDate = new Date(formData.terminationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (terminationDate < today) {
        window.showError && window.showError('تاريخ الإنهاء يجب أن يكون اليوم أو في المستقبل');
        return;
      }
    }

    // Combine name fields into employeeName
    const nameParts = [
      formData.empFirstName?.trim() || '',
      formData.empSecondName?.trim() || '',
      formData.empThirdName?.trim() || ''
    ].filter(part => part !== '');
    const employeeName = nameParts.join(' ');

    const payload = {
      employeeName: employeeName,
      email: formData.empEmail.trim(),
      employeeNumber: formData.empJobNo?.trim() || '',
      assignmentRole: formData.assignmentRole.trim(),
      assignmentDepartment: formData.assignmentDepartment?.trim() || '',
      assignmentStartDate: formData.assignmentStartDate || null,
      terminationDate: formData.terminationDate,
      returnDate: formData.returnDate || null,
      returnToDepartment: formData.returnToDepartment?.trim() || '',
      returnToPosition: formData.returnToPosition?.trim() || '',
      terminationReason: formData.terminationReason.trim(),
      assignmentPerformance: formData.assignmentPerformance?.trim() || '',
      lessonsLearned: formData.lessonsLearned?.trim() || '',
      requestNotes: formData.requestNotes?.trim() || '',
      requestDate: new Date().toISOString().split('T')[0] // Today's date
    };

    console.log('📋 Assignment termination request payload being sent:', payload);

    const scheduleOffline = (key, optimisticId) => {
      try {
        if (window.renderSyncBanner) {
          window.renderSyncBanner('sync-banner', 'تم حفظ الطلب وسيتم إرساله عند توفر الاتصال… ⏳', { tone: 'info' });
        }
        if (window.scheduleSync) {
          window.scheduleSync({ type: 'create', endpoint: '/employee/requests/assignment-termination', method: 'POST', data: payload, key, optimisticId });
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
        const response = await window.apiClient.makeRequest('/assignment-termination', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response && response.success) {
          // Use global notification system
          window.addNotification(`تم تقديم طلب #${response.data.reference_number} (إنهاء تكليف)`, {
            recipient: formData.empEmail,
            type: 'assignment_termination_submitted', 
            requestId: response.data.id, 
            reference_number: response.data.reference_number
          });
          window.showSuccess && window.showSuccess(`تم إرسال الطلب بنجاح! الرقم المرجعي: ${response.data.reference_number}`);
          setTimeout(() => { 
            window.location.href = window.resolveFrontendPath ? window.resolveFrontendPath('employee-dashboard.html') : 'employee-dashboard.html'; 
          }, 2000);
        } else {
          const key = 'requestsAssignmentTermination';
          const optimisticId = 'at_' + Date.now();
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          list.unshift({ id: optimisticId, optimisticId, status: 'قيد الاعتماد', createdAt: new Date().toISOString(), createdBy: authUser?.email || formData.empEmail, syncing: true, syncFailed: false, employee: { email: formData.empEmail, department: formData.empDept, name: formData.empFirstName } });
          localStorage.setItem(key, JSON.stringify(list));
          scheduleOffline(key, optimisticId);
        }
      } else {
        const key = 'requestsAssignmentTermination';
        const optimisticId = 'at_' + Date.now();
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        list.unshift({ id: optimisticId, optimisticId, status: 'قيد الاعتماد', createdAt: new Date().toISOString(), createdBy: authUser?.email || formData.empEmail, syncing: true, syncFailed: false, employee: { email: formData.empEmail, department: formData.empDept, name: formData.empFirstName } });
        localStorage.setItem(key, JSON.stringify(list));
        scheduleOffline(key, optimisticId);
      }
    } catch (error) {
      console.error('Assignment termination request submission error:', error);
      window.showError && window.showError('حدث خطأ أثناء الإرسال');
      const key = 'requestsAssignmentTermination';
      const optimisticId = 'at_' + Date.now();
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      list.unshift({ id: optimisticId, optimisticId, status: 'قيد الاعتماد', createdAt: new Date().toISOString(), createdBy: authUser?.email || formData.empEmail, syncing: true, syncFailed: false, employee: { email: formData.empEmail, department: formData.empDept, name: formData.empFirstName } });
      localStorage.setItem(key, JSON.stringify(list));
      scheduleOffline(key, optimisticId);
    }
  }

  console.log('✓ Assignment termination request inline script loaded');
});

