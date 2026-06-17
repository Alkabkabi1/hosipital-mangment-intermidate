/**
 * Permission Configuration Manager
 * Allows admins to configure role-permission mappings via UI
 */

class PermissionConfigManager {
  constructor() {
    this.apiClient = window.apiClient;
    this.roles = [];
    this.permissions = [];
    this.rolePermissions = {}; // roleId -> Set of permissionIds
    this.originalPermissions = {}; // For tracking changes
    this.selectedRole = null;
    this.changes = new Set(); // Track changed roles

    this.init();
  }

  async init() {
    try {
      this.showLoading(true);
      
      // Load roles and permissions
      await Promise.all([
        this.loadRoles(),
        this.loadPermissions()
      ]);

      // Render UI
      this.renderRoleSelector();
      
      // Select first role by default
      if (this.roles.length > 0) {
        this.selectRole(this.roles[0].role_id);
      }

      this.showLoading(false);
    } catch (error) {
      console.error('Failed to initialize permission config:', error);
      alert('⚠️ فشل في تحميل البيانات: ' + error.message);
      this.showLoading(false);
    }
  }

  async loadRoles() {
    try {
      const response = await this.apiClient.makeRequest('/roles');
      if (response && response.success) {
        this.roles = response.data || response.roles || [];
        console.log(`✅ Loaded ${this.roles.length} roles`);
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
      throw error;
    }
  }

  async loadPermissions() {
    try {
      const response = await this.apiClient.makeRequest('/permissions/by-resource');
      if (response && response.success) {
        this.permissions = response.data.permissions || {};
        
        // Calculate total permissions
        let total = 0;
        for (const resource in this.permissions) {
          total += this.permissions[resource].length;
        }
        
        document.getElementById('totalPermissions').textContent = total;
        console.log(`✅ Loaded ${total} permissions across ${Object.keys(this.permissions).length} resources`);
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
      throw error;
    }
  }

  async loadRolePermissions(roleId) {
    try {
      const response = await this.apiClient.makeRequest(`/permissions/roles/${roleId}`);
      if (response && response.success) {
        const permissionNames = response.data.permissions || [];
        
        // Convert permission names to IDs
        const permissionIds = new Set();
        for (const resource in this.permissions) {
          for (const perm of this.permissions[resource]) {
            if (permissionNames.includes(perm.permission_name)) {
              permissionIds.add(perm.permission_id);
            }
          }
        }
        
        this.rolePermissions[roleId] = permissionIds;
        
        // Store original for change tracking
        if (!this.originalPermissions[roleId]) {
          this.originalPermissions[roleId] = new Set(permissionIds);
        }
        
        console.log(`✅ Loaded ${permissionIds.size} permissions for role ${roleId}`);
        return permissionIds;
      }
    } catch (error) {
      console.error(`Failed to load permissions for role ${roleId}:`, error);
      return new Set();
    }
  }

  renderRoleSelector() {
    const selector = document.getElementById('roleSelector');
    selector.innerHTML = '';

    this.roles.forEach(role => {
      const chip = document.createElement('div');
      chip.className = 'role-chip';
      chip.textContent = role.role_name;
      chip.dataset.roleId = role.role_id;
      chip.onclick = () => this.selectRole(role.role_id);
      selector.appendChild(chip);
    });
  }

  async selectRole(roleId) {
    this.showLoading(true);
    this.selectedRole = roleId;

    // Update UI
    document.querySelectorAll('.role-chip').forEach(chip => {
      chip.classList.toggle('active', parseInt(chip.dataset.roleId) === roleId);
    });

    // Load role permissions if not loaded
    if (!this.rolePermissions[roleId]) {
      await this.loadRolePermissions(roleId);
    }

    // Render permissions
    this.renderPermissions();
    this.updateStats();
    this.showLoading(false);
  }

  renderPermissions() {
    const grid = document.getElementById('permissionsGrid');
    grid.innerHTML = '';

    // Get resource names in Arabic
    const resourceNames = {
      'clearance': 'إخلاء الطرف',
      'delegation': 'التفويض',
      'onboarding': 'التوظيف',
      'employee': 'الموظفين',
      'role': 'الأدوار',
      'system': 'النظام'
    };

    const actionNames = {
      'read': 'عرض',
      'create': 'إنشاء',
      'update': 'تعديل',
      'delete': 'حذف',
      'approve': 'موافقة',
      'reject': 'رفض',
      'manage': 'إدارة',
      'view_all': 'عرض الكل',
      'view_own': 'عرض الخاص',
      'assign': 'تعيين',
      'configure': 'تكوين'
    };

    for (const resource in this.permissions) {
      const card = document.createElement('div');
      card.className = 'resource-card';

      // Header
      const header = document.createElement('div');
      header.className = 'resource-header';

      const title = document.createElement('div');
      title.className = 'resource-title';
      title.textContent = resourceNames[resource] || resource;

      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'select-all-toggle';
      toggleBtn.textContent = 'تحديد الكل';
      toggleBtn.onclick = () => this.toggleAllInResource(resource);

      header.appendChild(title);
      header.appendChild(toggleBtn);
      card.appendChild(header);

      // Permissions
      this.permissions[resource].forEach(perm => {
        const item = document.createElement('div');
        item.className = 'permission-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'permission-checkbox';
        checkbox.id = `perm_${perm.permission_id}`;
        checkbox.checked = this.rolePermissions[this.selectedRole]?.has(perm.permission_id) || false;
        checkbox.onchange = () => this.togglePermission(perm.permission_id);

        const label = document.createElement('label');
        label.className = 'permission-label';
        label.htmlFor = checkbox.id;

        const nameDiv = document.createElement('div');
        nameDiv.className = 'permission-name';
        nameDiv.textContent = actionNames[perm.action] || perm.action;

        const descDiv = document.createElement('div');
        descDiv.className = 'permission-desc';
        descDiv.textContent = perm.description || perm.permission_name;

        label.appendChild(nameDiv);
        label.appendChild(descDiv);

        const badge = document.createElement('span');
        badge.className = `action-badge action-${perm.action}`;
        badge.textContent = perm.action;

        // Add edit/delete actions
        const actions = document.createElement('div');
        actions.className = 'perm-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = '✏️';
        editBtn.title = 'تعديل';
        editBtn.onclick = (e) => {
          e.stopPropagation();
          this.openEditModal(perm);
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'حذف';
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          this.deletePermissionConfirm(perm);
        };

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        item.appendChild(checkbox);
        item.appendChild(label);
        item.appendChild(badge);
        item.appendChild(actions);
        card.appendChild(item);
      });

      grid.appendChild(card);
    }
  }

  async createPermission(permissionData) {
    try {
      const response = await this.apiClient.makeRequest('/permissions', {
        method: 'POST',
        body: JSON.stringify(permissionData)
      });

      if (response && response.success) {
        console.log('✅ Permission created:', response.data.permissionId);
        // Reload permissions
        await this.loadPermissions();
        this.renderPermissions();
        return response.data.permissionId;
      }
    } catch (error) {
      console.error('Failed to create permission:', error);
      throw error;
    }
  }

  async updatePermission(permissionId, updates) {
    try {
      const response = await this.apiClient.makeRequest(`/permissions/${permissionId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });

      if (response && response.success) {
        console.log('✅ Permission updated:', permissionId);
        // Reload permissions
        await this.loadPermissions();
        this.renderPermissions();
      }
    } catch (error) {
      console.error('Failed to update permission:', error);
      throw error;
    }
  }

  async deletePermissionConfirm(perm) {
    if (!confirm(`هل تريد حذف الصلاحية "${perm.permission_name}"؟\n\nسيتم إلغاء تفعيل هذه الصلاحية من جميع الأدوار.`)) {
      return;
    }

    try {
      this.showLoading(true);
      await this.apiClient.makeRequest(`/permissions/${perm.permission_id}`, {
        method: 'DELETE'
      });

      alert('✅ تم حذف الصلاحية بنجاح');
      
      // Reload permissions
      await this.loadPermissions();
      this.renderPermissions();
      this.showLoading(false);
    } catch (error) {
      console.error('Failed to delete permission:', error);
      alert('⚠️ فشل حذف الصلاحية: ' + error.message);
      this.showLoading(false);
    }
  }

  openEditModal(perm) {
    document.getElementById('modalTitle').textContent = 'تعديل الصلاحية';
    document.getElementById('editPermissionId').value = perm.permission_id;
    document.getElementById('permResource').value = perm.resource;
    document.getElementById('permAction').value = perm.action;
    document.getElementById('permName').value = perm.permission_name;
    document.getElementById('permDescription').value = perm.description || '';
    document.getElementById('submitBtn').textContent = 'حفظ التعديلات';
    
    // Disable resource and action for editing (can't change permission_name structure)
    document.getElementById('permResource').disabled = true;
    document.getElementById('permAction').disabled = true;
    
    document.getElementById('permissionModal').style.display = 'block';
  }

  togglePermission(permissionId) {
    if (!this.rolePermissions[this.selectedRole]) {
      this.rolePermissions[this.selectedRole] = new Set();
    }

    const permissions = this.rolePermissions[this.selectedRole];
    if (permissions.has(permissionId)) {
      permissions.delete(permissionId);
    } else {
      permissions.add(permissionId);
    }

    this.changes.add(this.selectedRole);
    this.updateStats();
  }

  toggleAllInResource(resource) {
    if (!this.rolePermissions[this.selectedRole]) {
      this.rolePermissions[this.selectedRole] = new Set();
    }

    const permissions = this.rolePermissions[this.selectedRole];
    const resourcePerms = this.permissions[resource];
    
    // Check if all are selected
    const allSelected = resourcePerms.every(p => permissions.has(p.permission_id));

    resourcePerms.forEach(perm => {
      if (allSelected) {
        permissions.delete(perm.permission_id);
      } else {
        permissions.add(perm.permission_id);
      }
    });

    this.changes.add(this.selectedRole);
    this.renderPermissions();
    this.updateStats();
  }

  updateStats() {
    const selected = this.rolePermissions[this.selectedRole]?.size || 0;
    document.getElementById('selectedPermissions').textContent = selected;
    document.getElementById('changesCount').textContent = this.changes.size;

    const saveBtn = document.getElementById('saveButton');
    saveBtn.disabled = this.changes.size === 0;
  }

  async saveChanges() {
    if (this.changes.size === 0) return;

    if (!confirm(`هل تريد حفظ التغييرات لـ ${this.changes.size} دور؟`)) {
      return;
    }

    this.showLoading(true);
    const saveBtn = document.getElementById('saveButton');
    saveBtn.disabled = true;

    let successCount = 0;
    let failCount = 0;

    for (const roleId of this.changes) {
      try {
        await this.saveRolePermissions(roleId);
        successCount++;
      } catch (error) {
        console.error(`Failed to save permissions for role ${roleId}:`, error);
        failCount++;
      }
    }

    this.showLoading(false);

    if (failCount === 0) {
      alert(`✅ تم حفظ التغييرات بنجاح لـ ${successCount} دور`);
      this.changes.clear();
      
      // Update original permissions
      for (const roleId in this.rolePermissions) {
        this.originalPermissions[roleId] = new Set(this.rolePermissions[roleId]);
      }
      
      this.updateStats();
    } else {
      alert(`⚠️ تم حفظ ${successCount} دور بنجاح، فشل ${failCount} دور`);
    }
  }

  async saveRolePermissions(roleId) {
    const currentPerms = this.rolePermissions[roleId];
    const originalPerms = this.originalPermissions[roleId] || new Set();

    // Find permissions to add and remove
    const toAdd = [...currentPerms].filter(p => !originalPerms.has(p));
    const toRemove = [...originalPerms].filter(p => !currentPerms.has(p));

    // Add new permissions
    for (const permId of toAdd) {
      await this.apiClient.makeRequest(`/permissions/roles/${roleId}`, {
        method: 'POST',
        body: JSON.stringify({ permissionId: permId })
      });
    }

    // Remove permissions
    for (const permId of toRemove) {
      await this.apiClient.makeRequest(`/permissions/roles/${roleId}/${permId}`, {
        method: 'DELETE'
      });
    }

    console.log(`✅ Saved permissions for role ${roleId}: +${toAdd.length}, -${toRemove.length}`);
  }

  showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
  }
}

// Initialize on page load
let permissionConfigManager;
document.addEventListener('DOMContentLoaded', () => {
  permissionConfigManager = new PermissionConfigManager();
  
  // Auto-generate permission name when resource or action changes
  document.getElementById('permResource').addEventListener('change', updatePermissionName);
  document.getElementById('permAction').addEventListener('change', updatePermissionName);
  
  // Handle form submission
  document.getElementById('permissionForm').addEventListener('submit', handlePermissionSubmit);
});

// Global function for save button
function saveChanges() {
  if (permissionConfigManager) {
    permissionConfigManager.saveChanges();
  }
}

// Global functions for modal
function openCreateModal() {
  document.getElementById('modalTitle').textContent = 'إنشاء صلاحية جديدة';
  document.getElementById('permissionForm').reset();
  document.getElementById('editPermissionId').value = '';
  document.getElementById('submitBtn').textContent = 'إنشاء';
  
  // Enable resource and action for creation
  document.getElementById('permResource').disabled = false;
  document.getElementById('permAction').disabled = false;
  
  document.getElementById('permissionModal').style.display = 'block';
}

function closePermissionModal() {
  document.getElementById('permissionModal').style.display = 'none';
  document.getElementById('permissionForm').reset();
}

function updatePermissionName() {
  const resource = document.getElementById('permResource').value;
  const action = document.getElementById('permAction').value;
  
  if (resource && action) {
    document.getElementById('permName').value = `${resource}:${action}`;
  } else {
    document.getElementById('permName').value = '';
  }
}

async function handlePermissionSubmit(e) {
  e.preventDefault();
  
  if (!permissionConfigManager) return;
  
  const editId = document.getElementById('editPermissionId').value;
  const resource = document.getElementById('permResource').value;
  const action = document.getElementById('permAction').value;
  const description = document.getElementById('permDescription').value;
  
  const permissionName = `${resource}:${action}`;
  
  try {
    permissionConfigManager.showLoading(true);
    
    if (editId) {
      // Update existing permission
      await permissionConfigManager.updatePermission(parseInt(editId), {
        description: description || null
      });
      alert('✅ تم تحديث الصلاحية بنجاح');
    } else {
      // Create new permission
      await permissionConfigManager.createPermission({
        permission_name: permissionName,
        resource,
        action,
        description: description || undefined
      });
      alert('✅ تم إنشاء الصلاحية بنجاح');
    }
    
    closePermissionModal();
    permissionConfigManager.showLoading(false);
  } catch (error) {
    console.error('Permission operation failed:', error);
    alert('⚠️ فشلت العملية: ' + (error.message || 'حدث خطأ'));
    permissionConfigManager.showLoading(false);
  }
}

// Close modal on outside click
window.onclick = function(event) {
  const modal = document.getElementById('permissionModal');
  if (event.target === modal) {
    closePermissionModal();
  }
}

