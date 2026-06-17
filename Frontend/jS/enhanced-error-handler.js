// Enhanced Error Handling System
// Provides comprehensive error handling for all forms and API calls

class EnhancedErrorHandler {
  constructor() {
    this.errorQueue = [];
    this.maxErrors = 5;
    this.errorContainer = null;
    this.init();
  }

  init() {
    // Create error container if it doesn't exist
    this.createErrorContainer();
    
    // Set up global error handlers
    this.setupGlobalErrorHandlers();
  }

  createErrorContainer() {
    if (document.getElementById('error-container')) return;
    
    const container = document.createElement('div');
    container.id = 'error-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
      pointer-events: none;
    `;
    
    document.body.appendChild(container);
    this.errorContainer = container;
  }

  setupGlobalErrorHandlers() {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.showError('حدث خطأ غير متوقع في النظام', 'error');
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.showError('حدث خطأ في الاتصال بالخادم', 'error');
    });
  }

  showError(message, type = 'error', duration = 5000) {
    // Prevent duplicate errors
    if (this.errorQueue.some(error => error.message === message)) {
      return;
    }

    const errorId = 'error-' + Date.now();
    const errorData = { id: errorId, message, type, timestamp: Date.now() };
    
    // Add to queue
    this.errorQueue.push(errorData);
    
    // Remove old errors if queue is full
    if (this.errorQueue.length > this.maxErrors) {
      const oldError = this.errorQueue.shift();
      this.removeErrorElement(oldError.id);
    }

    // Create and show error element
    this.createErrorElement(errorData, duration);
    
    // Auto-remove from queue after duration
    setTimeout(() => {
      this.errorQueue = this.errorQueue.filter(err => err.id !== errorId);
    }, duration);
  }

  createErrorElement(errorData, duration) {
    const alert = document.createElement('div');
    alert.id = errorData.id;
    alert.className = `alert alert-${errorData.type}`;
    alert.style.cssText = this.getErrorStyles(errorData.type);
    alert.style.pointerEvents = 'auto';
    
    // Create content
    const content = document.createElement('div');
    content.style.cssText = 'display: flex; align-items: center; justify-content: space-between;';
    
    const message = document.createElement('span');
    message.textContent = errorData.message;
    message.style.flexGrow = '1';
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      margin-left: 10px;
      padding: 0;
      color: inherit;
      opacity: 0.7;
    `;
    closeBtn.onclick = () => this.removeErrorElement(errorData.id);
    
    content.appendChild(message);
    content.appendChild(closeBtn);
    alert.appendChild(content);
    
    // Add animation
    alert.style.transform = 'translateX(100%)';
    alert.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    
    this.errorContainer.appendChild(alert);
    
    // Animate in
    setTimeout(() => {
      alert.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto-remove
    setTimeout(() => {
      this.removeErrorElement(errorData.id);
    }, duration);
  }

  removeErrorElement(errorId) {
    const element = document.getElementById(errorId);
    if (element) {
      element.style.transform = 'translateX(100%)';
      element.style.opacity = '0';
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }, 300);
    }
  }

  getErrorStyles(type) {
    const baseStyles = `
      margin-bottom: 10px;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: 'Tajawal', sans-serif;
      font-size: 14px;
      line-height: 1.4;
      backdrop-filter: blur(10px);
    `;

    const typeStyles = {
      error: `
        background: rgba(248, 215, 218, 0.95);
        color: #721c24;
        border: 1px solid #f5c6cb;
      `,
      warning: `
        background: rgba(255, 243, 205, 0.95);
        color: #856404;
        border: 1px solid #ffeaa7;
      `,
      success: `
        background: rgba(212, 237, 218, 0.95);
        color: #155724;
        border: 1px solid #c3e6cb;
      `,
      info: `
        background: rgba(209, 236, 241, 0.95);
        color: #0c5460;
        border: 1px solid #b6d4da;
      `
    };

    return baseStyles + (typeStyles[type] || typeStyles.error);
  }

  showSuccess(message, duration = 3000) {
    this.showError(message, 'success', duration);
  }

  showWarning(message, duration = 4000) {
    this.showError(message, 'warning', duration);
  }

  showInfo(message, duration = 3000) {
    this.showError(message, 'info', duration);
  }

  // API Error Handler
  handleApiError(error, context = 'العملية') {
    console.error(`API Error in ${context}:`, error);
    
    let message = `حدث خطأ في ${context}`;
    
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          message = data?.message || 'البيانات المدخلة غير صحيحة';
          break;
        case 401:
          message = 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى';
          setTimeout(() => {
            window.location.href = window.resolveFrontendPath('login.html');
          }, 2000);
          break;
        case 403:
          message = 'ليس لديك صلاحية للقيام بهذه العملية';
          break;
        case 404:
          message = 'الصفحة أو البيانات المطلوبة غير موجودة';
          break;
        case 409:
          message = data?.message || 'البيانات موجودة مسبقاً';
          break;
        case 422:
          message = data?.message || 'البيانات المدخلة غير صالحة';
          break;
        case 500:
          message = 'خطأ في الخادم، يرجى المحاولة لاحقاً';
          break;
        default:
          message = data?.message || `حدث خطأ غير متوقع (${status})`;
      }
    } else if (error.request) {
      // Network error
      message = 'خطأ في الاتصال بالخادم، يرجى التحقق من الاتصال بالإنترنت';
    } else {
      // Other error
      message = error.message || 'حدث خطأ غير متوقع';
    }
    
    this.showError(message);
    return message;
  }

  // Form Validation Error Handler
  handleValidationErrors(errors) {
    if (Array.isArray(errors)) {
      errors.forEach(error => {
        if (error.field) {
          this.showFieldError(error.field, error.message);
        } else {
          this.showError(error.message, 'warning');
        }
      });
    } else {
      this.showError(errors, 'warning');
    }
  }

  showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Use existing field error utilities if available
    if (window.FieldErrorUtils) {
      window.FieldErrorUtils.showFieldError(field, message);
    } else {
      // Fallback field error display
      this.clearFieldError(field);
      field.classList.add('error');
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'field-error';
      errorDiv.textContent = message;
      errorDiv.style.cssText = `
        color: #dc3545;
        font-size: 14px;
        margin-top: 5px;
        text-align: right;
      `;
      
      field.parentNode.appendChild(errorDiv);
    }
  }

  clearFieldError(field) {
    if (window.FieldErrorUtils) {
      window.FieldErrorUtils.clearFieldError(field);
    } else {
      field.classList.remove('error');
      const errorDiv = field.parentNode.querySelector('.field-error');
      if (errorDiv) {
        errorDiv.remove();
      }
    }
  }

  clearAllErrors() {
    // Clear notification errors
    this.errorQueue = [];
    const errorElements = this.errorContainer.querySelectorAll('.alert');
    errorElements.forEach(element => {
      this.removeErrorElement(element.id);
    });

    // Clear field errors
    if (window.FieldErrorUtils) {
      window.FieldErrorUtils.clearAllFieldErrors();
    } else {
      const fieldErrors = document.querySelectorAll('.field-error');
      fieldErrors.forEach(error => error.remove());
      
      const errorFields = document.querySelectorAll('.error');
      errorFields.forEach(field => field.classList.remove('error'));
    }
  }
}

// Initialize global error handler
window.enhancedErrorHandler = new EnhancedErrorHandler();

// Provide global functions for backward compatibility
window.showError = (message, duration) => window.enhancedErrorHandler.showError(message, 'error', duration);
window.showSuccess = (message, duration) => window.enhancedErrorHandler.showSuccess(message, duration);
window.showWarning = (message, duration) => window.enhancedErrorHandler.showWarning(message, duration);
window.showInfo = (message, duration) => window.enhancedErrorHandler.showInfo(message, duration);
window.handleApiError = (error, context) => window.enhancedErrorHandler.handleApiError(error, context);
window.clearAllErrors = () => window.enhancedErrorHandler.clearAllErrors();

console.log('✅ Enhanced Error Handler initialized');
