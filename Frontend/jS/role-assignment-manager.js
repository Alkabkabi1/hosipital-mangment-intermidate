class RoleAssignmentManager {
  constructor() {
    this.USER_KEY = 'authUser';
    this.cache = new Map();
    this.cacheExpiresAt = 0;
    this.cacheTtlMs = 30000;
  }

  _normalizeEmail(email) {
    return (email || '').trim().toLowerCase();
  }

  _getAuthUser() {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn('Failed to parse authUser from storage', error);
      return null;
    }
  }

  _requireApiClient() {
    if (!window.apiClient) {
      throw new Error('apiClient is not initialized. Ensure api-client.js is loaded before using RoleAssignmentManager.');
    }
  }

  async _loadAssignments() {
    this._requireApiClient();
    const users = await window.apiClient.getUsersWithRoles();
    this.cache.clear();
    users
      .filter((user) => user && user.email)
      .forEach((user) => {
        const normalized = this._normalizeEmail(user.email);
        this.cache.set(normalized, {
          ...user,
          roles: Array.isArray(user.roles) ? user.roles.map((role) => role.toUpperCase()) : [],
        });
      });
    this.cacheExpiresAt = Date.now() + this.cacheTtlMs;
  }

  async _ensureCache() {
    if (!this.cache.size || Date.now() > this.cacheExpiresAt) {
      await this._loadAssignments();
    }
  }

  async refresh() {
    await this._loadAssignments();
  }

  _createAssignment(user, role) {
    const upperRole = role.toUpperCase();
    return {
      id: [user.id, upperRole].join(':'),
      userId: user.id,
      to: user.email,
      from: 'system',
      role: upperRole,
      scopes: [upperRole],
      status: 'active',
      active: true,
    };
  }

  async getAssignmentsFor(email) {
    if (!email) return [];
    await this._ensureCache();
    const normalized = this._normalizeEmail(email);
    const user = this.cache.get(normalized);
    if (!user) return [];
    return (user.roles || []).map((role) => this._createAssignment(user, role));
  }

  async applyRolesForEmail(email) {
    const authUser = this._getAuthUser();
    if (!authUser || this._normalizeEmail(authUser.email) !== this._normalizeEmail(email)) {
      return authUser;
    }

    const assignments = await this.getAssignmentsFor(email);
    const scopes = new Set();
    assignments.forEach((assignment) => {
      (assignment.scopes || []).forEach((scope) => scopes.add(scope.toUpperCase()));
    });

    authUser.originalRole = authUser.originalRole || authUser.role || 'employee';
    authUser.originalRoles = authUser.originalRoles || authUser.roles || ['EMPLOYEE'];

    if (scopes.size) {
      const activeRoles = Array.from(scopes);
      authUser.roles = activeRoles;
      authUser.role = activeRoles.includes('ADMIN') ? 'admin' : activeRoles[0].toLowerCase();
    } else {
      authUser.roles = authUser.originalRoles;
      authUser.role = authUser.originalRole;
    }

    localStorage.setItem(this.USER_KEY, JSON.stringify(authUser));
    return authUser;
  }

  async applyRolesForCurrentUser() {
    const authUser = this._getAuthUser();
    if (!authUser || !authUser.email) return authUser;
    return this.applyRolesForEmail(authUser.email);
  }

  async acceptAssignment(assignmentId, acceptedBy, note) {
    await this._ensureCache();
    const assignments = await this.getAssignmentsFor(acceptedBy);
    const assignment = assignments.find((item) => item.id === assignmentId);
    if (!assignment) return null;
    return {
      ...assignment,
      status: 'active',
      active: true,
      acceptedBy,
      acceptNote: note || null,
    };
  }

  async rejectAssignment(assignmentId, rejectedBy, reason) {
    this._requireApiClient();
    const parts = (assignmentId || '').split(':');
    if (parts.length !== 2) return null;
    const userId = Number(parts[0]);
    const role = parts[1];
    if (!userId || !role) return null;

    const normalizedRole = role.toUpperCase();
    if (normalizedRole === 'EMPLOYEE') {
      console.warn('Cannot remove base EMPLOYEE role assignment');
      return null;
    }

    await window.apiClient.removeRole(userId, normalizedRole);
    await this.refresh();
    await this.applyRolesForEmail(rejectedBy);
    return {
      id: assignmentId,
      userId,
      role: normalizedRole,
      rejectedBy,
      rejectReason: reason || null,
      status: 'rejected',
      active: false,
    };
  }
}

window.RoleAssignmentManager = new RoleAssignmentManager();
