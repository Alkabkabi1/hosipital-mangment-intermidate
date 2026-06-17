/**
 * Confirmation Dialog System
 * Replaces confirm() calls with modern, styled dialogs
 */

class ConfirmationDialog {
  constructor() {
    this.init();
  }

  init() {
    // Create dialog container if it doesn't exist
    if (!document.getElementById('confirmation-dialog-container')) {
      this.container = document.createElement('div');
      this.container.id = 'confirmation-dialog-container';
      this.container.className = 'confirmation-dialog-container';
      document.body.appendChild(this.container);
      
      this.addStyles();
    } else {
      this.container = document.getElementById('confirmation-dialog-container');
    }
  }

  addStyles() {
    if (document.getElementById('confirmation-dialog-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'confirmation-dialog-styles';
    style.textContent = `
      .confirmation-dialog-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        font-family: 'Tajawal', system-ui, sans-serif;
        direction: rtl;
      }

      .confirmation-dialog-container.show {
        display: flex;
      }

      .confirmation-dialog {
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 450px;
        width: 90%;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        animation: dialogSlideIn 0.3s ease-out;
      }

      @keyframes dialogSlideIn {
        from {
          transform: scale(0.9);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }

      .confirmation-dialog-header {
        padding: 20px 24px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .confirmation-dialog-title {
        font-size: 18px;
        font-weight: 800;
        color: #1f2937;
        margin: 0;
      }

      .confirmation-dialog-close {
        background: none;
        border: none;
        font-size: 24px;
        color: #6b7280;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        transition: all 0.2s;
      }

      .confirmation-dialog-close:hover {
        background: #f3f4f6;
        color: #374151;
      }

      .confirmation-dialog-body {
        padding: 24px;
        color: #4b5563;
        line-height: 1.6;
        font-size: 15px;
      }

      .confirmation-dialog-footer {
        padding: 16px 24px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      .confirmation-dialog-btn {
        padding: 10px 20px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        border: 1px solid #e5e7eb;
        transition: all 0.2s;
        min-width: 100px;
      }

      .confirmation-dialog-btn-secondary {
        background: #fff;
        color: #374151;
      }

      .confirmation-dialog-btn-secondary:hover {
        background: #f9fafb;
        border-color: #d1d5db;
      }

      .confirmation-dialog-btn-primary {
        background: #2B6CB0;
        color: #fff;
        border-color: #2B6CB0;
      }

      .confirmation-dialog-btn-primary:hover {
        background: #245a95;
        border-color: #245a95;
      }

      .confirmation-dialog-btn-danger {
        background: #dc2626;
        color: #fff;
        border-color: #dc2626;
      }

      .confirmation-dialog-btn-danger:hover {
        background: #b91c1c;
        border-color: #b91c1c;
      }

      @media (max-width: 768px) {
        .confirmation-dialog {
          width: 95%;
          margin: 20px;
        }

        .confirmation-dialog-footer {
          flex-direction: column-reverse;
        }

        .confirmation-dialog-btn {
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  show(options) {
    return new Promise((resolve) => {
      const {
        title = 'تأكيد العملية',
        message = 'هل أنت متأكد من تنفيذ هذه العملية؟',
        confirmText = 'نعم',
        cancelText = 'إلغاء',
        type = 'warning', // 'warning', 'danger', 'info'
        confirmButtonClass = 'confirmation-dialog-btn-primary'
      } = options;

      const dialog = document.createElement('div');
      dialog.className = 'confirmation-dialog';

      const buttonClass = type === 'danger' 
        ? 'confirmation-dialog-btn-danger' 
        : confirmButtonClass;

      dialog.innerHTML = `
        <div class="confirmation-dialog-header">
          <h3 class="confirmation-dialog-title">${title}</h3>
          <button class="confirmation-dialog-close" aria-label="إغلاق">×</button>
        </div>
        <div class="confirmation-dialog-body">
          ${message}
        </div>
        <div class="confirmation-dialog-footer">
          <button class="confirmation-dialog-btn confirmation-dialog-btn-secondary" data-action="cancel">
            ${cancelText}
          </button>
          <button class="confirmation-dialog-btn ${buttonClass}" data-action="confirm">
            ${confirmText}
          </button>
        </div>
      `;

      const container = this.container;
      container.innerHTML = '';
      container.appendChild(dialog);
      container.classList.add('show');

      const cleanup = () => {
        container.classList.remove('show');
        setTimeout(() => {
          container.innerHTML = '';
        }, 300);
      };

      // Handle button clicks
      dialog.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action') || 
                      e.target.closest('[data-action]')?.getAttribute('data-action');
        
        if (action === 'confirm') {
          cleanup();
          resolve(true);
        } else if (action === 'cancel' || e.target.classList.contains('confirmation-dialog-close')) {
          cleanup();
          resolve(false);
        }
      });

      // Close on escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          cleanup();
          resolve(false);
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
    });
  }
}

// Global instance
const confirmationDialog = new ConfirmationDialog();

// Global function for easy access (replaces confirm())
function showConfirm(options) {
  if (typeof options === 'string') {
    // Simple string message - backward compatible
    return confirmationDialog.show({
      message: options
    });
  }
  return confirmationDialog.show(options);
}

// Make available globally
window.showConfirm = showConfirm;
window.ConfirmationDialog = ConfirmationDialog;

