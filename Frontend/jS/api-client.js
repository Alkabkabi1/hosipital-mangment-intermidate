// API Client for Hospital Management System
// Handles all HTTP requests to the backend API

class APIClient {
  constructor() {
    // Dynamically determine the base URL based on current hostname and port
    this.baseURL = this.getBaseURL();
    this.token = localStorage.getItem('authToken');
    this.refreshTimer = null;
    
    // Start proactive token refresh if user is already logged in
    if (this.token && localStorage.getItem('refreshToken')) {
      this.startTokenRefreshTimer();
    }
  }

  // Determine the correct base URL based on current environment
  getBaseURL() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = '3037'; // Backend always runs on 3037
    
    // Use the same hostname as the frontend, but always port 3037 for API
    return `${protocol}//${hostname}:${port}/api`;
  }

  // Helper method to get headers with smart Content-Type handling
  getHeaders(includeAuth = true, isFormData = false) {
    const headers = {};

    // Only set Content-Type for JSON requests, let browser set it for FormData
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Helper method to handle responses
  async handleResponse(response) {
    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    let data = null;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const raw = await response.text();
      data = raw ? { message: raw } : null;
    }

    if (!response.ok) {
      const errorMessage = (data && (data.error || data.message)) || response.statusText || 'طلب فشل، حاول لاحقاً';
      const error = new Error(errorMessage);
      error.status = response.status;
      error.response = { status: response.status, data };
      throw error;
    }

    if (data && Object.prototype.hasOwnProperty.call(data, 'success') && data.success === false) {
      throw new Error(data.message || 'حدث خطأ أثناء العملية');
    }

    return data;
  }

  // Helper method to make requests with automatic token refresh
  async makeRequest(endpoint, options = {}, isRetry = false) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      // Detect if body is FormData for proper header handling
      const isFormData = options.body instanceof FormData;
      
      const config = {
        ...options,
        headers: {
          ...this.getHeaders(true, isFormData),
          ...options.headers
        }
      };

      const response = await fetch(url, config);
      
      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && !isRetry && endpoint !== '/auth/login') {
        // Token expired or invalid - attempt silent refresh
        const refreshSuccess = await this.refreshToken();
        if (refreshSuccess) {
          console.log('🔄 Token refreshed silently, retrying request...');
          // Retry the original request with new token
          return await this.makeRequest(endpoint, options, true);
        } else {
          console.log('❌ Token refresh failed, redirecting to login...');
          this.handleAuthFailure();
          throw new Error('جلسة العمل انتهت، يرجى تسجيل الدخول مرة أخرى');
        }
      }
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Update token when user logs in
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
    
    // Only start proactive token refresh if not already running
    if (token && localStorage.getItem('refreshToken') && !this.refreshTimer) {
      this.startTokenRefreshTimer();
    }
  }

  // Clear token when user logs out
  clearToken() {
    // Stop the proactive refresh timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    this.token = null;
    localStorage.clear(); // Clear everything
    console.log('🚪 Logged out - localStorage cleared');
  }

  // Start proactive token refresh timer
  // Refreshes token every 12 minutes (before 15min expiry)
  startTokenRefreshTimer() {
    // Clear existing timer if any
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    console.log('⏱️ Starting proactive token refresh (every 12 minutes)');
    
    // Refresh token every 12 minutes (before 15min expiry)
    this.refreshTimer = setInterval(async () => {
      const token = localStorage.getItem('authToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (token && refreshToken) {
        console.log('🔄 Proactively refreshing token (before expiry)...');
        const success = await this.refreshToken();
        if (!success) {
          console.log('⚠️ Proactive refresh failed - token may have been revoked');
          // Stop the timer if refresh fails
          this.stopTokenRefreshTimer();
        }
      } else {
        // No tokens available, stop the timer
        this.stopTokenRefreshTimer();
      }
    }, 12 * 60 * 1000); // 12 minutes in milliseconds
  }

  // Stop the proactive token refresh timer
  stopTokenRefreshTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      console.log('⏹️ Stopped proactive token refresh');
    }
  }

  // Refresh access token using refresh token
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.log('❌ No refresh token available');
        return false;
      }

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.accessToken) {
          this.setToken(data.data.accessToken);
          // Update refresh token if provided
          if (data.data.refreshToken) {
            localStorage.setItem('refreshToken', data.data.refreshToken);
          }
          console.log('✅ Token refresh successful');
          return true;
        }
      }

      console.log('❌ Token refresh failed');
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  // Handle authentication failure
  handleAuthFailure() {
    this.clearToken();
    
    // Show user-friendly message
    if (window.showError) {
      window.showError('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
    }
    
    // Redirect to login after a short delay
    setTimeout(() => {
      if (window.resolveFrontendPath) {
        window.location.href = window.resolveFrontendPath('login.html');
      } else {
        window.location.href = window.resolveFrontendPath ? window.resolveFrontendPath('login.html') : 'login.html';
      }
    }, 2000);
  }

  // =====================================================
  // AUTHENTICATION ENDPOINTS
  // =====================================================

  async login(email, password) {
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ 
        identifier: email,  // Backend expects 'identifier' field
        email: email,       // Keep email for backward compatibility
        password: password 
      })
    });

    // Handle backend response structure: { success, data: { accessToken, refreshToken, user } }
    if (response.success && response.data) {
      const { accessToken, refreshToken, user } = response.data;
      
      // Store both tokens
      this.setToken(accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('authUser', JSON.stringify(user));
      
      console.log('✅ Login successful - tokens stored');
    } else if (response.data && response.data.token) {
      // Fallback for legacy token structure
      this.setToken(response.data.token);
      localStorage.setItem('authUser', JSON.stringify(response.data.user));
      console.log('⚠️ Using legacy token structure');
    }

    return response;
  }

  async register(userData) {
    return await this.makeRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async logout() {
    this.clearToken();
    return { success: true };
  }

  // =====================================================
  // PROFILE ENDPOINTS
  // =====================================================

  async getProfile() {
    console.log('🔄 API: Fetching enhanced profile data...');
    const profile = await this.makeRequest('/profile/me');
    console.log('📋 API: Profile response:', profile);
    return profile;
  }

  async updateProfile(profileData) {
    return await this.makeRequest('/profile/me', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  // =====================================================
  // CLEARANCE ENDPOINTS
  // =====================================================

  async createClearance(clearanceData) {
    // Align with employee requests endpoint expected by the inline script
    return await this.makeRequest('/employee/requests/clearance', {
      method: 'POST',
      body: JSON.stringify(clearanceData)
    });
  }

  async getMyClearances() {
    try {
      // Try new unified API first
      return await this.makeRequest('/employee/clearances');
    } catch (error) {
      try {
        // Fallback to old API
        return await this.makeRequest('/clearance/mine');
      } catch (fallbackError) {
        console.error('Failed to fetch clearances:', fallbackError);
        throw fallbackError;
      }
    }
  }

  async getClearanceById(id) {
    // Use correct API endpoint for clearance requests
    const response = await this.makeRequest(`/clearance/${id}`);
    return response.data || response;
  }

  async addClearanceSignature(id, signatureData) {
    return await this.makeRequest(`/clearance/${id}/signatures`, {
      method: 'POST',
      body: JSON.stringify(signatureData)
    });
  }

  // Admin clearance endpoints
  async getAllClearances() {
    return await this.makeRequest('/clearance/admin/all');
  }

  async getPendingClearances() {
    return await this.makeRequest('/clearance/admin/pending');
  }

  async updateClearanceStatus(id, status) {
    return await this.makeRequest(`/clearance/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  // =====================================================
  // ONBOARDING ENDPOINTS
  // =====================================================

  async createOnboarding(onboardingData) {
    return await this.makeRequest('/onboarding', {
      method: 'POST',
      body: JSON.stringify(onboardingData)
    });
  }

  async getMyOnboardings() {
    try {
      // Try new unified API first
      return await this.makeRequest('/employee/onboardings');
    } catch (error) {
      try {
        // Fallback to old API
        return await this.makeRequest('/onboarding/mine');
      } catch (fallbackError) {
        console.error('Failed to fetch onboardings:', fallbackError);
        throw fallbackError;
      }
    }
  }

  async getOnboardingById(id) {
    // Use correct API endpoint for onboarding requests
    const response = await this.makeRequest(`/onboarding/${id}`);
    return response.data || response;
  }

  async updateOnboardingStatus(id, status) {
    return await this.makeRequest(`/onboarding/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async addOnboardingSignature(id, signatureData) {
    return await this.makeRequest(`/onboarding/${id}/signatures`, {
      method: 'POST',
      body: JSON.stringify(signatureData)
    });
  }

  async getAllOnboardings() {
    return await this.makeRequest('/onboarding/admin/all');
  }

  async getPendingOnboardings() {
    return await this.makeRequest('/onboarding/admin/pending');
  }

  // =====================================================
  // DELEGATION ENDPOINTS
  // =====================================================


  // =====================================================

  async createDelegation(delegationData) {
    return await this.makeRequest('/delegation', {
      method: 'POST',
      body: JSON.stringify(delegationData)
    });
  }

  async getMyDelegations() {
    try {
      // Use the correct delegation endpoint
      return await this.makeRequest('/delegation/mine');
    } catch (error) {
      console.error('Failed to fetch delegations:', error);
      throw error;
    }
  }

  async getMyCertificates() {
    try {
      // Use the unified API endpoint
      return await this.makeRequest('/employee/certificates');
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
      throw error;
    }
  }

  async getCertificateById(id) {
    // Use correct API endpoint for certificate requests
    const response = await this.makeRequest(`/certificate/${id}`);
    return response.data || response;
  }

  async getExperienceById(id) {
    // Use correct API endpoint for experience certificate requests
    const response = await this.makeRequest(`/experience-certificate/${id}`);
    return response.data || response;
  }

  async getMyExperiences() {
    try {
      // Use the unified employee API endpoint
      return await this.makeRequest('/employee/experiences');
    } catch (error) {
      console.error('Failed to fetch experience certificates:', error);
      throw error;
    }
  }

  async getMyExits() {
    try {
      // Use the unified employee API endpoint (matches clearance/onboarding pattern)
      return await this.makeRequest('/employee/exits');
    } catch (error) {
      console.error('Failed to fetch exit requests:', error);
      throw error;
    }
  }

  // Leave Request Methods
  async getMyLeaveRequests() {
    try {
      return await this.makeRequest('/leave-request/mine');
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
      throw error;
    }
  }

  // Maternity Leave Methods
  async getMyMaternityLeaves() {
    try {
      return await this.makeRequest('/maternity-leave/mine');
    } catch (error) {
      console.warn('Failed to fetch maternity leave requests:', error);
      return []; // Return empty array instead of throwing error
    }
  }

  // Housing Allowance Methods  
  async getMyHousingAllowances() {
    try {
      return await this.makeRequest('/housing-allowance/mine');
    } catch (error) {
      console.warn('Failed to fetch housing allowance requests:', error);
      return []; // Return empty array instead of throwing error
    }
  }

  // Assignment Methods
  async getMyAssignments() {
    try {
      return await this.makeRequest('/employee/assignments');
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      return [];
    }
  }

  // Assignment Termination Methods
  async getMyAssignmentTerminations() {
    try {
      return await this.makeRequest('/employee/assignment-terminations');
    } catch (error) {
      console.error('Failed to fetch assignment terminations:', error);
      return [];
    }
  }

  // Internal Transfer Methods
  async getMyInternalTransfers() {
    try {
      return await this.makeRequest('/employee/internal-transfers');
    } catch (error) {
      console.error('Failed to fetch internal transfers:', error);
      return [];
    }
  }

  async getAllLeaveRequests() {
    try {
      return await this.makeRequest('/leave-request');
    } catch (error) {
      console.error('Failed to fetch all leave requests:', error);
      throw error;
    }
  }

  async createLeaveRequest(data) {
    try {
      return await this.makeRequest('/leave-request', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Failed to create leave request:', error);
      throw error;
    }
  }

  async approveLeaveRequest(id, notes) {
    try {
      return await this.makeRequest(`/leave-request/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ notes })
      });
    } catch (error) {
      console.error('Failed to approve leave request:', error);
      throw error;
    }
  }

  async rejectLeaveRequest(id, reason) {
    try {
      return await this.makeRequest(`/leave-request/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason })
      });
    } catch (error) {
      console.error('Failed to reject leave request:', error);
      throw error;
    }
  }

  async getDelegationById(id) {
    return await this.makeRequest(`/delegation/${id}`);
  }

  async updateDelegationStatus(id, status) {
    return await this.makeRequest(`/delegation/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async addDelegationSignature(id, signatureData) {
    return await this.makeRequest(`/delegation/${id}/signatures`, {
      method: 'POST',
      body: JSON.stringify(signatureData)
    });
  }

  // Admin delegation endpoints
  async getAllDelegations() {
    return await this.makeRequest('/delegation/admin/all');
  }

  async getPendingDelegations() {
    return await this.makeRequest('/delegation/admin/pending');
  }

  // ROLE MANAGEMENT ENDPOINTS
  // =====================================================

  async getRoles() {
    return await this.makeRequest('/roles');
  }

  async getUsersWithRoles() {
    return await this.makeRequest('/roles/users');
  }

  async assignRole(userId, role, notes = null) {
    await this.makeRequest('/roles/assign', {
      method: 'POST',
      body: JSON.stringify({ userId, role, notes })
    });
  }

  async removeRole(userId, role) {
    await this.makeRequest('/roles/remove', {
      method: 'POST',
      body: JSON.stringify({ userId, role })
    });
  }

  // =====================================================
  // FILE UPLOAD METHODS
  // =====================================================

  // Upload profile picture
  async uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    return await this.makeRequest('/upload/profile-picture', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${this.token}`
        // Don't set Content-Type - browser will set it with boundary for FormData
      }
    });
  }

  // Upload documents
  async uploadDocuments(files, type = 'documents') {
    const formData = new FormData();
    
    if (Array.isArray(files)) {
      files.forEach(file => {
        formData.append('documents', file);
      });
    } else {
      formData.append('documents', files);
    }
    
    const endpoint = type === 'documents' ? '/upload/documents' : `/upload/${type}-documents`;
    
    return await this.makeRequest(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
  }

  // Upload clearance documents
  async uploadClearanceDocuments(files) {
    return await this.uploadDocuments(files, 'clearance');
  }

  // Upload delegation documents
  async uploadDelegationDocuments(files) {
    return await this.uploadDocuments(files, 'delegation');
  }

  // Upload onboarding documents
  async uploadOnboardingDocuments(files) {
    return await this.uploadDocuments(files, 'onboarding');
  }

  // Delete uploaded file
  async deleteFile(filename, type = 'temp') {
    return await this.makeRequest(`/upload/${filename}?type=${type}`, {
      method: 'DELETE'
    });
  }

  // Get file information
  async getFileInfo(filename, type = 'temp') {
    return await this.makeRequest(`/upload/info/${filename}?type=${type}`);
  }

  // =====================================================
  // ADMIN METHODS
  // =====================================================

  // Get all users (admin only)
  async getAllUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.makeRequest(`/admin/users${queryString ? '?' + queryString : ''}`);
  }

  // Create user (admin only)
  async createUser(userData) {
    return await this.makeRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  // Update user (admin only)
  async updateUser(userId, userData) {
    return await this.makeRequest(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  // Delete user (admin only)
  async deleteUser(userId) {
    return await this.makeRequest(`/admin/users/${userId}`, {
      method: 'DELETE'
    });
  }

  // Get all employees (admin only)
  async getAllEmployeesAdmin(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.makeRequest(`/admin/employees${queryString ? '?' + queryString : ''}`);
  }

  // Get all departments (admin only)
  async getAllDepartmentsAdmin() {
    return await this.makeRequest('/admin/departments');
  }

  // Get departments from App_Users table (employee accessible)
  async getDepartments() {
    return await this.makeRequest('/users/departments');
  }

  // Get job titles from App_Users table (employee accessible)
  async getJobTitles() {
    return await this.makeRequest('/users/job-titles');
  }

  // Get system statistics (admin only)
  async getSystemStats() {
    return await this.makeRequest('/admin/stats');
  }

  // Perform bulk operations (admin only)
  async performBulkOperation(operation, target, ids, data = {}) {
    return await this.makeRequest('/admin/bulk-operations', {
      method: 'POST',
      body: JSON.stringify({ operation, target, ids, data })
    });
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token && !!localStorage.getItem('authUser');
  }

  // Get current user from localStorage
  getCurrentUser() {
    const userStr = localStorage.getItem('authUser');
    if (!userStr || userStr === 'undefined' || userStr === 'null') return null;
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.warn('Failed to parse authUser:', error);
      localStorage.removeItem('authUser');
      return null;
    }
  }

  // Check if current user is admin
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  }

  // Format date for API
  formatDate(date) {
    if (!date) return null;
    if (typeof date === 'string') return date;
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  // Health check
  async healthCheck() {
    return await this.makeRequest('/health', { method: 'GET' });
  }

  // =====================================================
  // ADMIN ENDPOINTS  
  // =====================================================

  async listAllUsers(query = {}) {
    const queryString = new URLSearchParams(query).toString();
    const endpoint = queryString ? `/admin/users?${queryString}` : '/admin/users';
    return await this.makeRequest(endpoint);
  }

  async getAdminUser(userId) {
    return await this.makeRequest(`/admin/users/${userId}`);
  }

  async createAdminUser(userData) {
    return await this.makeRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async updateAdminUser(userId, userData) {
    return await this.makeRequest(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async deleteAdminUser(userId) {
    return await this.makeRequest(`/admin/users/${userId}`, {
      method: 'DELETE'
    });
  }

  // =====================================================
  // ROLE MANAGEMENT ENDPOINTS
  // =====================================================

  async getAllRoles() {
    return await this.makeRequest('/roles');
  }

  async getUserRoles(userId) {
    return await this.makeRequest(`/roles/users/${userId}`);
  }

  async assignRole(userId, role, notes = null) {
    return await this.makeRequest('/roles/assign', {
      method: 'POST',
      body: JSON.stringify({ userId, role, notes })
    });
  }

  async removeRole(userId, role) {
    return await this.makeRequest('/roles/remove', {
      method: 'POST',
      body: JSON.stringify({ userId, role })
    });
  }

  async getRoleAudit() {
    return await this.makeRequest('/roles/audit');
  }

  async refreshTokenAfterRoleChange() {
    return await this.makeRequest('/roles/refresh-token', {
      method: 'POST'
    });
  }

  // Get privileges overview (admin only)
  async getPrivilegesOverview() {
    return await this.makeRequest('/admin/privileges-overview');
  }

  // =====================================================
  // FILE UPLOAD ENDPOINTS
  // =====================================================

  async uploadFile(file, type = 'general') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return await this.makeRequest('/upload', {
      method: 'POST',
      body: formData // FormData automatically detected
    });
  }

  async uploadMultipleFiles(files, type = 'general') {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });
    formData.append('type', type);

    return await this.makeRequest('/upload/multiple', {
      method: 'POST',
      body: formData
    });
  }

  // =====================================================
  // ADMIN STATISTICS AND REPORTING
  // =====================================================

  async getAdminStats() {
    return await this.makeRequest('/admin/stats');
  }

  async getSystemHealth() {
    return await this.makeRequest('/admin/health');
  }

  async getRecentRequests(limit = 10) {
    return await this.makeRequest(`/admin/requests/recent?limit=${limit}`);
  }

  async getRequestsSummary() {
    return await this.makeRequest('/admin/requests/summary');
  }

  async exportData(type, format = 'json') {
    return await this.makeRequest(`/admin/export/${type}?format=${format}`);
  }

  // =====================================================
  // WORKFLOW STATUS UPDATE ENDPOINTS
  // =====================================================

  async updateClearanceStatus(clearanceId, statusData) {
    return await this.makeRequest(`/clearance/${clearanceId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData)
    });
  }

  async updateDelegationStatus(delegationId, statusData) {
    return await this.makeRequest(`/delegation/${delegationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData)
    });
  }

  async updateOnboardingStatus(onboardingId, statusData) {
    return await this.makeRequest(`/onboarding/${onboardingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData)
    });
  }

  async getDelegationById(delegationId) {
    return await this.makeRequest(`/delegation/${delegationId}`);
  }

  async getOnboardingById(onboardingId) {
    // Use new comprehensive employee endpoint that returns all payload_json fields
    const response = await this.makeRequest(`/employee/onboardings/${onboardingId}`);
    return response.data || response;
  }

  // Note: Duplicate getOnboardingById removed - using the updated version above

  // =====================================================
  // NEW EMPLOYEE REQUESTS API METHODS
  // =====================================================

  // Employee (لوحة الموظف)
  async getMyRequests(limit = 50) {
    return await this.makeRequest(`/employee/requests?limit=${limit}`);
  }

  // Create requests (نماذج الإنشاء)
  async createClearance(payload) {
    return await this.makeRequest('/employee/requests/clearance', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async createOnboarding(payload) {
    return await this.makeRequest('/employee/requests/onboarding', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async createDelegation(payload) {
    return await this.makeRequest('/employee/requests/delegation', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Admin (لوحة الإدارة)
  async getAdminRecentPending(limit = 10) {
    return await this.makeRequest(`/admin/requests/recent?limit=${limit}&onlyPending=true`);
  }

  async getAdminSummary() {
    return await this.makeRequest('/admin/requests/summary');
  }

  async approveRequest(type, id, note) {
    return await this.makeRequest(`/admin/requests/${type}/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ note })
    });
  }

  async rejectRequest(type, id, note) {
    return await this.makeRequest(`/admin/requests/${type}/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ note })
    });
  }

  // =====================================================
  // TRAVEL ORDER METHODS
  // =====================================================

  async createTravelOrder(data) {
    return await this.makeRequest('/travel-order', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getMyTravelOrders() {
    try {
      return await this.makeRequest('/employee/travel-orders');
    } catch (error) {
      console.error('Failed to fetch travel orders:', error);
      return [];
    }
  }

  async getTravelOrderById(id) {
    return await this.makeRequest(`/travel-order/${id}`);
  }

  // =====================================================
  // REWARD/REFUND METHODS
  // =====================================================

  async createRewardRefund(data) {
    return await this.makeRequest('/reward-refund', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getMyRewardRefunds() {
    try {
      return await this.makeRequest('/employee/reward-refunds');
    } catch (error) {
      console.error('Failed to fetch reward/refund requests:', error);
      return [];
    }
  }

  async getRewardRefundById(id) {
    return await this.makeRequest(`/reward-refund/${id}`);
  }

  // =====================================================
  // AIRLINES TICKET METHODS
  // =====================================================

  async createAirlinesTicket(data) {
    return await this.makeRequest('/airlines-ticket', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getMyAirlinesTickets() {
    try {
      return await this.makeRequest('/employee/airlines-tickets');
    } catch (error) {
      console.error('Failed to fetch airlines tickets:', error);
      return [];
    }
  }

  async getAirlinesTicketById(id) {
    return await this.makeRequest(`/airlines-ticket/${id}`);
  }
}

// Create global instance
const apiClient = new APIClient();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIClient;
} else {
  window.apiClient = apiClient;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// Safe JSON parse from localStorage
function safeParseJSON(key, fallback = null) {
  const value = localStorage.getItem(key);
  if (!value || value === 'undefined' || value === 'null') return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn(`Failed to parse ${key}:`, error);
    localStorage.removeItem(key);
    return fallback;
  }
}

// Show loading state
function showLoading(element, text = 'جاري التحميل...') {
  if (element) {
    element.disabled = true;
    element.dataset.originalText = element.textContent;
    element.classList.add('btn-loading');
    element.textContent = text;
  }
}

// Hide loading state
function hideLoading(element, originalText) {
  if (element) {
    element.disabled = false;
    element.classList.remove('btn-loading');
    element.textContent = originalText || element.dataset.originalText || element.textContent;
  }
}

// Show success message
function showSuccess(message, duration = 3000) {
  const alert = document.createElement('div');
  alert.className = 'alert alert-success';
  alert.textContent = message;
  alert.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #d4edda;
    color: #155724;
    padding: 15px 20px;
    border: 1px solid #c3e6cb;
    border-radius: 8px;
    z-index: 10000;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  `;
  
  document.body.appendChild(alert);
  
  setTimeout(() => {
    if (alert.parentNode) {
      alert.parentNode.removeChild(alert);
    }
  }, duration);
}

// Show error message
function showError(message, duration = 5000) {
  const alert = document.createElement('div');
  alert.className = 'alert alert-error';
  alert.textContent = message;
  alert.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #f8d7da;
    color: #721c24;
    padding: 15px 20px;
    border: 1px solid #f5c6cb;
    border-radius: 8px;
    z-index: 10000;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  `;
  
  document.body.appendChild(alert);
  
  setTimeout(() => {
    if (alert.parentNode) {
      alert.parentNode.removeChild(alert);
    }
  }, duration);
}

// Redirect to login if not authenticated
function requireAuth() {
  if (!apiClient.isAuthenticated()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Redirect to appropriate dashboard based on role
function redirectToDashboard() {
  const user = apiClient.getCurrentUser();
  if (user) {
    if (user.role === 'admin') {
      window.location.href = window.resolveFrontendPath('admin-dashboard.html');
    } else {
      window.location.href = window.resolveFrontendPath('employee-dashboard.html');
    }
  } else {
    window.location.href = window.resolveFrontendPath ? window.resolveFrontendPath('login.html') : 'login.html';
  }
}
