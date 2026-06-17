/**
 * Token Debugger Utility
 * Helps diagnose JWT token issues
 * 
 * Usage in browser console:
 * - window.debugToken()
 * - window.refreshToken()
 * - window.clearToken()
 */

(function() {
  'use strict';

  /**
   * Debug current token status
   */
  window.debugToken = function() {
    console.log('\n🔍 TOKEN DEBUGGER\n' + '='.repeat(60));
    
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('authUser') || 'null');
    
    if (!token) {
      console.log('❌ No token found in localStorage');
      return;
    }
    
    console.log('✅ Token exists');
    console.log('📏 Token length:', token.length);
    console.log('🔤 Token preview:', token.substring(0, 50) + '...');
    
    // Try to decode JWT (without verification)
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('\n📦 Token Payload:');
        console.log('   User ID:', payload.sub);
        console.log('   Email:', payload.email);
        console.log('   Roles:', payload.roles);
        console.log('   Type:', payload.type);
        console.log('   Issued:', new Date(payload.iat * 1000).toLocaleString());
        console.log('   Expires:', new Date(payload.exp * 1000).toLocaleString());
        
        // Check if expired
        const now = Date.now() / 1000;
        if (payload.exp < now) {
          console.log('\n❌ TOKEN EXPIRED!');
          console.log('   Expired:', Math.floor((now - payload.exp) / 60), 'minutes ago');
        } else {
          console.log('\n✅ Token valid for:', Math.floor((payload.exp - now) / 60), 'more minutes');
        }
      } else {
        console.log('❌ Invalid JWT format');
      }
    } catch (error) {
      console.log('❌ Failed to decode token:', error.message);
    }
    
    if (user) {
      console.log('\n👤 User Data:');
      console.log('   Name:', user.name);
      console.log('   Email:', user.email);
      console.log('   Roles:', user.roles);
      console.log('   Legacy Role:', user.role);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  };

  /**
   * Force refresh token
   */
  window.refreshToken = async function() {
    console.log('🔄 Forcing token refresh...');
    
    if (!window.apiClient) {
      console.error('❌ apiClient not available');
      return;
    }
    
    try {
      const response = await window.apiClient.refreshTokenAfterRoleChange();
      
      if (response?.token || response?.accessToken) {
        const newToken = response.token || response.accessToken;
        localStorage.setItem('authToken', newToken);
        
        if (response.user) {
          localStorage.setItem('authUser', JSON.stringify(response.user));
        }
        
        console.log('✅ Token refreshed successfully!');
        console.log('🔤 New token:', newToken.substring(0, 50) + '...');
        
        // Show new token info
        window.debugToken();
      } else {
        console.error('❌ No token in response');
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error.message);
    }
  };

  /**
   * Clear token and redirect to login
   */
  window.clearToken = function() {
    console.log('🗑️ Clearing token and session...');
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    
    console.log('✅ Token cleared');
    console.log('🔄 Redirecting to login...');
    
    if (window.resolveFrontendPath) {
      window.location.href = window.resolveFrontendPath('login.html');
    } else {
      window.location.href = '/Frontend/HTML/login.html';
    }
  };

  /**
   * Test token with API call
   */
  window.testToken = async function() {
    console.log('🧪 Testing token with API call...');
    
    if (!window.apiClient) {
      console.error('❌ apiClient not available');
      return;
    }
    
    try {
      const response = await window.apiClient.makeRequest('/users/me/permissions');
      
      if (response && response.success) {
        console.log('✅ Token is VALID!');
        console.log('📊 User has', response.data.permissions?.length || 0, 'permissions');
        console.log('🎭 Roles:', response.data.roles);
      } else {
        console.log('❌ Token test failed - response invalid');
      }
    } catch (error) {
      console.error('❌ Token is INVALID:', error.message);
      console.log('💡 Tip: Run window.clearToken() to logout and login again');
    }
  };

  console.log('🔧 Token Debugger loaded. Available commands:');
  console.log('   - window.debugToken()  : Show token details');
  console.log('   - window.testToken()   : Test if token works');
  console.log('   - window.refreshToken(): Force token refresh');
  console.log('   - window.clearToken()  : Clear token & logout');
})();

