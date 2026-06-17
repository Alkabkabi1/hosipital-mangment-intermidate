// Reset Password Page JavaScript
// Handles password reset functionality

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already logged in
  if (apiClient.isAuthenticated()) {
    redirectToDashboard();
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('token');

  if (resetToken) {
    // Show reset password form
    showResetPasswordForm(resetToken);
  } else {
    // Show request reset form
    showRequestResetForm();
  }
});

// Show password reset request form
function showRequestResetForm() {
  const container = document.getElementById('resetContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="reset-card">
      <div class="logo">
        <img src="public/image.png" alt="Logo">
      </div>
      <h2 class="reset-title">إعادة تعيين كلمة المرور</h2>
      <p class="reset-description">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور</p>
      
      <form id="requestResetForm">
        <div class="form-group">
          <input type="email" id="email" class="input" placeholder="البريد الإلكتروني" required>
        </div>
        
        <button type="submit" id="requestResetBtn" class="btn btn-primary">
          إرسال رابط الإعادة
        </button>
      </form>
      
      <div class="form-footer">
        <a href="login.html" id="backToLogin">العودة لتسجيل الدخول</a>
      </div>
    </div>
  `;

  // Handle form submission
  const form = document.getElementById('requestResetForm');
  const emailInput = document.getElementById('email');
  const submitBtn = document.getElementById('requestResetBtn');

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      showError('البريد الإلكتروني مطلوب');
      return;
    }

    if (!isValidEmail(email)) {
      showError('البريد الإلكتروني غير صحيح');
      return;
    }

    showLoading(submitBtn, 'جاري الإرسال...');

    try {
      const response = await apiClient.makeRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      showSuccess('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
      
      // Show token for development (remove in production)
      if (response.resetToken) {
        console.log('Reset token:', response.resetToken);
        showInfo(`رمز الإعادة (للتطوير): ${response.resetToken}`);
      }

      // Clear form
      form.reset();

    } catch (error) {
      console.error('Reset request error:', error);
      let errorMessage = 'حدث خطأ في إرسال الطلب';
      
      if (error.message.includes('المستخدم غير موجود')) {
        errorMessage = 'البريد الإلكتروني غير مسجل في النظام';
      } else {
        errorMessage = error.message;
      }

      showError(errorMessage);
    } finally {
      hideLoading(submitBtn, 'إرسال رابط الإعادة');
    }
  });
}

// Show reset password form with token
function showResetPasswordForm(token) {
  const container = document.getElementById('resetContainer');
  if (!container) return;

  // First verify the token
  verifyResetToken(token).then(isValid => {
    if (!isValid) {
      showInvalidTokenMessage();
      return;
    }

    container.innerHTML = `
      <div class="reset-card">
        <div class="logo">
          <img src="public/image.png" alt="Logo">
        </div>
        <h2 class="reset-title">تعيين كلمة مرور جديدة</h2>
        <p class="reset-description">أدخل كلمة المرور الجديدة</p>
        
        <form id="resetPasswordForm">
          <input type="hidden" id="resetToken" value="${token}">
          
          <div class="form-group">
            <input type="password" id="newPassword" class="input" placeholder="كلمة المرور الجديدة" required>
          </div>
          
          <div class="form-group">
            <input type="password" id="confirmPassword" class="input" placeholder="تأكيد كلمة المرور" required>
          </div>
          
          <div id="passwordStrength" class="password-strength"></div>
          
          <button type="submit" id="resetPasswordBtn" class="btn btn-primary">
            تعيين كلمة المرور
          </button>
        </form>
        
        <div class="form-footer">
          <a href="login.html" id="backToLogin">العودة لتسجيل الدخول</a>
        </div>
      </div>
    `;

    // Handle form submission
    const form = document.getElementById('resetPasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitBtn = document.getElementById('resetPasswordBtn');

    // Password strength indicator
    newPasswordInput.addEventListener('input', updatePasswordStrength);

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      const newPassword = newPasswordInput.value.trim();
      const confirmPassword = confirmPasswordInput.value.trim();

      // Clear previous errors
      clearFieldErrors();

      let isValid = true;

      // Password validation
      if (!newPassword) {
        showFieldError(newPasswordInput, 'كلمة المرور الجديدة مطلوبة');
        isValid = false;
      } else if (newPassword.length < 6) {
        showFieldError(newPasswordInput, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        isValid = false;
      }

      // Confirm password validation
      if (!confirmPassword) {
        showFieldError(confirmPasswordInput, 'تأكيد كلمة المرور مطلوب');
        isValid = false;
      } else if (newPassword !== confirmPassword) {
        showFieldError(confirmPasswordInput, 'كلمات المرور غير متطابقة');
        isValid = false;
      }

      if (!isValid) return;

      showLoading(submitBtn, 'جاري التحديث...');

      try {
        await apiClient.makeRequest('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({
            token: token,
            password: newPassword
          })
        });

        showSuccess('تم تغيير كلمة المرور بنجاح! يرجى تسجيل الدخول.');
        
        // Redirect to login after delay
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);

      } catch (error) {
        console.error('Password reset error:', error);
        let errorMessage = 'حدث خطأ في تغيير كلمة المرور';
        
        if (error.message.includes('الرمز المميز غير صحيح أو منتهي الصلاحية')) {
          errorMessage = 'انتهت صلاحية الرابط. يرجى طلب رابط جديد.';
        } else {
          errorMessage = error.message;
        }

        showError(errorMessage);
      } finally {
        hideLoading(submitBtn, 'تعيين كلمة المرور');
      }
    });
  });
}

// Verify reset token
async function verifyResetToken(token) {
  try {
    await apiClient.makeRequest(`/auth/verify-reset-token/${token}`, {
      method: 'GET'
    });
    return true;
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
}

// Show invalid token message
function showInvalidTokenMessage() {
  const container = document.getElementById('resetContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="reset-card">
      <div class="logo">
        <img src="public/image.png" alt="Logo">
      </div>
      <h2 class="reset-title">رابط غير صحيح</h2>
      <p class="reset-description error-text">انتهت صلاحية الرابط أو أنه غير صحيح</p>
      
      <div class="form-actions">
        <a href="reset-password.html" class="btn btn-primary">طلب رابط جديد</a>
        <a href="login.html" class="btn btn-secondary">العودة لتسجيل الدخول</a>
      </div>
    </div>
  `;
}

// Password strength indicator
function updatePasswordStrength() {
  const password = document.getElementById('newPassword').value;
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

// Helper functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

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

function clearFieldError(field) {
  field.classList.remove('error');
  const errorDiv = field.parentNode.querySelector('.field-error');
  if (errorDiv) {
    errorDiv.remove();
  }
}

function clearFieldErrors() {
  const errorElements = document.querySelectorAll('.field-error');
  errorElements.forEach(error => error.remove());
  
  const errorFields = document.querySelectorAll('.error');
  errorFields.forEach(field => field.classList.remove('error'));
}

function showInfo(message, duration = 5000) {
  const alert = document.createElement('div');
  alert.className = 'alert alert-info';
  alert.textContent = message;
  alert.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #d1ecf1;
    color: #0c5460;
    padding: 15px 20px;
    border: 1px solid #bee5eb;
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

// Add CSS
const style = document.createElement('style');
style.textContent = `
  .reset-card {
    max-width: 500px;
    margin: 50px auto;
    background: white;
    padding: 40px;
    border-radius: 16px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.1);
    text-align: center;
  }
  
  .logo img {
    width: 72px;
    height: 72px;
    object-fit: contain;
    background: #f3f4f6;
    border-radius: 12px;
    padding: 10px;
    margin-bottom: 20px;
  }
  
  .reset-title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
    color: #2B6CB0;
  }
  
  .reset-description {
    color: #6b7280;
    margin-bottom: 30px;
    line-height: 1.5;
  }
  
  .error-text {
    color: #dc3545;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .input {
    width: 100%;
    padding: 15px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    font-size: 16px;
    text-align: right;
  }
  
  .input:focus {
    border-color: #2B6CB0;
    box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
    outline: none;
  }
  
  .input.error {
    border-color: #dc3545;
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
  }
  
  .btn {
    width: 100%;
    padding: 15px;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .btn-primary {
    background: #2B6CB0;
    color: white;
  }
  
  .btn-primary:hover {
    background: #1e5a96;
  }
  
  .btn-secondary {
    background: #6b7280;
    color: white;
    margin-top: 10px;
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .form-footer {
    margin-top: 30px;
  }
  
  .form-footer a {
    color: #2B6CB0;
    text-decoration: none;
  }
  
  .form-footer a:hover {
    text-decoration: underline;
  }
  
  .form-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 30px;
  }
  
  .password-strength {
    font-size: 14px;
    margin-bottom: 15px;
    text-align: right;
    transition: color 0.3s ease;
  }
  
  .field-error {
    animation: fadeIn 0.3s ease-in;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);
