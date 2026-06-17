// Commissioner Manager - API-Driven Version
// Handles commissioner tickets via backend API

class CommissionerManager {
  constructor() {
    this.USER_KEY = 'authUser';
    this.apiClient = window.apiClient;

    this.PERMISSION_TYPES = {
      CLEARANCE: 'clearance',
      ONBOARDING: 'onboarding',
      DIRECT: 'direct',
      DELEGATION: 'delegation',
    };

    this.REQUEST_STATUSES = {
      PENDING: 'قيد الاعتماد',
      WAITING: 'قيد الانتظار',
      REVIEW: 'قيد المراجعة',
      QUEUED: 'منتظر',
      APPROVED: 'موافق عليه',
      REJECTED: 'مرفوض',
    };

    this.APPROVER_STATUSES = {
      CURRENT: 'قيد الاعتماد',
      WAITING: 'منتظر',
      APPROVED: 'موافق',
      REJECTED: 'مرفوض',
    };

    this.PENDING_REQUEST_STATUSES = [
      this.REQUEST_STATUSES.PENDING,
      this.REQUEST_STATUSES.WAITING,
      this.REQUEST_STATUSES.REVIEW,
      this.REQUEST_STATUSES.QUEUED,
    ];

    // Cache for tickets
    this.ticketsCache = null;
    this.lastFetch = null;
    this.CACHE_DURATION = 60000; // 1 minute
  }

  _normalizeEmail(email) {
    return (email || '').trim().toLowerCase();
  }

  _now() {
    return Date.now();
  }

  // API Methods
  
  /**
   * Fetch commissioner tickets from API
   */
  async fetchCommissionerTickets(forceRefresh = false) {
    try {
      // Use cache if available and fresh
      if (!forceRefresh && this.ticketsCache && this.lastFetch && 
          (Date.now() - this.lastFetch < this.CACHE_DURATION)) {
        return this.ticketsCache;
      }

      if (!this.apiClient) {
        console.warn('API client not available');
        return [];
      }

      // Check if current user is admin - use /all endpoint, otherwise use /mine
      const authUser = JSON.parse(localStorage.getItem(this.USER_KEY) || '{}');
      const isAdmin = authUser.role === 'admin' || (authUser.roles && authUser.roles.includes('ADMIN'));
      
      const endpoint = isAdmin ? '/commissioner/tickets/all' : '/commissioner/tickets/mine';
      const response = await this.apiClient.makeRequest(endpoint);
      
      if (response && response.success) {
        this.ticketsCache = response.data || [];
        this.lastFetch = Date.now();
        console.log(`✅ Fetched ${this.ticketsCache.length} commissioner tickets`);
        return this.ticketsCache;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch commissioner tickets:', error);
      return [];
    }
  }

  /**
   * Issue a new commissioner ticket
   */
  async issueCommissionerTicket(data) {
    try {
      if (!this.apiClient) {
        throw new Error('API client not available');
      }

      const response = await this.apiClient.makeRequest('/commissioner/tickets', {
        method: 'POST',
        body: JSON.stringify({
          subjectUserId: data.subjectUserId,
          scopes: data.scopes || [this.PERMISSION_TYPES.CLEARANCE],
          validFrom: data.validFrom || new Date().toISOString(),
          validTo: data.validTo,
        })
      });

      if (response && response.success) {
        console.log('✅ Commissioner ticket issued:', response.data);
        // Clear cache to force refresh
        this.ticketsCache = null;
        return response.data;
      }

      throw new Error('Failed to issue ticket');
    } catch (error) {
      console.error('Failed to issue commissioner ticket:', error);
      throw error;
    }
  }

  /**
   * Revoke a commissioner ticket
   */
  async revokeCommissionerTicket(ticketId) {
    try {
      if (!this.apiClient) {
        throw new Error('API client not available');
      }

      const response = await this.apiClient.makeRequest(`/commissioner/tickets/${ticketId}/revoke`, {
        method: 'POST'
      });

      if (response && response.success) {
        console.log('✅ Commissioner ticket revoked:', ticketId);
        // Clear cache to force refresh
        this.ticketsCache = null;
        return response.data;
      }

      throw new Error('Failed to revoke ticket');
    } catch (error) {
      console.error('Failed to revoke commissioner ticket:', error);
      throw error;
    }
  }

  /**
   * Get user's commissioner status from tickets
   */
  async getUserCommissionerStatus(userEmail) {
    const normalizedEmail = this._normalizeEmail(userEmail);
    const tickets = await this.fetchCommissionerTickets();
    const now = new Date();

    // Find active ticket for this user
    const activeTicket = tickets.find(ticket => {
      const validFrom = new Date(ticket.valid_from);
      const validTo = new Date(ticket.valid_to);
      return !ticket.revoked_at && now >= validFrom && now <= validTo;
    });

    if (activeTicket) {
      const scopes = JSON.parse(activeTicket.scopes_json || '[]');
      return {
        isCommissioner: true,
        status: 'active',
        ticket: activeTicket,
        permissions: scopes,
        validUntil: activeTicket.valid_to
      };
    }

    // Check for pending tickets (future dated)
    const pendingTicket = tickets.find(ticket => {
      const validFrom = new Date(ticket.valid_from);
      return !ticket.revoked_at && now < validFrom;
    });

    if (pendingTicket) {
      const scopes = JSON.parse(pendingTicket.scopes_json || '[]');
      return {
        isCommissioner: false,
        status: 'pending',
        ticket: pendingTicket,
        permissions: scopes,
        validFrom: pendingTicket.valid_from
      };
    }

    return {
      isCommissioner: false,
      status: 'none',
      ticket: null,
      permissions: []
    };
  }

  /**
   * Accept commissioner invitation (update user's flags)
   */
  acceptCommissioner(userEmail) {
    // For now, acceptance is handled client-side by setting flags
    // In a full implementation, this would call a backend endpoint
    const authUser = JSON.parse(localStorage.getItem(this.USER_KEY) || '{}');
    const targetEmail = this._normalizeEmail(authUser.email);
    
    if (targetEmail !== this._normalizeEmail(userEmail)) {
      console.warn('Cannot accept commissioner for different user');
      return false;
    }

    // Set commissioner flags
    authUser.isCommissioner = true;
    authUser.commissionerAccepted = true;
    authUser.commissionerAcceptedAt = new Date().toISOString();
    
    localStorage.setItem(this.USER_KEY, JSON.stringify(authUser));
    console.log('✅ Commissioner invitation accepted');
    return true;
  }

  /**
   * Decline commissioner invitation
   */
  declineCommissioner(userEmail) {
    const authUser = JSON.parse(localStorage.getItem(this.USER_KEY) || '{}');
    const targetEmail = this._normalizeEmail(authUser.email);
    
    if (targetEmail !== this._normalizeEmail(userEmail)) {
      console.warn('Cannot decline commissioner for different user');
      return false;
    }

    // Remove commissioner flags
    authUser.isCommissioner = false;
    authUser.commissionerAccepted = false;
    authUser.commissionerDeclinedAt = new Date().toISOString();
    
    localStorage.setItem(this.USER_KEY, JSON.stringify(authUser));
    console.log('⚠️ Commissioner invitation declined');
    return true;
  }

  /**
   * Apply commissioner privileges to current user
   */
  async _applyPrivileges(email) {
    const authUserRaw = localStorage.getItem(this.USER_KEY);
    if (!authUserRaw) return;

    const authUser = JSON.parse(authUserRaw);
    const targetEmail = this._normalizeEmail(authUser.email);
    if (targetEmail !== this._normalizeEmail(email)) return;

    const status = await this.getUserCommissionerStatus(authUser.email);
    const isActiveCommissioner = status.isCommissioner && status.status === 'active';

    authUser.originalRole = authUser.originalRole || authUser.role || 'employee';
    authUser.originalRoles = authUser.originalRoles || authUser.roles || ['EMPLOYEE'];

    if (isActiveCommissioner) {
      // DO NOT overwrite authUser.role - this causes redirect issues
      // Keep original role intact and use commissioner flags instead
      authUser.isCommissioner = true;
      authUser.commissioner = status.ticket;
      authUser.commissionerPermissions = status.permissions || [];
    } else {
      authUser.isCommissioner = false;
      authUser.commissioner = null;
      authUser.commissionerPermissions = [];
    }

    localStorage.setItem(this.USER_KEY, JSON.stringify(authUser));
  }

  /**
   * Cleanup expired commissions
   */
  async cleanupExpiredCommissions() {
    // API handles expiration automatically
    // Just clear cache to force refresh
    this.ticketsCache = null;
    console.log('✅ Cache cleared - expired tickets will be filtered on next fetch');
  }

  /**
   * Get commissioner stats
   */
  async getCommissionerStats() {
    const tickets = await this.fetchCommissionerTickets();
    const now = new Date();

    const stats = {
      total: tickets.length,
      active: 0,
      pending: 0,
      expired: 0,
      revoked: 0
    };

    tickets.forEach(ticket => {
      const validFrom = new Date(ticket.valid_from);
      const validTo = new Date(ticket.valid_to);

      if (ticket.revoked_at) {
        stats.revoked++;
      } else if (now < validFrom) {
        stats.pending++;
      } else if (now > validTo) {
        stats.expired++;
      } else {
        stats.active++;
      }
    });

    return stats;
  }

  /**
   * Get all commissioner data (for compatibility)
   */
  async getAllCommissionerData() {
    return await this.fetchCommissionerTickets();
  }

  /**
   * Get formatted expiration time
   */
  getFormattedExpirationTime(expirationDate) {
    if (!expirationDate) return 'غير محدد';
    
    const expiry = new Date(expirationDate);
    const now = new Date();
    const diffMs = expiry - now;
    
    if (diffMs <= 0) return 'منتهي';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} يوم`;
    } else {
      return `${diffHours} ساعة`;
    }
  }

  /**
   * Check if user has specific commissioner permission
   */
  hasPermission(userEmail, permissionType) {
    if (!this.ticketsCache) return false;
    
    const now = new Date();
    const activeTicket = this.ticketsCache.find(ticket => {
      const validFrom = new Date(ticket.valid_from);
      const validTo = new Date(ticket.valid_to);
      return !ticket.revoked_at && now >= validFrom && now <= validTo;
    });

    if (!activeTicket) return false;

    const scopes = JSON.parse(activeTicket.scopes_json || '[]');
    return scopes.includes(permissionType);
  }

  /**
   * Commissioner approve (for compatibility - now just returns true/false)
   * Actual approval should be done through regular approval API
   */
  commissionerApprove(requestId, requestType, note, userEmail) {
    console.log('Commissioner approve:', requestId, requestType, note);
    // The actual approval is handled by the regular approval system
    // This just validates that user is a commissioner
    return this.hasPermission(userEmail, requestType);
  }

  /**
   * Commissioner reject (for compatibility)
   */
  commissionerReject(requestId, requestType, note, userEmail) {
    console.log('Commissioner reject:', requestId, requestType, note);
    // The actual rejection is handled by the regular rejection system
    // This just validates that user is a commissioner
    return this.hasPermission(userEmail, requestType);
  }
}

// Initialize global instance
if (!window.CommissionerManager) {
  window.CommissionerManager = new CommissionerManager();
}
