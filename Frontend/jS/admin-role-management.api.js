
// Roles will be loaded dynamically from the database
// Admin can manually add any role they want
const ROLE_OPTIONS = [];

let usersWithRoles = [];
let availableRoles = [];
let isLoading = false;
const emailUserMap = new Map();

const authUser = window.requireAdmin ? window.requireAdmin() : JSON.parse(localStorage.getItem('authUser') || 'null');
if (authUser) {
  initRoleManagement();
}

async function initRoleManagement() {
  try {
    setPageLoading(true);
    await loadRolesAndUsers();
    initForm();
    renderKpis();
    renderTable();
  } catch (error) {
    console.error('Role management init error:', error);
    alert('تعذر تحميل بيانات الصلاحيات. يرجى المحاولة لاحقاً.');
  } finally {
    setPageLoading(false);
  }
}

function setPageLoading(state) {
  isLoading = state;
  const overlay = document.getElementById('roleLoading');
  if (overlay) {
    overlay.style.display = state ? 'flex' : 'none';
  }
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(btn => {
    if (state) {
      btn.setAttribute('disabled', 'disabled');
    } else {
      btn.removeAttribute('disabled');
    }
  });
}

function pickArray(res, candidates = ['data', 'items', 'users', 'results', 'roles']) {
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object') {
    for (const k of candidates) {
      if (Array.isArray(res[k])) return res[k];
    }
  }
  return [];
}

async function loadRolesAndUsers() {
  // Make sure these match your backend routes
  const [rolesRes, usersRes] = await Promise.all([
    apiClient.getRoles(),
    apiClient.getUsersWithRoles(),
  ]);

  availableRoles = pickArray(rolesRes, ['data', 'items', 'roles', 'results']);
  usersWithRoles = pickArray(usersRes, ['data', 'items', 'users', 'results']);

  // Helpful logging while we wire things up
  if (!availableRoles.length) console.warn('No roles array in response:', rolesRes);
  if (!usersWithRoles.length) console.warn('No users array in response:', usersRes);

  normalizeEmailCache();
}

function normalizeEmailCache() {
  emailUserMap.clear();
  const userList = Array.isArray(usersWithRoles) ? usersWithRoles : pickArray(usersWithRoles);
  
  userList.forEach(user => {
    const email = (user.email || user.userEmail || user.username || '').toLowerCase().trim();
    if (email) {
      emailUserMap.set(email, user);
    }
  });
  
  console.log('📧 Email cache normalized:', emailUserMap.size, 'users');
}

function initForm() {
  const scopeBox = document.getElementById('scopeBox');
  if (scopeBox) {
    // Clear the loading message
    scopeBox.innerHTML = '';
    
    // Load all roles dynamically from database
    const allRoles = [];
    (availableRoles || []).forEach(role => {
      if (role && role.role_name) {
        const value = role.role_name.toUpperCase();
        if (!allRoles.some(r => r.value === value)) {
          allRoles.push({ value, label: role.role_name_ar || role.role_name });
        }
      }
    });
    
    // Display message if no roles found
    if (allRoles.length === 0) {
      const notice = document.createElement('p');
      notice.style.cssText = 'color:#64748b;font-size:14px;margin:8px 0;';
      notice.textContent = 'لا توجد أدوار في النظام. استخدم الحقل أدناه لإضافة دور مخصص.';
      scopeBox.appendChild(notice);
    }
    
    // Create checkbox for each role
    allRoles.forEach(role => {
      const label = document.createElement('label');
      label.className = 'scope';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = role.value;
      label.appendChild(input);
      label.appendChild(document.createTextNode(' ' + role.label));
      scopeBox.appendChild(label);
    });
    
    // Add custom role input
    const customWrapper = document.createElement('span');
    customWrapper.className = 'scope';
    customWrapper.innerHTML = `
      <input id="fCustomScope" class="input" placeholder="إضافة دور مخصص" style="height:36px;width:180px">
      <button class="btn" id="btnAddScope" type="button">+</button>
    `;
    scopeBox.appendChild(customWrapper);
    
    // Setup custom role button
    const addBtn = document.getElementById('btnAddScope');
    if (addBtn) {
      addBtn.onclick = () => {
        const customInput = document.getElementById('fCustomScope');
        const roleName = (customInput.value || '').trim().toUpperCase();
        if (!roleName) {
          alert('يرجى إدخال اسم الدور');
          return;
        }
        
        // Check if already exists
        const exists = Array.from(scopeBox.querySelectorAll('input[type="checkbox"]'))
          .some(input => input.value === roleName);
        if (exists) {
          alert('هذا الدور موجود بالفعل');
          return;
        }
        
        // Add new checkbox
        const label = document.createElement('label');
        label.className = 'scope';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = roleName;
        input.checked = true;
        label.appendChild(input);
        label.appendChild(document.createTextNode(' ' + roleName));
        scopeBox.insertBefore(label, customWrapper);
        customInput.value = '';
      };
    }
  }
  
  const saveBtn = document.getElementById('btnSave');
  if (saveBtn) {
    saveBtn.onclick = handleAssignRoles;
  }
  const resetBtn = document.getElementById('btnReset');
  if (resetBtn) {
    resetBtn.onclick = resetForm;
  }
}

function resetForm() {
  const form = document.getElementById('roleForm');
  if (form) form.reset();
  document.querySelectorAll('#scopeBox input[type="checkbox"]').forEach(input => {
    input.checked = false;
  });
}

function getSelectedRoles() {
  return Array.from(document.querySelectorAll('#scopeBox input[type="checkbox"]:checked'))
    .map(input => input.value.toUpperCase());
}

async function handleAssignRoles() {
  if (isLoading) return;
  const emailInput = document.getElementById('fUserEmail') || document.getElementById('fTo'); // Support both
  const targetEmail = emailInput ? emailInput.value.trim().toLowerCase() : '';
  if (!targetEmail) {
    alert('يرجى تحديد البريد الإلكتروني للمستخدم.');
    return;
  }
  const user = emailUserMap.get(targetEmail);
  if (!user) {
    alert('لم يتم العثور على مستخدم بهذا البريد.');
    return;
  }
  const selectedRoles = getSelectedRoles();
  if (!selectedRoles.length) {
    alert('يرجى اختيار دور واحد على الأقل.');
    return;
  }
  try {
    setPageLoading(true);
    const currentRoles = new Set((user.roles || []).map(role => role.toUpperCase()));
    const desiredRoles = new Set(selectedRoles);
    const rolesToAdd = selectedRoles.filter(role => !currentRoles.has(role));
    const rolesToRemove = Array.from(currentRoles).filter(role => role !== 'EMPLOYEE' && !desiredRoles.has(role));
    for (const role of rolesToAdd) {
      await apiClient.assignRole(user.id, role);
    }
    for (const role of rolesToRemove) {
      await apiClient.removeRole(user.id, role);
    }
    alert('تم تحديث صلاحيات المستخدم.');
    
    // Refresh roles for current user if they were modified
    if (user.email === authUser?.email) {
      console.log('🔄 Refreshing current user roles after assignment...');
      
      // Refresh JWT token with new roles from backend
      try {
        const tokenResponse = await apiClient.refreshTokenAfterRoleChange();
        if (tokenResponse?.token || tokenResponse?.accessToken) {
          const newToken = tokenResponse.token || tokenResponse.accessToken;
          localStorage.setItem('authToken', newToken);
          
          // Update user object with new data
          if (tokenResponse.user) {
            const updatedUser = { ...authUser, ...tokenResponse.user };
            localStorage.setItem('authUser', JSON.stringify(updatedUser));
          }
          
          console.log('✅ JWT token refreshed with new roles');
        }
      } catch (error) {
        console.warn('Failed to refresh token, trying local update:', error);
      }
      
      // Also update local role cache
      if (window.RoleAssignmentManager) {
        await window.RoleAssignmentManager.applyRolesForCurrentUser();
      }
      if (window.rolePermissions) {
        await window.rolePermissions.init();
      }
      console.log('✅ Current user roles refreshed');
    }
    
    await loadRolesAndUsers();
    renderKpis();
    renderTable();
    resetForm();
  } catch (error) {
    console.error('assign role error', error);
    alert(error.message || 'تعذر تحديث الصلاحيات.');
  } finally {
    setPageLoading(false);
  }
}

function renderKpis() {
  const totalUsers = usersWithRoles.length;
  const adminCount = usersWithRoles.filter(user => (user.roles || []).some(role => role.toUpperCase() === 'ADMIN')).length;
  const totalAssignments = usersWithRoles.reduce((sum, user) => sum + (user.roles ? user.roles.length : 0), 0);
  const uniqueRoles = new Set();
  usersWithRoles.forEach(user => (user.roles || []).forEach(role => uniqueRoles.add(role.toUpperCase())));
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  setText('kActive', adminCount);
  setText('kSoon', uniqueRoles.size);
  setText('kInactive', Math.max(totalAssignments - adminCount, 0));
  setText('kAll', totalUsers);
}

function renderTable() {
  const tbody = document.getElementById('rows');
  if (!tbody) return;
  
  // Ensure we have a safe array to work with
  const userList = Array.isArray(usersWithRoles) ? usersWithRoles : pickArray(usersWithRoles);
  
  if (!userList.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#64748b">لا توجد بيانات</td></tr>';
    return;
  }
  
  const rowsHtml = userList.map((user, index) => {
    const roleCells = (user.roles || []).map(role => {
      const upperRole = role.toUpperCase();
      const label = ROLE_OPTIONS.find(r => r.value === upperRole)?.label || upperRole;
      const removeButton = upperRole === 'EMPLOYEE'
        ? ''
        : `<button class="btn danger" data-user="${user.id}" data-role="${upperRole}">إزالة</button>`;
      return `<div class="role-chip">${label} ${removeButton}</div>`;
    }).join('');
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${user.name || '-'}</td>
        <td>${user.email || '-'}</td>
        <td>${roleCells || 'بدون صلاحيات'}</td>
        <td>${user.employeeId || '-'}</td>
        <td>${user.isActive ? 'فعال' : 'موقوف'}</td>
        <td>${user.departmentName || '-'}</td>
        <td>${user.position || '-'}</td>
        <td><button class="btn" data-email="${user.email || ''}">تعديل</button></td>
      </tr>`;
  }).join('');
  tbody.innerHTML = rowsHtml;
  tbody.querySelectorAll('button.btn').forEach(btn => {
    if (btn.dataset.role) {
      btn.addEventListener('click', handleRemoveRoleClick);
    } else if (btn.dataset.email) {
      btn.addEventListener('click', () => prefillForm(btn.dataset.email));
    }
  });
}

async function handleRemoveRoleClick(event) {
  event.preventDefault();
  const button = event.currentTarget;
  const userId = Number(button.dataset.user);
  const role = button.dataset.role;
  if (!userId || !role) return;
  if (!confirm('إزالة هذا الدور من المستخدم؟')) return;
  try {
    setPageLoading(true);
    await apiClient.removeRole(userId, role);
    await loadRolesAndUsers();
    renderKpis();
    renderTable();
  } catch (error) {
    console.error('remove role error', error);
    alert(error.message || 'تعذر إزالة الصلاحية.');
  } finally {
    setPageLoading(false);
  }
}

function prefillForm(email) {
  const emailInput = document.getElementById('fUserEmail') || document.getElementById('fTo'); // Support both
  if (emailInput) {
    emailInput.value = email || '';
  }
  const user = emailUserMap.get((email || '').trim().toLowerCase());
  document.querySelectorAll('#scopeBox input[type="checkbox"]').forEach(input => {
    const value = input.value.toUpperCase();
    input.checked = user ? (user.roles || []).map(role => role.toUpperCase()).includes(value) : false;
  });
}
