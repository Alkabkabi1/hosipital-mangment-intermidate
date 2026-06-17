// Login Page JavaScript
// Handles user authentication and login functionality

document.addEventListener('DOMContentLoaded', function() {
  // Always keep users on the login page when they visit it directly,
  // even if already authenticated (no auto-redirect from login page).
  // After a successful login, we still redirect to the proper dashboard.

  // Get form elements
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const signupLink = document.getElementById('signupLink');

  // Form validation
  function validateForm() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Clear previous error states
    clearFieldErrors();

    let isValid = true;

    // Email/Username validation
    if (!email) {
      showFieldError(emailInput, 'البريد الإلكتروني أو اسم المستخدم مطلوب');
      isValid = false;
    } else if (email.toLowerCase() !== 'sadmin' && !isValidEmail(email)) {
      // Special exception for 'sadmin' - allow it to bypass email validation
      showFieldError(emailInput, 'البريد الإلكتروني غير صحيح');
      isValid = false;
    }

    // Password validation
    if (!password) {
      showFieldError(passwordInput, 'كلمة المرور مطلوبة');
      isValid = false;
    }

    return isValid;
  }

  // Handle form submission
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Show loading state
    showLoading(loginBtn, 'جاري تسجيل الدخول...');

    try {
      // Attempt login
      const response = await apiClient.login(email, password);

      // Success
      showSuccess('تم تسجيل الدخول بنجاح');
      
      // Small delay for user feedback, then redirect
      setTimeout(() => {
        redirectToDashboard();
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific error cases
      let errorMessage = 'حدث خطأ في تسجيل الدخول';
      
      if (error.message.includes('Invalid credentials')) {
        errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      } else if (error.message.includes('User not found')) {
        errorMessage = 'المستخدم غير موجود';
      } else if (error.message.includes('Network')) {
        errorMessage = 'خطأ في الاتصال بالخادم';
      } else {
        errorMessage = error.message;
      }

      showError(errorMessage);
      
    } finally {
      // Hide loading state
      hideLoading(loginBtn, 'تسجيل الدخول');
    }
  });

  // Handle Enter key press on password field
  passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      loginForm.dispatchEvent(new Event('submit'));
    }
  });

  // Handle forgot password link - check if modal exists first
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Check if reset modal exists in the page
      const hasModal = !!document.getElementById('resetModal');
      
      if (hasModal) {
        // Modal exists - let the modal handler in login.html take care of it
        // The modal script will handle opening the modal
        console.log('Modal detected - using in-page reset functionality');
        return;
      }
      
      // No modal found - redirect to reset-password.html page
      console.log('No modal detected - redirecting to reset-password.html');
      window.location.href = 'reset-password.html';
    });
  }

  // Handle signup link
  if (signupLink) {
    signupLink.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'signup.html';
    });
  }

  // Real-time validation feedback
  emailInput.addEventListener('blur', function() {
    const email = this.value.trim();
    if (email && email.toLowerCase() !== 'sadmin' && !isValidEmail(email)) {
      // Special exception for 'sadmin' - allow it to bypass email validation
      showFieldError(this, 'البريد الإلكتروني غير صحيح');
    } else {
      clearFieldError(this);
    }
  });

  emailInput.addEventListener('input', function() {
    if (this.value.trim()) {
      clearFieldError(this);
    }
  });

  passwordInput.addEventListener('input', function() {
    if (this.value.trim()) {
      clearFieldError(this);
    }
  });

  // Demo buttons removed - sadmin can be entered manually
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// Email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Show field error
function showFieldError(field, message) {
  clearFieldError(field);
  
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

// Clear field error
function clearFieldError(field) {
  field.classList.remove('error');
  const errorDiv = field.parentNode.querySelector('.field-error');
  if (errorDiv) {
    errorDiv.remove();
  }
}

// Clear all field errors
function clearFieldErrors() {
  const errorElements = document.querySelectorAll('.field-error');
  errorElements.forEach(error => error.remove());
  
  const errorFields = document.querySelectorAll('.error');
  errorFields.forEach(field => field.classList.remove('error'));
}

// Handle authentication errors
function handleAuthError(error) {
  console.error('Authentication error:', error);
  
  if (error.message.includes('Token expired')) {
    showError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
    apiClient.clearToken();
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
  }
}

// Add global error handler for authentication
window.addEventListener('unhandledrejection', function(event) {
  if (event.reason && event.reason.message && 
      (event.reason.message.includes('Token expired') || 
       event.reason.message.includes('Invalid token'))) {
    handleAuthError(event.reason);
  }
});

// Add CSS for error states
const style = document.createElement('style');
style.textContent = `
  .input.error,
  .select.error,
  .textarea.error {
    border-color: #dc3545 !important;
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
  }
  
  .field-error {
    animation: fadeIn 0.3s ease-in;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .alert {
    animation: slideIn 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
document.head.appendChild(style);

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function showLoading(button, message) {
  button.disabled = true;
  button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
}

function hideLoading(button, originalText) {
  button.disabled = false;
  button.innerHTML = originalText;
}

function showSuccess(message) {
  // Create success notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #28a745;
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function showError(message) {
  // Create error notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #dc3545;
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  notification.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
  document.body.appendChild(notification);
  
  // Remove after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
}
