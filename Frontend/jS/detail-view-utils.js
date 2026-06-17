// Detail View Utilities - Unified utilities for request detail pages
// Provides consistent error handling, data loading, and UI updates across all detail views

(function() {
  'use strict';

  // Dependency checks and fallbacks
  const getApiClient = () => {
    if (window.apiClient) return window.apiClient;
    console.error('apiClient not available');
    return null;
  };

  const getToast = () => {
    if (window.showToast) return window.showToast;
    // Fallback to simple alerts
    return (msg, type) => {
      if (type === 'error') {
        alert('خطأ: ' + msg);
      } else if (type === 'success') {
        alert('نجح: ' + msg);
      } else {
        alert(msg);
      }
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    
    // Check if DateUtils is available
    if (window.DateUtils && typeof window.DateUtils.formatDate === 'function') {
      return window.DateUtils.formatDate(dateString);
    }
    
    // Fallback formatting
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'غير محدد';
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'غير محدد';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'غير محدد';
    
    if (window.DateUtils && typeof window.DateUtils.formatDateTime === 'function') {
      return window.DateUtils.formatDateTime(dateString);
    }
    
    // Fallback
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'غير محدد';
      return date.toLocaleString('ar-SA');
    } catch (e) {
      return 'غير محدد';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'غير محدد';
    
    if (window.Utils && typeof window.Utils.formatCurrency === 'function') {
      return window.Utils.formatCurrency(amount);
    }
    
    // Fallback
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const showLoading = () => {
    if (window.LoadingUtils && typeof window.LoadingUtils.showPageLoading === 'function') {
      window.LoadingUtils.showPageLoading();
      return true;
    }
    return false;
  };

  const hideLoading = () => {
    if (window.LoadingUtils && typeof window.LoadingUtils.hidePageLoading === 'function') {
      window.LoadingUtils.hidePageLoading();
      return true;
    }
    return false;
  };

  const requireAuth = () => {
    const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
    if (!authUser) {
      const toast = getToast();
      toast('يرجى تسجيل الدخول أولاً', 'error');
      setTimeout(() => {
        window.location.href = window.resolveFrontendPath ? 
          window.resolveFrontendPath('login.html') : 'login.html';
      }, 2000);
      return false;
    }
    return true;
  };

  const requireAdmin = () => {
    const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
    if (!authUser || authUser.role !== 'admin') {
      const toast = getToast();
      toast('ليس لديك صلاحية للوصول إلى هذه الصفحة', 'error');
      setTimeout(() => {
        window.location.href = window.resolveFrontendPath ? 
          window.resolveFrontendPath('employee-dashboard.html') : 'employee-dashboard.html';
      }, 2000);
      return false;
    }
    return true;
  };

  // Safe API call wrapper
  const safeApiCall = async (apiCall, errorMessage = 'حدث خطأ في تحميل البيانات') => {
    try {
      const apiClient = getApiClient();
      if (!apiClient) {
        throw new Error('API client not available');
      }
      return await apiCall(apiClient);
    } catch (error) {
      console.error('API call error:', error);
      const toast = getToast();
      toast(errorMessage + ': ' + (error.message || 'خطأ غير معروف'), 'error');
      throw error;
    }
  };

  // Safe data loading with retry
  const loadRequestDetails = async (requestType, requestId, loadFunction) => {
    showLoading();
    console.log(`📡 DetailUtils: Loading ${requestType} request ID ${requestId} from API...`);
    
    try {
      const data = await safeApiCall(
        async (apiClient) => {
          console.log(`📡 DetailUtils: Calling API function for ${requestType}...`);
          const result = await loadFunction(apiClient, requestId);
          console.log(`✅ DetailUtils: Received ${requestType} data:`, result);
          return result;
        },
        `حدث خطأ في تحميل تفاصيل طلب ${requestType}`
      );
      return data;
    } catch (error) {
      // If API fails, try to load from localStorage as fallback
      console.warn(`⚠️ DetailUtils: API failed for ${requestType} ID ${requestId}, trying localStorage fallback...`);
      const fallbackKey = `requests${requestType.charAt(0).toUpperCase() + requestType.slice(1)}`;
      const stored = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
      const found = stored.find(r => r.id == requestId || r.reference_number == requestId);
      if (found) {
        console.log('✅ DetailUtils: Loaded from localStorage fallback:', found);
        return found;
      }
      console.error(`❌ DetailUtils: No data found in API or localStorage for ${requestType} ID ${requestId}`);
      throw error;
    } finally {
      hideLoading();
    }
  };

  // Export utilities
  window.DetailUtils = {
    requireAuth,
    requireAdmin,
    formatDate,
    formatDateTime,
    formatCurrency,
    showLoading,
    hideLoading,
    getApiClient,
    getToast: getToast,
    safeApiCall,
    loadRequestDetails,
    
    // Helper for consistent error display
    showError: (message) => {
      const toast = getToast();
      toast(message, 'error');
    },
    
    showSuccess: (message) => {
      const toast = getToast();
      toast(message, 'success');
    },
    
    showInfo: (message) => {
      const toast = getToast();
      toast(message, 'info');
    }
  };

  console.log('✅ Detail view utilities loaded');
})();

