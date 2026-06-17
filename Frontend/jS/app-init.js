const FRONTEND_BASE_PATH = '/Frontend/HTML/';

(function ensureFrontendBase() {
  if (typeof document === 'undefined') {
    return;
  }

  const existingBase = document.querySelector('base');
  if (existingBase) {
    existingBase.href = FRONTEND_BASE_PATH;
  } else {
    const baseEl = document.createElement('base');
    baseEl.href = FRONTEND_BASE_PATH;
    const head = document.head || document.getElementsByTagName('head')[0];
    if (head) {
      head.insertBefore(baseEl, head.firstChild || null);
    }
  }

  window.resolveFrontendPath = function resolveFrontendPath(relativePath = '') {
    if (!relativePath) {
      return FRONTEND_BASE_PATH;
    }

    if (/^(?:[a-z]+:)?\/\//i.test(relativePath) || relativePath.startsWith('/')) {
      return relativePath;
    }

    return `${FRONTEND_BASE_PATH}${relativePath}`;
  };
})();
/**
 * Application Initialization - Enhanced with Role-Based Permissions
 * Replaces hardcoded email system with dynamic role-based system
 */

// Load role-based permissions system
if (typeof window.rolePermissions === 'undefined') {
  // Fallback initialization if role-permissions.js not loaded yet
  console.log('⚠️ Initializing fallback role system...');
  
  // Legacy admin email check (for backward compatibility during migration)
  const legacyAdminEmails = [
    'admin@kauh.sa',
    'it@kauh.sa',
    'hr@kauh.sa'
  ];
  
  // Enhanced isAdmin function with role-based check
  window.isAdmin = function(email) {
    const user = JSON.parse(localStorage.getItem('authUser') || 'null');
    if (!user) return false;
    
    // Check new role-based system first
    if (user.roles && user.roles.includes('ADMIN')) return true;
    
    // Fallback to legacy role field
    if (user.role === 'admin') return true;
    
    // Last resort: legacy email check (deprecated)
    if (email) {
      return legacyAdminEmails.includes(email.trim().toLowerCase());
    }
    
    return false;
  };
} else {
  // Use the enhanced role system
  window.isAdmin = function(email) {
    return window.rolePermissions ? window.rolePermissions.isAdmin() : false;
  };
}

// Enhanced admin guard with role-based permissions
window.requireAdmin = function () {
  const user = JSON.parse(localStorage.getItem('authUser') || 'null');
  if (!user) { 
    window.location.href = window.resolveFrontendPath('login.html'); 
    return null; 
  }
  
  // ALWAYS use role-permissions system if available
  if (window.rolePermissions) {
    if (!window.rolePermissions.isAdmin()) {
      console.log('🚫 Access denied: User is not admin via role-permissions system');
      window.location.href = window.resolveFrontendPath('employee-dashboard.html');
      return null;
    }
  } else {
    // Fallback to legacy check only if role-permissions not available
    console.log('⚠️ Using legacy admin check - role-permissions system not available');
    if (user.role !== 'admin' && (!user.roles || !user.roles.includes('ADMIN'))) {
      window.location.href = window.resolveFrontendPath('employee-dashboard.html');
      return null;
    }
  }
  
  return user;
};

// New enhanced role checking functions
window.requireRole = function(roleName) {
  const user = JSON.parse(localStorage.getItem('authUser') || 'null');
  if (!user) { 
    window.location.href = window.resolveFrontendPath('login.html'); 
    return null; 
  }
  
  if (window.rolePermissions) {
    if (!window.rolePermissions.hasRole(roleName)) {
      window.location.href = window.resolveFrontendPath('employee-dashboard.html');
      return null;
    }
  } else {
    // Fallback check
    const userRoles = user.roles || [user.role?.toUpperCase()];
    if (!userRoles.includes(roleName.toUpperCase())) {
      window.location.href = window.resolveFrontendPath('employee-dashboard.html');
      return null;
    }
  }
  
  return user;
};

window.requireAnyRole = function(roleNames) {
  const user = JSON.parse(localStorage.getItem('authUser') || 'null');
  if (!user) { 
    window.location.href = window.resolveFrontendPath('login.html'); 
    return null; 
  }
  
  if (window.rolePermissions) {
    if (!window.rolePermissions.hasAnyRole(roleNames)) {
      window.location.href = window.resolveFrontendPath('employee-dashboard.html');
      return null;
    }
  } else {
    // Fallback check
    const userRoles = user.roles || [user.role?.toUpperCase()];
    const hasRole = roleNames.some(role => userRoles.includes(role.toUpperCase()));
    if (!hasRole) {
      window.location.href = window.resolveFrontendPath('employee-dashboard.html');
      return null;
    }
  }
  
  return user;
};

// Validate JWT token on page load (passive validation only)
async function validateTokenOnLoad() {
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('authUser');
  
  // Skip if no auth data (login page)
  if (!token || !user) {
    return;
  }
  
  // Skip validation on login page
  if (window.location.pathname.includes('login.html')) {
    return;
  }
  
  // Only validate if apiClient is ready (don't block page load)
  if (!window.apiClient) {
    console.log('⏳ Skipping token validation - apiClient not ready yet');
    return;
  }
  
  try {
    // Basic token format check (don't make API call yet - too early)
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    // Decode and check expiration (client-side only)
    try {
      const payload = JSON.parse(atob(parts[1]));
      const now = Date.now() / 1000;
      
      if (payload.exp && payload.exp < now) {
        console.warn('⚠️ Token expired:', Math.floor((now - payload.exp) / 60), 'minutes ago');
        throw new Error('Token expired');
      }
      
      console.log('✅ Token format valid (expires in', Math.floor((payload.exp - now) / 60), 'minutes)');
    } catch (decodeError) {
      // If we can't decode, let the backend handle it
      console.log('⚠️ Could not decode token, backend will validate');
    }
    
  } catch (error) {
    // Only redirect for critical errors (expired token, invalid format)
    if (error.message.includes('expired') || error.message.includes('Invalid JWT format')) {
      console.warn('⚠️ Token invalid, clearing session:', error.message);
      
      // Clear invalid session
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      
      // Redirect to login
      if (!window.location.pathname.includes('login.html')) {
        console.log('🔄 Redirecting to login page...');
        window.location.href = window.resolveFrontendPath('login.html');
      }
    } else {
      // For other errors, just log and continue
      console.log('⚠️ Token validation warning:', error.message);
    }
  }
}

// Initialize role system IMMEDIATELY when script loads (before DOM ready)
(async function initializeRolesEarly() {
  // Validate token first
  await validateTokenOnLoad();
  
  // Initialize role permissions if available
  if (window.rolePermissions) {
    await window.rolePermissions.init();
    console.log('🔥 Role-based permissions system initialized EARLY');
  } else {
    console.log('⚠️ Using legacy role system - consider loading role-permissions.js');
  }
  
  // Also initialize RoleAssignmentManager if available
  if (window.RoleAssignmentManager) {
    await window.RoleAssignmentManager.applyRolesForCurrentUser();
    console.log('🔄 Role assignments applied for current user');
  }
})();

// Initialize role system when DOM is ready (backup)
document.addEventListener('DOMContentLoaded', async function() {
  // Double-check role initialization
  if (window.rolePermissions && !window.rolePermissions.user) {
    await window.rolePermissions.init();
    console.log('🔥 Role-based permissions system re-initialized');
  }
  
  // Basic initialization only - complex loading disabled for stability
  console.log('🔧 Basic app initialization complete');
});

// Migration notice for developers
console.log('🔧 App Init: Enhanced with role-based permissions system');
console.log('⚠️ Legacy email-based checks are deprecated. Use role-based functions instead.');

// Backward compatibility warning
const legacyAdminEmails = localStorage.getItem('adminEmails');
if (legacyAdminEmails) {
  console.info('⚠️ Found legacy adminEmails in localStorage. Consider migrating to role-based system.');
  localStorage.removeItem('adminEmails');
}





