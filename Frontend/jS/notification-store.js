(function () {
  const STORAGE_KEY = 'notifications';

  function safeParse(value) {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('NotificationStore: failed to parse stored notifications', error);
      return [];
    }
  }

  function generateId() {
    return `ntf-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  class NotificationStore {
    constructor() {
      this.cache = null;
    }

    getCurrentUser() {
      const userRaw = localStorage.getItem('authUser');
      if (!userRaw) return null;
      try {
        return JSON.parse(userRaw);
      } catch (error) {
        console.warn('NotificationStore: unable to parse authUser', error);
        return null;
      }
    }

    getCurrentEmail() {
      const user = this.getCurrentUser();
      return (user?.email || '').toLowerCase().trim();
    }

    isAdmin() {
      const user = this.getCurrentUser();
      if (!user) return false;
      const legacy = (user.role || '').toLowerCase();
      if (legacy === 'admin') return true;
      if (Array.isArray(user.roles)) {
        return user.roles.map(role => role.toUpperCase()).includes('ADMIN');
      }
      return false;
    }

    isForCurrentUser(notification) {
      const recipient = (notification?.recipient || '').toLowerCase().trim();
      const email = this.getCurrentEmail();
      if (!recipient) return true;
      if (recipient === email) return true;
      if (recipient === 'admins' && this.isAdmin()) return true;
      return false;
    }

    loadAll() {
      return safeParse(localStorage.getItem(STORAGE_KEY));
    }

    saveAll(list) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    getStorageKey() {
      return STORAGE_KEY;
    }

    dispatchUpdates() {
      const current = this.cache ?? this.getAll();
      window.dispatchEvent(new CustomEvent('notifications:updated', { detail: current }));
      window.dispatchEvent(new StorageEvent('storage', {
        key: this.getStorageKey(),
        newValue: JSON.stringify(current)
      }));
    }

    getAll() {
      const all = this.loadAll();
      const filtered = all.filter((notification) => this.isForCurrentUser(notification));
      filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      this.cache = filtered;
      return filtered;
    }

    setAll(updatedSubset) {
      const email = this.getCurrentEmail();
      const all = this.loadAll();
      const updatedMap = new Map(updatedSubset.map((item) => [item.id, item]));

      const merged = all.map((item) => {
        if (this.isForCurrentUser(item) && updatedMap.has(item.id)) {
          return { ...item, ...updatedMap.get(item.id) };
        }
        return item;
      });

      updatedSubset.forEach((item) => {
        if (!merged.some(existing => existing.id === item.id)) {
          merged.unshift({ ...item, recipient: (item.recipient || email || null)?.toLowerCase() || null });
        }
      });

      this.saveAll(merged);
      this.cache = this.getAll();
      this.dispatchUpdates();
    }

    add(notification) {
      const email = this.getCurrentEmail();
      const all = this.loadAll();
      const entry = {
        id: notification?.id || generateId(),
        createdAt: notification?.createdAt || new Date().toISOString(),
        isRead: notification?.isRead ?? false,
        readAt: notification?.readAt || null,
        recipient: (notification?.recipient || email || null)?.toLowerCase() || null,
        ...notification,
      };

      all.unshift(entry);
      this.saveAll(all);
      this.cache = this.getAll();
      this.dispatchUpdates();
      return entry;
    }

    markAsRead(notificationId) {
      const all = this.loadAll();
      const updated = all.map((item) => {
        if (item.id === notificationId && this.isForCurrentUser(item)) {
          return { ...item, isRead: true, readAt: new Date().toISOString() };
        }
        return item;
      });

      this.saveAll(updated);
      this.cache = this.getAll();
      this.dispatchUpdates();
    }

    clearAll() {
      const remaining = this.loadAll().filter((item) => !this.isForCurrentUser(item));
      this.saveAll(remaining);
      this.cache = [];
      this.dispatchUpdates();
    }
  }

  window.NotificationStore = new NotificationStore();
})();
