/**
 * Toast Notification System
 * Replaces alert() calls with modern, non-blocking toast notifications
 */

class ToastManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
      
      // Add CSS styles if not already added
      this.addStyles();
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  addStyles() {
    if (document.getElementById('toast-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      .toast-container {
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
      }

      .toast {
        min-width: 300px;
        max-width: 450px;
        padding: 14px 18px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        background: #fff;
        border: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        gap: 12px;
        pointer-events: auto;
        animation: slideInLeft 0.3s ease-out;
        position: relative;
        font-family: 'Tajawal', system-ui, sans-serif;
        direction: rtl;
      }

      .toast.toast-success {
        border-right: 4px solid #16a34a;
      }

      .toast.toast-error {
        border-right: 4px solid #dc2626;
      }

      .toast.toast-warning {
        border-right: 4px solid #f59e0b;
      }

      .toast.toast-info {
        border-right: 4px solid #2563eb;
      }

      .toast-icon {
        font-size: 20px;
        flex-shrink: 0;
      }

      .toast-content {
        flex: 1;
        font-size: 14px;
        color: #1f2937;
        line-height: 1.5;
      }

      .toast-close {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 20px;
        color: #6b7280;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: color 0.2s;
      }

      .toast-close:hover {
        color: #374151;
      }

      @keyframes slideInLeft {
        from {
          transform: translateX(-100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOutLeft {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(-100%);
          opacity: 0;
        }
      }

      .toast-removing {
        animation: slideOutLeft 0.3s ease-in forwards;
      }

      @media (max-width: 768px) {
        .toast-container {
          top: 10px;
          left: 10px;
          right: 10px;
        }

        .toast {
          min-width: auto;
          max-width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  show(message, type = 'info', duration = 4000) {
    if (!this.container) this.init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-content">${message}</span>
      <button class="toast-close" onclick="this.closest('.toast').remove()" aria-label="إغلاق">×</button>
    `;

    this.container.appendChild(toast);

    // Auto remove after duration
    const timer = setTimeout(() => {
      this.remove(toast);
    }, duration);

    // Allow manual close
    toast.addEventListener('click', (e) => {
      if (e.target.classList.contains('toast-close') || e.target.closest('.toast-close')) {
        clearTimeout(timer);
        this.remove(toast);
      }
    });

    return toast;
  }

  remove(toast) {
    if (!toast || !toast.parentNode) return;
    
    toast.classList.add('toast-removing');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

// Global instance
const toastManager = new ToastManager();

// Global function for easy access
function showToast(message, type = 'info', duration = 4000) {
  return toastManager.show(message, type, duration);
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ToastManager, showToast };
}

// Make available globally
window.showToast = showToast;
window.ToastManager = ToastManager;

