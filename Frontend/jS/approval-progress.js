/**
 * Approval Progress Component
 * Visual component to display multi-step approval progress
 * Shows step-by-step approval status for requests
 */

class ApprovalProgress {
  /**
   * Create an approval progress indicator
   * @param {Object} options - Configuration options
   * @param {string} options.containerId - ID of container element
   * @param {Array} options.steps - Array of approval steps
   * @param {number} options.currentStep - Current step index (0-based)
   * @param {string} options.requestType - Type of request (clearance, onboarding, delegation)
   */
  constructor(options = {}) {
    this.containerId = options.containerId || 'approvalProgress';
    this.steps = options.steps || [];
    this.currentStep = options.currentStep || 0;
    this.requestType = options.requestType || 'clearance';
    
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(`Container with ID '${this.containerId}' not found`);
      return;
    }
    
    this.render();
  }
  
  /**
   * Update the progress with new data
   * @param {Array} steps - New steps data
   * @param {number} currentStep - New current step
   */
  update(steps, currentStep) {
    this.steps = steps || this.steps;
    this.currentStep = currentStep !== undefined ? currentStep : this.currentStep;
    this.render();
  }
  
  /**
   * Render the approval progress UI
   */
  render() {
    if (!this.container) return;
    
    // Apply styles
    this.injectStyles();
    
    // Build HTML
    const html = `
      <div class="approval-progress-wrapper">
        <div class="approval-progress-header">
          <h3 class="approval-progress-title">مراحل الموافقة</h3>
          <span class="approval-progress-count">${this.currentStep} / ${this.steps.length}</span>
        </div>
        <div class="approval-progress-steps">
          ${this.steps.map((step, index) => this.renderStep(step, index)).join('')}
        </div>
        ${this.renderTimeline()}
      </div>
    `;
    
    this.container.innerHTML = html;
  }
  
  /**
   * Render a single approval step
   * @param {Object} step - Step data
   * @param {number} index - Step index
   * @returns {string} HTML string
   */
  renderStep(step, index) {
    const isPending = step.status === 'pending';
    const isApproved = step.status === 'approved';
    const isRejected = step.status === 'rejected';
    const isCurrent = index === this.currentStep;
    const isPast = index < this.currentStep;
    
    let statusClass = 'pending';
    let statusIcon = '⏳';
    let statusText = 'في الانتظار';
    
    if (isApproved) {
      statusClass = 'approved';
      statusIcon = '✓';
      statusText = 'موافق';
    } else if (isRejected) {
      statusClass = 'rejected';
      statusIcon = '✗';
      statusText = 'مرفوض';
    } else if (isCurrent) {
      statusClass = 'current';
      statusIcon = '🔄';
      statusText = 'قيد المراجعة';
    }
    
    return `
      <div class="approval-step ${statusClass} ${isCurrent ? 'is-current' : ''} ${isPast ? 'is-past' : ''}">
        <div class="approval-step-indicator">
          <div class="approval-step-icon">${statusIcon}</div>
          <div class="approval-step-line ${index < this.steps.length - 1 ? '' : 'hidden'}"></div>
        </div>
        <div class="approval-step-content">
          <div class="approval-step-header">
            <h4 class="approval-step-title">${step.roleName || step.role_name || 'مراجع'}</h4>
            <span class="approval-step-badge ${statusClass}">${statusText}</span>
          </div>
          <div class="approval-step-details">
            ${step.approver_name ? `<p class="approval-step-approver">👤 ${step.approver_name}</p>` : ''}
            ${step.decided_at ? `<p class="approval-step-date">📅 ${this.formatDate(step.decided_at)}</p>` : ''}
            ${step.decision_note ? `<p class="approval-step-note">💬 ${step.decision_note}</p>` : ''}
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render the timeline summary
   * @returns {string} HTML string
   */
  renderTimeline() {
    const approved = this.steps.filter(s => s.status === 'approved').length;
    const pending = this.steps.filter(s => s.status === 'pending').length;
    const rejected = this.steps.filter(s => s.status === 'rejected').length;
    
    const progress = this.steps.length > 0 ? (approved / this.steps.length) * 100 : 0;
    
    return `
      <div class="approval-progress-summary">
        <div class="approval-progress-bar">
          <div class="approval-progress-bar-fill" style="width: ${progress}%"></div>
        </div>
        <div class="approval-progress-stats">
          <span class="stat stat-approved">✓ ${approved} موافق</span>
          <span class="stat stat-pending">⏳ ${pending} في الانتظار</span>
          ${rejected > 0 ? `<span class="stat stat-rejected">✗ ${rejected} مرفوض</span>` : ''}
        </div>
      </div>
    `;
  }
  
  /**
   * Format date for display
   * @param {number|string} timestamp - Date timestamp or string
   * @returns {string} Formatted date
   */
  formatDate(timestamp) {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  /**
   * Inject CSS styles for the component
   */
  injectStyles() {
    if (document.getElementById('approvalProgressStyles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'approvalProgressStyles';
    styles.textContent = `
      .approval-progress-wrapper {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 20px;
        margin: 16px 0;
      }
      
      .approval-progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid #e5e7eb;
      }
      
      .approval-progress-title {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #1f2937;
      }
      
      .approval-progress-count {
        background: #2B6CB0;
        color: white;
        padding: 4px 12px;
        border-radius: 999px;
        font-size: 14px;
        font-weight: 600;
      }
      
      .approval-progress-steps {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 24px;
      }
      
      .approval-step {
        display: flex;
        gap: 16px;
        position: relative;
      }
      
      .approval-step-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex-shrink: 0;
      }
      
      .approval-step-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: bold;
        background: #f3f4f6;
        border: 3px solid #d1d5db;
        z-index: 2;
      }
      
      .approval-step.approved .approval-step-icon {
        background: #dcfce7;
        border-color: #10b981;
        color: #065f46;
      }
      
      .approval-step.rejected .approval-step-icon {
        background: #fee2e2;
        border-color: #ef4444;
        color: #991b1b;
      }
      
      .approval-step.current .approval-step-icon {
        background: #fef3c7;
        border-color: #f59e0b;
        color: #92400e;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      .approval-step-line {
        width: 3px;
        flex: 1;
        background: #e5e7eb;
        margin-top: 4px;
      }
      
      .approval-step-line.hidden {
        display: none;
      }
      
      .approval-step.approved .approval-step-line {
        background: #10b981;
      }
      
      .approval-step-content {
        flex: 1;
        padding-top: 4px;
      }
      
      .approval-step-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      
      .approval-step-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #374151;
      }
      
      .approval-step-badge {
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
      }
      
      .approval-step-badge.approved {
        background: #dcfce7;
        color: #065f46;
      }
      
      .approval-step-badge.rejected {
        background: #fee2e2;
        color: #991b1b;
      }
      
      .approval-step-badge.pending {
        background: #f3f4f6;
        color: #6b7280;
      }
      
      .approval-step-badge.current {
        background: #fef3c7;
        color: #92400e;
      }
      
      .approval-step-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 14px;
        color: #6b7280;
      }
      
      .approval-step-details p {
        margin: 0;
      }
      
      .approval-step-approver {
        font-weight: 500;
        color: #374151;
      }
      
      .approval-step-date {
        font-size: 13px;
      }
      
      .approval-step-note {
        background: #f9fafb;
        padding: 8px;
        border-radius: 6px;
        margin-top: 4px;
        font-style: italic;
      }
      
      .approval-progress-summary {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 2px solid #e5e7eb;
      }
      
      .approval-progress-bar {
        height: 8px;
        background: #e5e7eb;
        border-radius: 999px;
        overflow: hidden;
        margin-bottom: 12px;
      }
      
      .approval-progress-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #10b981 0%, #059669 100%);
        transition: width 0.3s ease;
      }
      
      .approval-progress-stats {
        display: flex;
        gap: 16px;
        justify-content: center;
        flex-wrap: wrap;
      }
      
      .stat {
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
      }
      
      .stat-approved {
        background: #dcfce7;
        color: #065f46;
      }
      
      .stat-pending {
        background: #f3f4f6;
        color: #6b7280;
      }
      
      .stat-rejected {
        background: #fee2e2;
        color: #991b1b;
      }
      
      @media (max-width: 640px) {
        .approval-progress-wrapper {
          padding: 16px;
        }
        
        .approval-step {
          gap: 12px;
        }
        
        .approval-step-icon {
          width: 32px;
          height: 32px;
          font-size: 16px;
        }
        
        .approval-step-title {
          font-size: 14px;
        }
        
        .approval-step-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  /**
   * Static method to create an approval progress from API data
   * @param {Object} requestData - Request data from API
   * @param {string} containerId - Container element ID
   * @returns {ApprovalProgress} New ApprovalProgress instance
   */
  static fromRequestData(requestData, containerId) {
    const steps = requestData.approvals || [];
    const currentStep = steps.filter(s => s.status === 'approved').length;
    
    return new ApprovalProgress({
      containerId,
      steps,
      currentStep,
      requestType: requestData.request_type || 'clearance'
    });
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.ApprovalProgress = ApprovalProgress;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApprovalProgress;
}

