// Workflow Manager - Central approval workflow logic
// Handles multi-level approval workflows with department tracking

class WorkflowManager {
  constructor() {
    this.STORAGE_KEYS = {
      clearance: 'requestsClearance',
      onboarding: 'requestsOnboarding',
      direct: 'requestsDirect',
      notifications: 'notifications'
    };
    
    this.STATUSES = {
      PENDING: 'منتظر',
      IN_PROGRESS: 'قيد الاعتماد', 
      APPROVED: 'موافق',
      REJECTED: 'مرفوض',
      COMPLETED: 'مكتمل'
    };

    this.DEPARTMENTS = [
      { id: 'hr', name: 'الموارد البشرية', name_en: 'Human Resources' },
      { id: 'finance', name: 'المالية', name_en: 'Finance' },
      { id: 'it', name: 'تقنية المعلومات', name_en: 'Information Technology' },
      { id: 'admin', name: 'الإدارة', name_en: 'Administration' },
      { id: 'medical', name: 'الشؤون الطبية', name_en: 'Medical Affairs' },
      { id: 'nursing', name: 'التمريض', name_en: 'Nursing' },
      { id: 'pharmacy', name: 'الصيدلية', name_en: 'Pharmacy' },
      { id: 'lab', name: 'المختبر', name_en: 'Laboratory' }
    ];
  }

  // =====================================================
  // CORE DATA MANAGEMENT
  // =====================================================

  /**
   * Get request by ID and type - Enhanced with API integration
   */
  async getRequest(requestId, type = 'clearance') {
    try {
      // Try to get from API first
      if (window.apiClient) {
        switch (type) {
          case 'clearance':
            return await window.apiClient.getClearanceById(requestId);
          case 'delegation':
            return await window.apiClient.getDelegationById(requestId);
          case 'onboarding':
          case 'direct':
            return await window.apiClient.getOnboardingById(requestId);
        }
      }
    } catch (error) {
      console.warn(`API call failed for ${type} ${requestId}, falling back to localStorage:`, error);
    }
    
    // Fallback to localStorage
    const storageKey = this.STORAGE_KEYS[type];
    const requests = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return requests.find(req => req.id === parseInt(requestId));
  }

  /**
   * Update request in storage - Enhanced with API sync
   */
  async updateRequest(requestId, type, updateFn) {
    try {
      // Try to update via API first
      if (window.apiClient && typeof updateFn === 'object') {
        // If updateFn is an object, it's the update data
        const updateData = updateFn;
        
        switch (type) {
          case 'clearance':
            return await window.apiClient.updateClearanceStatus(requestId, updateData);
          case 'delegation':
            return await window.apiClient.updateDelegationStatus(requestId, updateData);
          case 'onboarding':
          case 'direct':
            return await window.apiClient.updateOnboardingStatus(requestId, updateData);
        }
      }
    } catch (error) {
      console.warn(`API update failed for ${type} ${requestId}, updating localStorage:`, error);
    }
    
    // Fallback to localStorage update
    const storageKey = this.STORAGE_KEYS[type];
    const requests = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const index = requests.findIndex(req => req.id === parseInt(requestId));
    
    if (index >= 0) {
      if (typeof updateFn === 'function') {
        updateFn(requests[index]);
      } else {
        // Merge update data
        Object.assign(requests[index], updateFn);
      }
      localStorage.setItem(storageKey, JSON.stringify(requests));
      return requests[index];
    }
    return null;
  }

  /**
   * Initialize department tracking for a request
   */
  initializeDepartmentTracking(request, requiredDepartments = []) {
    if (!request.departments) {
      request.departments = requiredDepartments.map(deptId => ({
        id: deptId,
        name: this.getDepartmentName(deptId),
        status: this.STATUSES.PENDING,
        approver_id: null,
        approver_name: null,
        approved_at: null,
        notes: null
      }));
    }
    return request;
  }

  // =====================================================
  // APPROVAL CHAIN MANAGEMENT
  // =====================================================

  /**
   * Add approver to request chain
   */
  addApprover(requestId, type, approverData) {
    return this.updateRequest(requestId, type, (request) => {
      if (!request.approvers) request.approvers = [];
      
      const newApprover = {
        name: approverData.name || null,
        role: approverData.role || null,
        email: approverData.email || null,
        department_id: approverData.department_id || null,
        status: this.determineInitialStatus(request.approvers),
        assignedAt: approverData.assignedAt || null,
        dueAt: approverData.dueAt || null,
        approvedAt: null,
        note: null
      };

      request.approvers.push(newApprover);
      
      // Log the action
      this.logAction(request, 'admin', 'إضافة معتمد', 
        `${newApprover.role || newApprover.name || 'معتمد جديد'}`);
    });
  }

  /**
   * Remove approver from chain
   */
  removeApprover(requestId, type, approverIndex) {
    return this.updateRequest(requestId, type, (request) => {
      if (!request.approvers || approverIndex < 0 || approverIndex >= request.approvers.length) {
        return;
      }

      const removedApprover = request.approvers[approverIndex];
      const wasCurrentApprover = removedApprover.status === this.STATUSES.IN_PROGRESS;
      
      request.approvers.splice(approverIndex, 1);
      
      // If we removed the current approver, advance to next
      if (wasCurrentApprover && request.approvers.length > 0) {
        this.advanceToNextApprover(request);
      }
      
      // Log the action
      this.logAction(request, 'admin', 'حذف معتمد', 
        `${removedApprover.role || removedApprover.name || 'معتمد'}`);
    });
  }

  /**
   * Determine initial status for new approver
   */
  determineInitialStatus(existingApprovers) {
    const hasCurrentApprover = existingApprovers.some(a => a.status === this.STATUSES.IN_PROGRESS);
    return hasCurrentApprover ? this.STATUSES.PENDING : this.STATUSES.IN_PROGRESS;
  }

  /**
   * Advance workflow to next approver
   */
  advanceToNextApprover(request) {
    const nextPendingApprover = request.approvers.find(a => {
      const st = a.status;
      const n = (window.normalizeStatus ? window.normalizeStatus(st) : st);
      return n === 'pending' || st === this.STATUSES.PENDING;
    });
    if (nextPendingApprover) {
      nextPendingApprover.status = this.STATUSES.IN_PROGRESS;
      nextPendingApprover.assignedAt = Date.now();
      nextPendingApprover.dueAt = Date.now() + (3 * 24 * 60 * 60 * 1000); // 3 days
    } else if (request.approvers.length > 0) {
      // Fallback: activate first available approver
      request.approvers[0].status = this.STATUSES.IN_PROGRESS;
      request.approvers[0].assignedAt = Date.now();
      request.approvers[0].dueAt = Date.now() + (3 * 24 * 60 * 60 * 1000);
    }
  }

  // =====================================================
  // DEPARTMENT STATUS MANAGEMENT
  // =====================================================

  /**
   * Update department status
   */
  updateDepartmentStatus(requestId, type, departmentId, newStatus, approverInfo = null) {
    return this.updateRequest(requestId, type, (request) => {
      if (!request.departments) return;
      
      const department = request.departments.find(d => d.id === departmentId);
      if (!department) return;
      
      const oldStatus = department.status;
      department.status = newStatus;
      {
        const n = (window.normalizeStatus ? window.normalizeStatus(newStatus) : newStatus);
        department.approved_at = n === 'approved' ? Date.now() : null;
      }
      
      if (approverInfo) {
        department.approver_id = approverInfo.id;
        department.approver_name = approverInfo.name;
        department.notes = approverInfo.notes;
      }
      
      // Log the action
      this.logAction(request, approverInfo?.name || 'admin', 'تحديث حالة القسم', 
        `${department.name}: ${oldStatus} → ${newStatus}`);
      
      // Check if all departments are approved
      this.checkAutoCompletion(request);
    });
  }

  /**
   * Cycle department status (for click-to-cycle interface)
   */
  cycleDepartmentStatus(requestId, type, departmentId) {
    const request = this.getRequest(requestId, type);
    if (!request?.departments) return null;
    
    const department = request.departments.find(d => d.id === departmentId);
    if (!department) return null;
    
    // Cycle through: منتظر → موافق → مرفوض → منتظر
    const statusCycle = [this.STATUSES.PENDING, this.STATUSES.APPROVED, this.STATUSES.REJECTED];
    const currentIndex = statusCycle.indexOf(department.status);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    
    return this.updateDepartmentStatus(requestId, type, departmentId, nextStatus, {
      id: 'admin',
      name: 'مدير النظام',
      notes: 'تحديث يدوي من لوحة الإدارة'
    });
  }

  /**
   * Get department status summary
   */
  getDepartmentStatusSummary(request) {
    if (!request.departments) return { total: 0, approved: 0, rejected: 0, pending: 0 };
    
    const summary = {
      total: request.departments.length,
      approved: request.departments.filter(d => (window.normalizeStatus ? window.normalizeStatus(d.status) : d.status) === 'approved').length,
      rejected: request.departments.filter(d => (window.normalizeStatus ? window.normalizeStatus(d.status) : d.status) === 'rejected').length,
      pending: request.departments.filter(d => (window.normalizeStatus ? window.normalizeStatus(d.status) : d.status) === 'pending').length
    };
    
    summary.completion_percentage = summary.total > 0 ? 
      Math.round((summary.approved / summary.total) * 100) : 0;
    
    return summary;
  }

  // =====================================================
  // WORKFLOW AUTOMATION
  // =====================================================

  /**
   * Check if request should be auto-completed
   */
  checkAutoCompletion(request) {
    if (!request.departments || request.departments.length === 0) return false;
    
    const allApproved = request.departments.every(d => (window.normalizeStatus ? window.normalizeStatus(d.status) : d.status) === 'approved');
    const hasRejected = request.departments.some(d => (window.normalizeStatus ? window.normalizeStatus(d.status) : d.status) === 'rejected');
    
    if (allApproved && request.status !== this.STATUSES.COMPLETED) {
      request.status = this.STATUSES.COMPLETED;
      this.logAction(request, 'system', 'إكمال تلقائي', 'تم اعتماد جميع الأقسام');
      this.sendNotification(`تم إكمال طلب #${request.id} تلقائياً - اعتماد جميع الأقسام`);
      return true;
    } else if (hasRejected && request.status !== this.STATUSES.REJECTED) {
      request.status = this.STATUSES.REJECTED;
      this.logAction(request, 'system', 'رفض تلقائي', 'رفض أحد الأقسام');
      this.sendNotification(`تم رفض طلب #${request.id} تلقائياً - رفض أحد الأقسام`);
      return true;
    }
    
    return false;
  }

  /**
   * Process user approval action
   */
  processApprovalAction(requestId, type, action, approverEmail, note = null) {
    return this.updateRequest(requestId, type, (request) => {
      if (!request.approvers) return;
      
      const approverIndex = request.approvers.findIndex(a => 
        a.status === this.STATUSES.IN_PROGRESS && 
        (a.email === approverEmail || !a.email)
      );
      
      if (approverIndex < 0) return;
      
      const approver = request.approvers[approverIndex];
      const now = Date.now();
      
      if (action === 'approve') {
        approver.status = this.STATUSES.APPROVED;
        approver.approvedAt = now;
        approver.note = note;
        
        // Move to next approver or complete
        if (approverIndex + 1 < request.approvers.length) {
          const nextApprover = request.approvers[approverIndex + 1];
          nextApprover.status = this.STATUSES.IN_PROGRESS;
          nextApprover.assignedAt = now;
          nextApprover.dueAt = now + (3 * 24 * 60 * 60 * 1000);
          
          this.sendNotification(
            `تم اعتماد طلب #${request.id} وتحويله إلى ${nextApprover.name || nextApprover.role || 'المعتمد التالي'}`
          );
        } else {
          request.status = this.STATUSES.COMPLETED;
          this.sendNotification(`تم اعتماد طلب #${request.id} واكتماله`);
        }
        
        this.logAction(request, approver.name || approverEmail, 'اعتماد الطلب', note);
        
      } else if (action === 'reject') {
        approver.status = this.STATUSES.REJECTED;
        approver.approvedAt = now;
        approver.note = note;
        request.status = this.STATUSES.REJECTED;
        
        this.sendNotification(`تم رفض طلب #${request.id}`);
        this.logAction(request, approver.name || approverEmail, 'رفض الطلب', note);
      }
    });
  }

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  /**
   * Get department name by ID
   */
  getDepartmentName(departmentId) {
    const department = this.DEPARTMENTS.find(d => d.id === departmentId);
    return department ? department.name : departmentId;
  }

  /**
   * Log action to request history
   */
  logAction(request, actor, action, note = null) {
    if (!request.history) request.history = [];
    
    request.history.push({
      at: Date.now(),
      by: actor,
      action: action,
      note: note
    });
  }

  /**
   * Send notification
   */
  sendNotification(message, recipient = null) {
    const entry = NotificationStore.add({
      title: message,
      time: new Date().toLocaleString('ar-SA'),
      unread: true,
      recipient
    });

    window.dispatchEvent(new StorageEvent('storage', {
      key: NotificationStore.getStorageKey(),
      newValue: JSON.stringify(NotificationStore.getAll())
    }));

    return entry;
  }

  /**
   * Get requests pending user approval
   */
  getPendingApprovals(userEmail) {
    const pendingApprovals = [];
    
    // Check clearance requests
    const clearanceRequests = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.clearance) || '[]');
    clearanceRequests.forEach(request => {
      const currentApprover = (request.approvers || []).find(a => 
        a.status === this.STATUSES.IN_PROGRESS && 
        (a.email === userEmail || !a.email)
      );
      if (currentApprover) {
        pendingApprovals.push({
          ...request,
          _type: 'clearance',
          _currentApprover: currentApprover
        });
      }
    });
    
    // Check onboarding requests
    const onboardingRequests = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.onboarding) || '[]');
    onboardingRequests.forEach(request => {
      const currentApprover = (request.approvers || []).find(a => 
        a.status === this.STATUSES.IN_PROGRESS && 
        (a.email === userEmail || !a.email)
      );
      if (currentApprover) {
        pendingApprovals.push({
          ...request,
          _type: 'onboarding',
          _currentApprover: currentApprover
        });
      }
    });
    
    return pendingApprovals;
  }

  /**
   * Generate workflow statistics
   */
  getWorkflowStatistics() {
    const stats = {
      total_requests: 0,
      pending_requests: 0,
      completed_requests: 0,
      rejected_requests: 0,
      overdue_approvals: 0
    };
    
    const now = Date.now();
    
    [this.STORAGE_KEYS.clearance, this.STORAGE_KEYS.onboarding].forEach(key => {
      const requests = JSON.parse(localStorage.getItem(key) || '[]');
      
      requests.forEach(request => {
        stats.total_requests++;
        
        if (request.status === this.STATUSES.COMPLETED) {
          stats.completed_requests++;
        } else if (request.status === this.STATUSES.REJECTED) {
          stats.rejected_requests++;
        } else {
          stats.pending_requests++;
          
          // Check for overdue approvals
          const currentApprover = (request.approvers || []).find(a => 
            a.status === this.STATUSES.IN_PROGRESS
          );
          if (currentApprover?.dueAt && currentApprover.dueAt < now) {
            stats.overdue_approvals++;
          }
        }
      });
    });
    
    return stats;
  }
}

// Create global instance
window.WorkflowManager = new WorkflowManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorkflowManager;
}
