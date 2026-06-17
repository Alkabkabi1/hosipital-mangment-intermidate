// Unified error handling for the entire application
// Prevents silent failures and provides consistent error reporting
(function() {
  'use strict';
  
  // Error display utilities
  function createToast(message, type = 'error', duration = 5000) {
    // Try to find existing toast container or create one
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.style.cssText = `
      background: ${type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#f59e0b'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      pointer-events: auto;
      font-family: 'Tajawal', sans-serif;
      font-size: 14px;
      max-width: 350px;
      word-wrap: break-word;
      animation: slideIn 0.3s ease-out;
    `;
    
    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    if (!document.getElementById('toast-styles')) {
      style.id = 'toast-styles';
      document.head.appendChild(style);
    }
    
    toast.textContent = message;
    container.appendChild(toast);
    
    // Auto-remove after duration
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
    
    return toast;
  }
  
  function showError(message, duration = 5000) {
    console.error('❌ Application Error:', message);
    
    // Try existing error display functions first
    if (typeof window.showError === 'function' && window.showError !== showError) {
      try {
        window.showError(message);
        return;
      } catch (e) {
        console.warn('⚠️ Existing showError function failed:', e);
      }
    }
    
    // Use toast if possible, otherwise fallback to alert
    if (document.body) {
      createToast(message, 'error', duration);
    } else {
      alert(`خطأ: ${message}`);
    }
  }
  
  function showSuccess(message, duration = 3000) {
    console.log('✅ Success:', message);
    
    // Try existing success display functions first
    if (typeof window.showSuccess === 'function' && window.showSuccess !== showSuccess) {
      try {
        window.showSuccess(message);
        return;
      } catch (e) {
        console.warn('⚠️ Existing showSuccess function failed:', e);
      }
    }
    
    if (document.body) {
      createToast(message, 'success', duration);
    }
  }
  
  function showWarning(message, duration = 4000) {
    console.warn('⚠️ Warning:', message);
    
    if (document.body) {
      createToast(message, 'warning', duration);
    }
  }
  
  function handleApiError(error, context = '') {
    console.error(`❌ API Error in ${context}:`, error);
    
    let message = 'حدث خطأ غير متوقع';
    let shouldRedirect = false;
    
    if (error && typeof error === 'object') {
      if (error.status === 401) {
        message = 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى';
        shouldRedirect = true;
      } else if (error.status === 403) {
        message = 'ليس لديك صلاحية للوصول لهذا المورد';
      } else if (error.status === 404) {
        message = 'المورد المطلوب غير موجود';
      } else if (error.status === 422) {
        // Validation errors - show detailed field errors
        if (error.response && error.response.data && error.response.data.details) {
          const details = error.response.data.details;
          const fieldErrors = details.map(d => `${d.path}: ${d.message}`).join('\n');
          message = `خطأ في التحقق من البيانات:\n${fieldErrors}`;
          console.error('Validation errors:', details);
        } else {
          message = 'البيانات المرسلة غير صحيحة. يرجى التحقق من جميع الحقول المطلوبة';
        }
      } else if (error.status === 500) {
        message = 'خطأ في الخادم، يرجى المحاولة لاحقاً';
      } else if (error.message) {
        message = error.message;
      }
    } else if (typeof error === 'string') {
      message = error;
    }
    
    const fullMessage = context ? `${context}: ${message}` : message;
    showError(fullMessage);
    
    if (shouldRedirect) {
      setTimeout(() => {
        if (typeof window.resolveFrontendPath === 'function') {
          window.location.href = window.resolveFrontendPath('login.html');
        } else {
          window.location.href = 'login.html';
        }
      }, 2000);
    }
    
    return { message: fullMessage, shouldRedirect };
  }
  
  function handleNetworkError(error, context = '') {
    console.error(`🌐 Network Error in ${context}:`, error);
    
    let message = 'خطأ في الاتصال بالخادم';
    
    if (error && error.name === 'TypeError' && error.message.includes('fetch')) {
      message = 'لا يمكن الاتصال بالخادم، تحقق من الاتصال بالإنترنت';
    } else if (error && error.code === 'NETWORK_ERROR') {
      message = 'خطأ في الشبكة، يرجى المحاولة مرة أخرى';
    }
    
    const fullMessage = context ? `${context}: ${message}` : message;
    showError(fullMessage);
    
    return { message: fullMessage };
  }
  
  // Global error handlers
  window.addEventListener('error', function(event) {
    console.error('❌ Unhandled JavaScript Error:', event.error);
    console.error('📍 Location:', event.filename, 'Line:', event.lineno);
    
    // Don't show toast for script loading errors
    if (event.error && event.error.message && event.error.message.includes('Loading')) {
      return;
    }
    
    showError('حدث خطأ في التطبيق، يرجى إعادة تحميل الصفحة');
  });
  
  window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Unhandled Promise Rejection:', event.reason);
    
    // Handle API promise rejections gracefully
    if (event.reason && typeof event.reason === 'object' && event.reason.status) {
      handleApiError(event.reason, 'عملية غير متوقعة');
    } else {
      showError('حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى');
    }
  });
  
  // Export functions to global scope (only if they don't exist)
  if (typeof window.showError !== 'function') {
    window.showError = showError;
  }
  if (typeof window.showSuccess !== 'function') {
    window.showSuccess = showSuccess;
  }
  if (typeof window.showWarning !== 'function') {
    window.showWarning = showWarning;
  }
  if (typeof window.handleApiError !== 'function') {
    window.handleApiError = handleApiError;
  }
  if (typeof window.handleNetworkError !== 'function') {
    window.handleNetworkError = handleNetworkError;
  }
  
  // Debug helper
  window.testErrorHandler = function() {
    console.log('🧪 Testing error handler...');
    showSuccess('Success message test');
    setTimeout(() => showWarning('Warning message test'), 1000);
    setTimeout(() => showError('Error message test'), 2000);
  };
  
  console.log('🛡️ Error handler initialized');
})();
