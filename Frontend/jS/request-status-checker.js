// Request Status Checker - Unified status checking logic
// Use this across all dashboards and pages for consistency

(function() {
  'use strict';

  /**
   * Normalize status value to standard format
   * Handles Arabic and English status values
   */
  function normalizeStatus(status) {
    if (!status) return 'pending';
    
    const statusLower = String(status).toLowerCase();
    
    // Pending statuses
    if (statusLower.includes('قيد') || 
        statusLower.includes('pending') || 
        statusLower.includes('انتظار') ||
        statusLower.includes('مراجعة')) {
      return 'pending';
    }
    
    // Approved/Completed statuses
    if (statusLower.includes('مكتمل') || 
        statusLower.includes('موافق') ||
        statusLower.includes('approved') || 
        statusLower.includes('completed')) {
      return 'approved';
    }
    
    // Rejected statuses
    if (statusLower.includes('مرفوض') || 
        statusLower.includes('rejected')) {
      return 'rejected';
    }
    
    // On hold statuses
    if (statusLower.includes('معلق') || 
        statusLower.includes('hold')) {
      return 'hold';
    }
    
    return 'pending'; // Default to pending if unknown
  }

  /**
   * Check if request is pending (needs approvals)
   */
  function isPending(request) {
    // Method 1: Check approval_progress
    if (request.approval_progress) {
      const progress = request.approval_progress;
      
      // Has pending approvals
      if (progress.pending_count > 0) return true;
      
      // Final decision is still pending
      if (progress.final_decision === 'pending') return true;
      
      // Not all approved yet
      if (progress.total_approvers > 0 && progress.approved_count < progress.total_approvers) {
        // Unless someone rejected
        if (progress.rejected_count === 0) return true;
      }
    }
    
    // Method 2: Check status field
    const normalized = normalizeStatus(request.status);
    return normalized === 'pending' || normalized === 'hold';
  }

  /**
   * Check if request is approved (fully approved by all)
   */
  function isApproved(request) {
    // Method 1: Check approval_progress
    if (request.approval_progress) {
      const progress = request.approval_progress;
      
      // Final decision is approved
      if (progress.final_decision === 'approved') return true;
      
      // All approvers approved (and no rejections)
      if (progress.total_approvers > 0 && 
          progress.approved_count === progress.total_approvers &&
          progress.rejected_count === 0) {
        return true;
      }
    }
    
    // Method 2: Check status field
    const normalized = normalizeStatus(request.status);
    return normalized === 'approved';
  }

  /**
   * Check if request is rejected
   */
  function isRejected(request) {
    // Method 1: Check approval_progress
    if (request.approval_progress) {
      const progress = request.approval_progress;
      
      // Final decision is rejected
      if (progress.final_decision === 'rejected') return true;
      
      // Any approver rejected
      if (progress.rejected_count > 0) return true;
    }
    
    // Method 2: Check status field
    const normalized = normalizeStatus(request.status);
    return normalized === 'rejected';
  }

  /**
   * Check if request is completed (approved OR rejected)
   */
  function isCompleted(request) {
    return isApproved(request) || isRejected(request);
  }

  /**
   * Get display status in Arabic
   */
  function getStatusDisplay(request) {
    if (isRejected(request)) {
      return '❌ مرفوض';
    }
    
    if (isApproved(request)) {
      return '✅ مكتمل';
    }
    
    if (request.approval_progress) {
      const progress = request.approval_progress;
      const approved = progress.approved_count || 0;
      const total = progress.total_approvers || 0;
      
      if (total > 0) {
        return `⏳ قيد الموافقة (${approved}/${total})`;
      }
    }
    
    return '⏳ قيد الاعتماد';
  }

  /**
   * Get status badge class for styling
   */
  function getStatusClass(request) {
    if (isRejected(request)) return 'status-rejected';
    if (isApproved(request)) return 'status-approved';
    return 'status-pending';
  }

  // Export to global window object
  window.RequestStatusChecker = {
    normalizeStatus,
    isPending,
    isApproved,
    isRejected,
    isCompleted,
    getStatusDisplay,
    getStatusClass
  };

  console.log('✅ Request status checker loaded');
})();

