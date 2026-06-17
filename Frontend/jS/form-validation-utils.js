// Form Validation Utilities
// Shared validation functions and utilities for all forms

// Global validation utilities
window.FormValidationUtils = {
  
  // Email validation
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Phone validation (Saudi format)
  isValidPhone(phone) {
    const saudiPhoneRegex = /^(\+966|966|05)[0-9]{8}$/;
    const generalPhoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return saudiPhoneRegex.test(phone.replace(/\s/g, '')) || generalPhoneRegex.test(phone);
  },

  // National ID validation (Saudi format)
  isValidNationalId(nationalId) {
    const saudiIdRegex = /^[12][0-9]{9}$/;
    return saudiIdRegex.test(nationalId);
  },

  // Date validation
  isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  },

  // Check if date is in the past
  isDateInPast(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  },

  // Check if date is in the future
  isDateInFuture(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date > today;
  },

  // Validate date range
  isValidDateRange(startDate, endDate, minDays = 0, maxDays = null) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) return false;
    
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    if (diffDays < minDays) return false;
    if (maxDays && diffDays > maxDays) return false;
    
    return true;
  },

  // Salary validation
  isValidSalary(salary, min = 3000, max = 100000) {
    const numSalary = parseFloat(salary);
    return !isNaN(numSalary) && numSalary >= min && numSalary <= max;
  },

  // Reference number validation
  isValidReferenceNumber(refNumber) {
    return refNumber && refNumber.length >= 3 && refNumber.length <= 50;
  },

  // Text length validation
  isValidTextLength(text, minLength = 0, maxLength = 1000) {
    if (!text) return minLength === 0;
    return text.length >= minLength && text.length <= maxLength;
  },

  // Required field validation
  isRequired(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  },

  // Number validation
  isValidNumber(value, min = null, max = null) {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    if (min !== null && num < min) return false;
    if (max !== null && num > max) return false;
    return true;
  },

  // Employee ID validation
  isValidEmployeeId(employeeId) {
    return /^[0-9]+$/.test(employeeId) && parseInt(employeeId) > 0;
  }
};

// Field error display utilities
window.FieldErrorUtils = {
  
  showFieldError(field, message) {
    if (!field) return;
    
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
      animation: fadeIn 0.3s ease-in;
    `;
    
    field.parentNode.appendChild(errorDiv);
  },

  clearFieldError(field) {
    if (!field) return;
    
    field.classList.remove('error');
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
      errorDiv.remove();
    }
  },

  clearAllFieldErrors() {
    const errorElements = document.querySelectorAll('.field-error');
    errorElements.forEach(error => error.remove());
    
    const errorFields = document.querySelectorAll('.error');
    errorFields.forEach(field => field.classList.remove('error'));
  },

  showFormError(formId, message) {
    const form = document.getElementById(formId);
    if (!form) return;

    // Remove existing form error
    const existingError = form.querySelector('.form-error');
    if (existingError) {
      existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      background: #fee2e2;
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: center;
      animation: slideDown 0.3s ease-out;
    `;

    form.insertBefore(errorDiv, form.firstChild);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
  }
};

// Form data collection utilities
window.FormDataUtils = {
  
  // Collect form data with validation
  collectFormData(formId, fieldMappings = {}) {
    const form = document.getElementById(formId);
    if (!form) return null;

    const data = {};
    const formData = new FormData(form);

    // Get all form inputs
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      const fieldName = fieldMappings[input.id] || input.id;
      let value = input.value;

      // Handle different input types
      switch (input.type) {
        case 'checkbox':
          value = input.checked;
          break;
        case 'radio':
          if (input.checked) {
            data[fieldName] = value;
          }
          return;
        case 'number':
          value = value ? parseFloat(value) : null;
          break;
        case 'date':
          value = value || null;
          break;
        default:
          value = value.trim() || null;
      }

      if (value !== null && value !== '') {
        data[fieldName] = value;
      }
    });

    return data;
  },

  // Populate form with data
  populateForm(formId, data, fieldMappings = {}) {
    const form = document.getElementById(formId);
    if (!form || !data) return;

    Object.keys(data).forEach(key => {
      const fieldId = fieldMappings[key] || key;
      const field = form.querySelector(`#${fieldId}`);
      
      if (field && data[key] !== null && data[key] !== undefined) {
        switch (field.type) {
          case 'checkbox':
            field.checked = Boolean(data[key]);
            break;
          case 'radio':
            if (field.value === data[key]) {
              field.checked = true;
            }
            break;
          default:
            field.value = data[key];
        }
      }
    });
  },

  // Clear form data
  clearForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.reset();
    FieldErrorUtils.clearAllFieldErrors();
  }
};

// Date formatting utilities
window.DateUtils = {
  
  formatDate(dateString, options = {}) {
    if (!dateString) return 'غير محدد';
    
    const date = new Date(dateString);
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return date.toLocaleDateString('ar-SA', { ...defaultOptions, ...options });
  },

  formatShortDate(dateString) {
    return this.formatDate(dateString, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  formatTime(dateString) {
    if (!dateString) return 'غير محدد';
    
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  formatDateTime(dateString) {
    if (!dateString) return 'غير محدد';
    
    return `${this.formatDate(dateString)} - ${this.formatTime(dateString)}`;
  },

  getToday() {
    return new Date().toISOString().split('T')[0];
  },

  addDays(dateString, days) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  },

  getDaysDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }
};

// Loading state utilities
window.LoadingUtils = {
  
  showLoading(element, text = 'جاري التحميل...') {
    if (element) {
      element.disabled = true;
      element.dataset.originalText = element.textContent;
      element.textContent = text;
      element.classList.add('loading');
    }
  },

  hideLoading(element, originalText = null) {
    if (element) {
      element.disabled = false;
      element.textContent = originalText || element.dataset.originalText || element.textContent;
      element.classList.remove('loading');
      delete element.dataset.originalText;
    }
  },

  showPageLoading(containerId = 'main-content') {
    const container = document.getElementById(containerId);
    if (container) {
      container.style.opacity = '0.5';
      container.style.pointerEvents = 'none';
    }

    // Add loading overlay
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;
    overlay.innerHTML = `
      <div style="text-align: center; color: #6b7280;">
        <div class="spinner" style="margin: 0 auto 15px; width: 40px; height: 40px; border: 4px solid #e5e7eb; border-top: 4px solid #2B6CB0; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p>جاري التحميل...</p>
      </div>
    `;

    document.body.appendChild(overlay);
  },

  hidePageLoading(containerId = 'main-content') {
    const container = document.getElementById(containerId);
    if (container) {
      container.style.opacity = '1';
      container.style.pointerEvents = 'auto';
    }

    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
};

// Utility functions
window.Utils = {
  
  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Format currency
  formatCurrency(amount, currency = 'ريال') {
    if (!amount) return '0 ' + currency;
    
    const formatted = parseFloat(amount).toLocaleString('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    
    return `${formatted} ${currency}`;
  },

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 بايت';
    
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Generate random ID
  generateId(prefix = 'id') {
    return prefix + '_' + Math.random().toString(36).substr(2, 9);
  },

  // Copy text to clipboard
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess('تم النسخ إلى الحافظة');
    } catch (err) {
      console.error('Failed to copy: ', err);
      showError('فشل في النسخ');
    }
  },

  // Download file
  downloadFile(content, filename, contentType = 'text/plain') {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
};

// Add global CSS for form validation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .field-error {
    animation: fadeIn 0.3s ease-in;
  }
  
  .form-error {
    animation: slideDown 0.3s ease-out;
  }
  
  .input.error,
  .select.error,
  .textarea.error {
    border-color: #dc3545 !important;
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
  }
  
  .btn.loading {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
`;
document.head.appendChild(style);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FormValidationUtils: window.FormValidationUtils,
    FieldErrorUtils: window.FieldErrorUtils,
    FormDataUtils: window.FormDataUtils,
    DateUtils: window.DateUtils,
    LoadingUtils: window.LoadingUtils,
    Utils: window.Utils
  };
}
