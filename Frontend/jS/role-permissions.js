/**
 * Role-Based Permissions System for Frontend
 * Replaces hardcoded email checks with dynamic role-based permissions
 * صلاحيات System - Frontend Implementation
 */

/**
 * Role-based permission checker
 * Replaces the old DEPARTMENT_ADMINS hardcoded email system
 */
class RolePermissions {
  constructor() {
    this.user = null;
    this.roles = [];
    this.permissions = [];
    this.init();
  }

  /**
   * Initialize the role system with current user data
   */
  async init() {
    try {
      const userStr = localStorage.getItem('authUser');
      this.user = (userStr && userStr !== 'undefined' && userStr !== 'null') 
        ? JSON.parse(userStr) 
        : null;
      if (this.user) {
        this.roles = this.user.roles || [this.user.role?.toUpperCase()] || ['EMPLOYEE'];
        this.permissions = this.user.permissions || [];
        
        // Try to load permissions from API if not in user object
        if (this.permissions.length === 0) {
          await this.loadPermissionsFromAPI();
        }
        
        // Debug logging
        console.log('🔄 Role Permissions Initialized:');
        console.log('User:', this.user.name, '(' + this.user.email + ')');
        console.log('Legacy Role:', this.user.role);
        console.log('Dynamic Roles:', this.user.roles);
        console.log('Processed Roles:', this.roles);
        console.log('Permissions:', this.permissions?.length || 0, 'permissions loaded');
      } else {
        console.log('⚠️ No user data found in localStorage');
      }
    } catch (error) {
      console.error('❌ Error initializing role permissions:', error);
      this.user = null;
      this.roles = [];
      this.permissions = [];
    }
  }

  async loadPermissionsFromAPI() {
    try {
      if (window.apiClient) {
        // Try the new permissions endpoint
        const permissionsResponse = await window.apiClient.makeRequest('/users/me/permissions');
        if (permissionsResponse && permissionsResponse.success && permissionsResponse.data) {
          const { roles, permissions } = permissionsResponse.data;
          
          // Update roles if provided
          if (roles && Array.isArray(roles)) {
            this.roles = roles;
            // Update user object
            if (this.user) {
              this.user.roles = roles;
              localStorage.setItem('authUser', JSON.stringify(this.user));
            }
          }
          
          // Update permissions
          if (permissions && Array.isArray(permissions)) {
            this.permissions = permissions;
            console.log('✅ Loaded', permissions.length, 'permissions from /api/users/me/permissions');
            return;
          }
        }

        // Fallback: Try to get user profile which might include permissions
        const profile = await window.apiClient.getProfile();
        if (profile && profile.permissions) {
          this.permissions = profile.permissions;
          console.log('✅ Loaded permissions from profile API:', this.permissions.length);
          return;
        }
      }

      // Generate default permissions based on roles
      console.log('⚠️ No permissions from API, generating defaults');
      this.generateDefaultPermissions();
    } catch (error) {
      console.warn('Failed to load permissions from API, using defaults:', error);
      this.generateDefaultPermissions();
    }
  }

  generateDefaultPermissions() {
    const defaultPerms = [];
    
    // Generate permissions based on roles
    this.roles.forEach(role => {
      switch (role.toUpperCase()) {
        case 'ADMIN':
          defaultPerms.push(
            'user:manage', 'role:assign', 'system:configure',
            'request:approve', 'request:reject', 'request:view_all',
            'clearance:approve', 'delegation:approve', 'onboarding:approve',
            'employee:manage', 'department:manage'
          );
          break;
        case 'MANAGER':
          defaultPerms.push(
            'request:approve', 'request:view_department',
            'employee:view_department', 'delegation:approve'
          );
          break;
        case 'HR':
          defaultPerms.push(
            'employee:manage', 'onboarding:approve', 'clearance:approve'
          );
          break;
        case 'FINANCE':
          defaultPerms.push(
            'clearance:approve', 'request:view_department'
          );
          break;
        case 'IT':
          defaultPerms.push(
            'system:configure', 'user:manage'
          );
          break;
        default:
          defaultPerms.push(
            'request:create', 'request:view_own', 'profile:edit'
          );
      }
    });

    this.permissions = [...new Set(defaultPerms)]; // Remove duplicates
    console.log('🔧 Generated default permissions:', this.permissions.length);
  }

  /**
   * Check if user has specific role
   * @param {string} roleName - Role name to check (case insensitive)
   * @returns {boolean} True if user has the role
   */
  hasRole(roleName) {
    if (!this.user || !roleName) return false;
    return this.roles.includes(roleName.toUpperCase());
  }

  /**
   * Check if user has any of the specified roles
   * @param {Array<string>} roleNames - Array of role names to check
   * @returns {boolean} True if user has any of the roles
   */
  hasAnyRole(roleNames) {
    if (!this.user || !Array.isArray(roleNames)) return false;
    return roleNames.some(role => this.hasRole(role));
  }

  /**
   * Check if user is admin (backward compatibility)
   * @returns {boolean} True if user has admin role
   */
  isAdmin() {
    return this.hasRole('ADMIN') || this.user?.role === 'admin';
  }

  /**
   * Check if user has HR permissions
   * @returns {boolean} True if user has HR or ADMIN role
   */
  isHR() {
    return this.hasAnyRole(['HR', 'ADMIN']);
  }

  /**
   * Check if user has IT permissions
   * @returns {boolean} True if user has IT or ADMIN role
   */
  isIT() {
    return this.hasAnyRole(['IT', 'ADMIN']);
  }

  /**
   * Check if user has Finance permissions
   * @returns {boolean} True if user has FINANCE or ADMIN role
   */
  isFinance() {
    return this.hasAnyRole(['FINANCE', 'ADMIN']);
  }

  /**
   * Check if user has CEO permissions
   * @returns {boolean} True if user has CEO or ADMIN role
   */
  isCEO() {
    return this.hasAnyRole(['CEO', 'ADMIN']);
  }

  /**
   * Check if user has Manager permissions
   * @returns {boolean} True if user has MANAGER or ADMIN role
   */
  isManager() {
    return this.hasAnyRole(['MANAGER', 'ADMIN']);
  }

  /**
   * Enhanced department access check
   * Replaces the old isDepartmentAdmin function
   * @param {string} department - Department name in Arabic
   * @returns {boolean} True if user has access to the department
   */
  canAccessDepartment(department) {
    if (!this.user) return false;

    // Always allow admin access
    if (this.isAdmin()) return true;

    // Map Arabic department names to required roles
    const departmentRoleMap = {
      'الموارد البشرية': ['HR'],
      'المالية': ['FINANCE'],
      'تقنية المعلومات': ['IT'],
      'الإدارة': ['CEO', 'MANAGER']
    };

    const requiredRoles = departmentRoleMap[department] || [];
    return this.hasAnyRole(requiredRoles);
  }

  /**
   * Enhanced admin page access check
   * Replaces the old canAccessAdminPage function
   * @param {string} pageType - Optional page type for specific checks
   * @returns {boolean} True if user can access admin pages
   */
  canAccessAdminPage(pageType = null) {
    if (!this.user) return false;

    // System admin always has access
    if (this.isAdmin()) return true;

    // Check specific page types
    switch (pageType) {
      case 'hr':
      case 'clearance':
      case 'onboarding':
        return this.isHR();
      
      case 'it':
        return this.isIT();
      
      case 'finance':
        return this.isFinance();
      
      case 'ceo':
      case 'executive':
        return this.isCEO();
      
      case 'manager':
      case 'delegation':
        return this.isManager();
      
      default:
        // For general admin pages, check if user has any admin-level role
        return this.hasAnyRole(['ADMIN', 'HR', 'IT', 'FINANCE', 'CEO', 'MANAGER']);
    }
  }

  /**
   * Get user's role display names in Arabic
   * @returns {Array<string>} Array of Arabic role names
   */
  getRoleNamesAr() {
    if (!this.user || !this.user.roles_ar) {
      // Fallback to legacy role translation
      const roleTranslations = {
        'admin': 'مدير النظام',
        'hr': 'الموارد البشرية',
        'manager': 'مدير',
        'employee': 'موظف'
      };
      return [roleTranslations[this.user?.role] || 'موظف'];
    }
    return this.user.roles_ar;
  }

  /**
   * Get user's role display names in English
   * @returns {Array<string>} Array of English role names
   */
  getRoleNames() {
    return this.roles;
  }

  /**
   * Check if user can approve specific request type
   * @param {string} requestType - Type of request ('clearance', 'onboarding', 'delegation')
   * @returns {boolean} True if user can approve this request type
   */
  canApprove(requestType) {
    if (!this.user) return false;

    // Admin can approve everything
    if (this.isAdmin()) return true;

    switch (requestType) {
      case 'clearance':
      case 'onboarding':
        return this.isHR();
      
      case 'delegation':
        return this.hasAnyRole(['MANAGER', 'CEO']);
      
      default:
        return false;
    }
  }

  /**
   * Refresh user roles and permissions from server
   * @returns {Promise<void>} Promise that resolves when roles are refreshed
   */
  async refreshRoles() {
    try {
      if (!this.user) return;

      // STEP 1: Refresh JWT token to get updated roles in the token itself
      if (window.apiClient) {
        try {
          console.log('🔄 Refreshing JWT token with updated roles...');
          const tokenResponse = await window.apiClient.refreshTokenAfterRoleChange();
          
          if (tokenResponse?.token || tokenResponse?.accessToken) {
            const newToken = tokenResponse.token || tokenResponse.accessToken;
            
            // Update the token in localStorage
            localStorage.setItem('authToken', newToken);
            
            // Update user data if provided
            if (tokenResponse.user) {
              this.user = { ...this.user, ...tokenResponse.user };
              this.roles = tokenResponse.user.roles || this.roles;
              localStorage.setItem('authUser', JSON.stringify(this.user));
            }
            
            console.log('✅ JWT token refreshed successfully with new roles:', this.roles);
          }
        } catch (tokenError) {
          console.warn('⚠️ Token refresh failed, continuing with permissions update:', tokenError.message);
          // Continue to permissions update even if token refresh fails
        }
      }

      // STEP 2: Fetch updated permissions from the server
      if (window.apiClient) {
        // Use the new permissions endpoint
        const permissionsResponse = await window.apiClient.makeRequest('/users/me/permissions');
        if (permissionsResponse && permissionsResponse.success && permissionsResponse.data) {
          const { roles, permissions } = permissionsResponse.data;
          
          // Update user object
          if (roles && Array.isArray(roles)) {
            this.user.roles = roles;
            this.roles = roles;
          }
          
          if (permissions && Array.isArray(permissions)) {
            this.user.permissions = permissions;
            this.permissions = permissions;
          }
          
          // Update localStorage
          localStorage.setItem('authUser', JSON.stringify(this.user));
          console.log('✅ Refreshed roles and permissions:', { roles: this.roles, permissions: this.permissions.length });
          
          // Show a toast notification to the user
          if (window.NotificationStore && typeof window.NotificationStore.showToast === 'function') {
            window.NotificationStore.showToast(
              'تم تحديث صلاحياتك',
              'تم تحديث أدوارك وصلاحياتك في النظام بنجاح',
              'success'
            );
          }
          
          return;
        }
      }

      // Fallback to old method
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/roles/user/' + this.user.id, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update user object with new roles
          this.user.roles = data.roles.map(r => r.role_name);
          this.user.roles_ar = data.roles.map(r => r.role_name_ar);
          this.roles = this.user.roles;
          
          // Update localStorage
          localStorage.setItem('authUser', JSON.stringify(this.user));
          
          // Reload permissions
          await this.loadPermissionsFromAPI();
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing user roles:', error);
      
      // Show error toast
      if (window.NotificationStore && typeof window.NotificationStore.showToast === 'function') {
        window.NotificationStore.showToast(
          'فشل تحديث الصلاحيات',
          'حدث خطأ أثناء تحديث صلاحياتك. يرجى تحديث الصفحة.',
          'error'
        );
      }
    }
  }

  /**
   * Debug method to log current user roles
   */
  debugRoles() {
    console.log('🔐 Role Permissions Debug:');
    console.log('User:', this.user?.name, '(' + this.user?.email + ')');
    console.log('Roles:', this.roles);
    console.log('Roles (Arabic):', this.getRoleNamesAr());
    console.log('Is Admin:', this.isAdmin());
    console.log('Is HR:', this.isHR());
    console.log('Is IT:', this.isIT());
    console.log('Is Finance:', this.isFinance());
    console.log('Is CEO:', this.isCEO());
    console.log('Is Manager:', this.isManager());
  }
}

// Create global instance
window.rolePermissions = new RolePermissions();

// Backward compatibility functions that replace the old hardcoded system
window.isAdmin = function(email) {
  // Legacy function - now uses role-based check instead of email
  return window.rolePermissions.isAdmin();
};

window.isDepartmentAdmin = function(userEmail) {
  // Legacy function - now uses role-based check instead of email
  return window.rolePermissions.hasAnyRole(['HR', 'IT', 'FINANCE', 'CEO', 'MANAGER']);
};

window.canAccessAdminPage = function(user) {
  // Legacy function - now uses role-based check
  if (!user) user = window.rolePermissions.user;
  return window.rolePermissions.canAccessAdminPage();
};

window.requireAdmin = function() {
  // Legacy function - enhanced with role-based check
  const user = window.rolePermissions.user;
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  if (!window.rolePermissions.isAdmin()) {
    window.location.href = window.resolveFrontendPath('employee-dashboard.html');
    return null;
  }
  return user;
};

// Enhanced function for specific admin requirements
window.requireRole = function(roleName) {
  const user = window.rolePermissions.user;
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  if (!window.rolePermissions.hasRole(roleName)) {
    window.location.href = window.resolveFrontendPath('employee-dashboard.html');
    return null;
  }
  return user;
};

// Enhanced function for multiple role requirements
window.requireAnyRole = function(roleNames) {
  const user = window.rolePermissions.user;
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  if (!window.rolePermissions.hasAnyRole(roleNames)) {
    window.location.href = window.resolveFrontendPath('employee-dashboard.html');
    return null;
  }
  return user;
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RolePermissions;
}
