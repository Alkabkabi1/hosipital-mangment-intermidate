// Advanced Form Validation System
// Provides real-time validation, smart suggestions, and enhanced user feedback

class AdvancedFormValidator {
  constructor() {
    this.validationRules = new Map();
    this.validationMessages = new Map();
    this.customValidators = new Map();
    this.init();
  }

  init() {
    this.setupDefaultRules();
    this.setupEventListeners();
  }

  setupDefaultRules() {
    // Arabic text validation
    this.addRule('arabic', /^[\u0600-\u06FF\s]+$/, 'يجب أن يحتوي النص على أحرف عربية فقط');
    
    // English text validation
    this.addRule('english', /^[a-zA-Z\s]+$/, 'يجب أن يحتوي النص على أحرف إنجليزية فقط');
    
    // Mixed text validation
    this.addRule('mixed', /^[\u0600-\u06FFa-zA-Z\s]+$/, 'النص يحتوي على أحرف غير مسموحة');
    
    // Phone number validation (Saudi format)
    this.addRule('phone', /^(\+966|966|0)?(5[0-9]{8})$/, 'رقم الهاتف غير صحيح (مثال: 0501234567)');
    
    // Employee ID validation
    this.addRule('employee_id', /^EMP-\d{4,6}$/, 'رقم الموظف غير صحيح (مثال: EMP-0001)');
    
    // Reference number validation
    this.addRule('reference', /^[A-Z]{2,4}-\d{3,6}(-\d{4})?$/, 'رقم المرجع غير صحيح (مثال: CLR-001)');
    
    // Saudi ID validation
    this.addRule('saudi_id', /^[12]\d{9}$/, 'رقم الهوية السعودية غير صحيح (10 أرقام تبدأ بـ 1 أو 2)');
    
    // IBAN validation (Saudi)
    this.addRule('iban', /^SA\d{2}\d{20}$/, 'رقم الآيبان غير صحيح (مثال: SA1234567890123456789012)');
    
    // Date validation helpers
    this.addCustomValidator('future_date', (value) => {
      if (!value) return true;
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date > today;
    }, 'التاريخ يجب أن يكون في المستقبل');
    
    this.addCustomValidator('past_date', (value) => {
      if (!value) return true;
      const date = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return date < today;
    }, 'التاريخ يجب أن يكون في الماضي');
    
    this.addCustomValidator('working_day', (value) => {
      if (!value) return true;
      const date = new Date(value);
      const day = date.getDay();
      return day !== 5 && day !== 6; // Not Friday or Saturday
    }, 'يجب اختيار يوم عمل (الأحد - الخميس)');
    
    // Salary range validation
    this.addCustomValidator('salary_range', (value) => {
      if (!value) return true;
      const salary = parseFloat(value.toString().replace(/,/g, ''));
      return salary >= 3000 && salary <= 100000;
    }, 'الراتب يجب أن يكون بين 3,000 و 100,000 ريال');
  }

  setupEventListeners() {
    // Set up global event delegation for form inputs
    document.addEventListener('input', (e) => {
      if (e.target.matches('input, select, textarea')) {
        this.validateFieldRealTime(e.target);
      }
    });

    document.addEventListener('blur', (e) => {
      if (e.target.matches('input, select, textarea')) {
        this.validateField(e.target);
      }
    });

    document.addEventListener('focus', (e) => {
      if (e.target.matches('input, select, textarea')) {
        this.showFieldHints(e.target);
      }
    });
  }

  addRule(name, pattern, message) {
    this.validationRules.set(name, pattern);
    this.validationMessages.set(name, message);
  }

  addCustomValidator(name, validator, message) {
    this.customValidators.set(name, validator);
    this.validationMessages.set(name, message);
  }

  validateField(field) {
    if (!field || field.disabled) return true;

    const value = field.value.trim();
    const rules = this.getFieldRules(field);
    
    // Clear previous errors
    this.clearFieldError(field);
    
    // Check required fields
    if (field.required && !value) {
      this.showFieldError(field, 'هذا الحقل مطلوب');
      return false;
    }

    // Skip validation if field is empty and not required
    if (!value && !field.required) return true;

    // Validate against rules
    for (const rule of rules) {
      if (!this.validateRule(rule, value)) {
        const message = this.validationMessages.get(rule) || 'القيمة المدخلة غير صحيحة';
        this.showFieldError(field, message);
        return false;
      }
    }

    // Show success indicator
    this.showFieldSuccess(field);
    return true;
  }

  validateFieldRealTime(field) {
    // Only show errors for real-time validation if field has been blurred before
    if (!field.dataset.hasBeenBlurred) return;
    
    // Debounce real-time validation
    clearTimeout(field.validationTimeout);
    field.validationTimeout = setTimeout(() => {
      this.validateField(field);
    }, 500);
  }

  validateRule(ruleName, value) {
    // Check regex rules
    if (this.validationRules.has(ruleName)) {
      const pattern = this.validationRules.get(ruleName);
      return pattern.test(value);
    }
    
    // Check custom validators
    if (this.customValidators.has(ruleName)) {
      const validator = this.customValidators.get(ruleName);
      return validator(value);
    }
    
    return true;
  }

  getFieldRules(field) {
    const rules = [];
    
    // Get rules from data attributes
    if (field.dataset.validate) {
      rules.push(...field.dataset.validate.split(','));
    }
    
    // Infer rules from field type and name
    if (field.type === 'email') rules.push('email');
    if (field.type === 'tel' || field.name.includes('phone')) rules.push('phone');
    if (field.name.includes('salary')) rules.push('salary_range');
    if (field.name.includes('date')) {
      if (field.name.includes('start') || field.name.includes('future')) {
        rules.push('future_date', 'working_day');
      }
    }
    
    return rules;
  }

  showFieldError(field, message) {
    if (window.FieldErrorUtils) {
      window.FieldErrorUtils.showFieldError(field, message);
    } else {
      this.fallbackShowError(field, message);
    }
    
    field.classList.add('error');
    field.classList.remove('success');
  }

  showFieldSuccess(field) {
    field.classList.add('success');
    field.classList.remove('error');
    
    // Add success indicator
    const existingIndicator = field.parentNode.querySelector('.field-success');
    if (existingIndicator) return;
    
    const indicator = document.createElement('div');
    indicator.className = 'field-success';
    indicator.innerHTML = '✓';
    indicator.style.cssText = `
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #28a745;
      font-weight: bold;
      font-size: 16px;
      pointer-events: none;
    `;
    
    if (field.parentNode.style.position !== 'relative') {
      field.parentNode.style.position = 'relative';
    }
    
    field.parentNode.appendChild(indicator);
  }

  clearFieldError(field) {
    if (window.FieldErrorUtils) {
      window.FieldErrorUtils.clearFieldError(field);
    } else {
      this.fallbackClearError(field);
    }
    
    field.classList.remove('error', 'success');
    
    // Remove success indicator
    const indicator = field.parentNode.querySelector('.field-success');
    if (indicator) {
      indicator.remove();
    }
  }

  fallbackShowError(field, message) {
    this.fallbackClearError(field);
    
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

  fallbackClearError(field) {
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  showFieldHints(field) {
    const hints = this.getFieldHints(field);
    if (!hints.length) return;
    
    // Remove existing hints
    const existingHint = field.parentNode.querySelector('.field-hint');
    if (existingHint) existingHint.remove();
    
    const hintDiv = document.createElement('div');
    hintDiv.className = 'field-hint';
    hintDiv.innerHTML = hints.join('<br>');
    hintDiv.style.cssText = `
      color: #6c757d;
      font-size: 12px;
      margin-top: 3px;
      text-align: right;
      line-height: 1.3;
    `;
    
    field.parentNode.appendChild(hintDiv);
    
    // Auto-remove hint after focus lost
    const removeHint = () => {
      if (hintDiv.parentNode) {
        hintDiv.remove();
      }
      field.removeEventListener('blur', removeHint);
    };
    
    field.addEventListener('blur', removeHint);
  }

  getFieldHints(field) {
    const hints = [];
    const rules = this.getFieldRules(field);
    
    for (const rule of rules) {
      switch (rule) {
        case 'phone':
          hints.push('مثال: 0501234567 أو +966501234567');
          break;
        case 'employee_id':
          hints.push('مثال: EMP-0001');
          break;
        case 'reference':
          hints.push('مثال: CLR-001 أو DEL-2024-001');
          break;
        case 'saudi_id':
          hints.push('10 أرقام تبدأ بـ 1 أو 2');
          break;
        case 'iban':
          hints.push('مثال: SA1234567890123456789012');
          break;
        case 'salary_range':
          hints.push('بين 3,000 و 100,000 ريال');
          break;
        case 'future_date':
          hints.push('يجب أن يكون التاريخ في المستقبل');
          break;
        case 'working_day':
          hints.push('أيام العمل: الأحد - الخميس');
          break;
      }
    }
    
    return hints;
  }

  validateForm(formId) {
    const form = document.getElementById(formId) || document.querySelector(formId);
    if (!form) return false;
    
    const fields = form.querySelectorAll('input, select, textarea');
    let isValid = true;
    
    for (const field of fields) {
      if (!this.validateField(field)) {
        isValid = false;
      }
    }
    
    return isValid;
  }

  // Smart auto-completion and suggestions
  setupSmartSuggestions(field, suggestions) {
    let currentFocus = -1;
    
    field.addEventListener('input', function() {
      const value = this.value.toLowerCase();
      closeAllLists();
      
      if (!value) return;
      
      const matches = suggestions.filter(item => 
        item.toLowerCase().includes(value)
      ).slice(0, 5);
      
      if (matches.length === 0) return;
      
      const listDiv = document.createElement('div');
      listDiv.className = 'autocomplete-list';
      listDiv.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #ddd;
        border-top: none;
        border-radius: 0 0 8px 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        z-index: 1000;
        max-height: 200px;
        overflow-y: auto;
      `;
      
      matches.forEach((match, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'autocomplete-item';
        itemDiv.textContent = match;
        itemDiv.style.cssText = `
          padding: 10px;
          cursor: pointer;
          border-bottom: 1px solid #eee;
          text-align: right;
        `;
        
        itemDiv.addEventListener('click', () => {
          field.value = match;
          closeAllLists();
          field.dispatchEvent(new Event('input'));
        });
        
        listDiv.appendChild(itemDiv);
      });
      
      field.parentNode.appendChild(listDiv);
      field.parentNode.style.position = 'relative';
    });
    
    function closeAllLists() {
      const lists = document.querySelectorAll('.autocomplete-list');
      lists.forEach(list => list.remove());
    }
    
    document.addEventListener('click', closeAllLists);
  }
}

// Initialize global validator
window.advancedFormValidator = new AdvancedFormValidator();

// Provide global functions
window.validateField = (field) => window.advancedFormValidator.validateField(field);
window.validateForm = (formId) => window.advancedFormValidator.validateForm(formId);
window.setupSmartSuggestions = (field, suggestions) => window.advancedFormValidator.setupSmartSuggestions(field, suggestions);

console.log('✅ Advanced Form Validator initialized');
