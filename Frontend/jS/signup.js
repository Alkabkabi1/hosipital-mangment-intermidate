// Signup Page JavaScript
// Handles user registration functionality

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already logged in
  if (apiClient.isAuthenticated()) {
    redirectToDashboard();
    return;
  }

  // Get form elements
  const signupForm = document.getElementById('signupForm');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const employeeIdInput = document.getElementById('employeeId');
  const signupBtn = document.getElementById('signupBtn');
  const loginLink = document.getElementById('loginLink');

  // Form validation
  function validateForm() {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : password;
    const employeeId = employeeIdInput ? employeeIdInput.value.trim() : '';

    // Clear previous error states
    clearFieldErrors();

    let isValid = true;

    // Name validation
    if (!name) {
      showFieldError(nameInput, 'الاسم مطلوب');
      isValid = false;
    } else if (name.length < 2) {
      showFieldError(nameInput, 'الاسم يجب أن يكون أكثر من حرفين');
      isValid = false;
    }

    // Email validation
    if (!email) {
      showFieldError(emailInput, 'البريد الإلكتروني مطلوب');
      isValid = false;
    } else if (!isValidEmail(email)) {
      showFieldError(emailInput, 'البريد الإلكتروني غير صحيح');
      isValid = false;
    }

    // Password validation
    if (!password) {
      showFieldError(passwordInput, 'كلمة المرور مطلوبة');
      isValid = false;
    } else if (password.length < 6) {
      showFieldError(passwordInput, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      isValid = false;
    }

    // Confirm password validation
    if (confirmPasswordInput && password !== confirmPassword) {
      showFieldError(confirmPasswordInput, 'كلمات المرور غير متطابقة');
      isValid = false;
    }

    // Employee ID validation (if provided)
    if (employeeId && (isNaN(employeeId) || parseInt(employeeId) <= 0)) {
      showFieldError(employeeIdInput, 'رقم الموظف يجب أن يكون رقماً صحيحاً');
      isValid = false;
    }

    return isValid;
  }

  // Handle form submission
  signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const formData = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      password: passwordInput.value.trim(),
      role: 'employee', // Default role
      employee_id: employeeIdInput && employeeIdInput.value.trim() ? 
                   parseInt(employeeIdInput.value.trim()) : null
    };

    // Show loading state
    showLoading(signupBtn, 'جاري إنشاء الحساب...');

    try {
      // Attempt registration
      const response = await apiClient.register(formData);

      // Success
      showSuccess('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول.');
      
      // Clear form
      signupForm.reset();
      
      // Redirect to login after delay
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);

    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle specific error cases
      let errorMessage = 'حدث خطأ في إنشاء الحساب';
      
      if (error.message.includes('Email مستخدم من قبل') || 
          error.message.includes('Duplicate entry') ||
          error.message.includes('already exists')) {
        errorMessage = 'البريد الإلكتروني مستخدم من قبل';
      } else if (error.message.includes('validation')) {
        errorMessage = 'بيانات غير صحيحة. يرجى المراجعة والمحاولة مرة أخرى.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'خطأ في الاتصال بالخادم';
      } else {
        errorMessage = error.message;
      }

      showError(errorMessage);
      
    } finally {
      // Hide loading state
      hideLoading(signupBtn, 'إنشاء حساب');
    }
  });

  // Handle login link
  if (loginLink) {
    loginLink.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'login.html';
    });
  }

  // Real-time validation feedback
  nameInput.addEventListener('blur', function() {
    const name = this.value.trim();
    if (name && name.length < 2) {
      showFieldError(this, 'الاسم يجب أن يكون أكثر من حرفين');
    } else if (name) {
      clearFieldError(this);
    }
  });

  nameInput.addEventListener('input', function() {
    if (this.value.trim()) {
      clearFieldError(this);
    }
  });

  emailInput.addEventListener('blur', function() {
    const email = this.value.trim();
    if (email && !isValidEmail(email)) {
      showFieldError(this, 'البريد الإلكتروني غير صحيح');
    } else if (email) {
      clearFieldError(this);
    }
  });

  emailInput.addEventListener('input', function() {
    if (this.value.trim()) {
      clearFieldError(this);
    }
  });

  passwordInput.addEventListener('blur', function() {
    const password = this.value.trim();
    if (password && password.length < 6) {
      showFieldError(this, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    } else if (password) {
      clearFieldError(this);
      
      // Also validate confirm password if it has a value
      if (confirmPasswordInput && confirmPasswordInput.value.trim()) {
        validateConfirmPassword();
      }
    }
  });

  passwordInput.addEventListener('input', function() {
    if (this.value.trim()) {
      clearFieldError(this);
    }
  });

  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('blur', validateConfirmPassword);
    confirmPasswordInput.addEventListener('input', function() {
      if (this.value.trim()) {
        clearFieldError(this);
      }
    });
  }

  if (employeeIdInput) {
    employeeIdInput.addEventListener('blur', function() {
      const employeeId = this.value.trim();
      if (employeeId && (isNaN(employeeId) || parseInt(employeeId) <= 0)) {
        showFieldError(this, 'رقم الموظف يجب أن يكون رقماً صحيحاً');
      } else if (employeeId) {
        clearFieldError(this);
      }
    });

    employeeIdInput.addEventListener('input', function() {
      if (this.value.trim()) {
        clearFieldError(this);
      }
    });
  }

  // Validate confirm password
  function validateConfirmPassword() {
    if (!confirmPasswordInput) return;
    
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
    
    if (confirmPassword && password !== confirmPassword) {
      showFieldError(confirmPasswordInput, 'كلمات المرور غير متطابقة');
    } else if (confirmPassword) {
      clearFieldError(confirmPasswordInput);
    }
  }

  // Password strength indicator
  function updatePasswordStrength() {
    const password = passwordInput.value;
    const strengthIndicator = document.getElementById('passwordStrength');
    
    if (!strengthIndicator) return;
    
    let strength = 0;
    let strengthText = '';
    let strengthColor = '';
    
    if (password.length >= 6) strength += 1;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 1;
    if (password.match(/\d/)) strength += 1;
    if (password.match(/[^a-zA-Z\d]/)) strength += 1;
    
    switch (strength) {
      case 0:
      case 1:
        strengthText = 'ضعيفة';
        strengthColor = '#dc3545';
        break;
      case 2:
        strengthText = 'متوسطة';
        strengthColor = '#ffc107';
        break;
      case 3:
        strengthText = 'جيدة';
        strengthColor = '#28a745';
        break;
      case 4:
        strengthText = 'قوية';
        strengthColor = '#007bff';
        break;
    }
    
    strengthIndicator.textContent = password ? `قوة كلمة المرور: ${strengthText}` : '';
    strengthIndicator.style.color = strengthColor;
  }

  // Add password strength indicator if password field exists
  if (passwordInput) {
    const strengthDiv = document.createElement('div');
    strengthDiv.id = 'passwordStrength';
    strengthDiv.style.cssText = `
      font-size: 12px;
      margin-top: 5px;
      text-align: right;
    `;
    passwordInput.parentNode.appendChild(strengthDiv);
    
    passwordInput.addEventListener('input', updatePasswordStrength);
  }
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

// Add CSS for error states and animations
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
  
  #passwordStrength {
    transition: color 0.3s ease;
  }
`;
document.head.appendChild(style);
