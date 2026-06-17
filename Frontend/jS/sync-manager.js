// Sync Manager - Handles offline-to-online synchronization
// Ensures data consistency between localStorage and backend API

class SyncManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.lastSyncTime = null;
    this.syncInProgress = false;
    this.maxRetries = 3;
    this.retryDelay = 5000; // legacy default (unused with new backoff)
    this.KNOWN_KEYS = ['requestsClearance', 'requestsOnboarding', 'requestsDelegation'];
    this._processing = false;
    this.init();
  }

  init() {
    this.setupNetworkMonitoring();
    this.loadSyncQueue();
    this.startPeriodicSync();
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel('sync-events');
        this.channel.onmessage = (ev) => {
          const data = ev && ev.data ? ev.data : {};
          if (data && data.key && data.list) {
            try {
              window.dispatchEvent(new CustomEvent('sync:updated', { detail: { key: data.key, list: data.list } }));
            } catch (_) {}
          }
        };
      }
    } catch (_) {}
    console.log('✓ Sync Manager initialized');
  }

  setupNetworkMonitoring() {
    // Monitor network status changes
    window.addEventListener('online', () => {
      console.log('🟢 Network back online - starting sync...');
      this.isOnline = true;
      this.performFullSync();
    });

    window.addEventListener('offline', () => {
      console.log('🔴 Network offline - queueing operations...');
      this.isOnline = false;
    });

    // Monitor storage changes for cross-tab sync
    window.addEventListener('storage', (e) => {
      if (e.key === 'syncQueue') {
        this.loadSyncQueue();
      }
    });
  }

  // Queue operations for later sync when offline
  queueOperation(operation) {
    const queueItem = {
      id: this.generateOperationId(),
      timestamp: Date.now(),
      retries: 0,
      nextAttemptAt: 0,
      failed: false,
      ...operation
    };

    this.syncQueue.push(queueItem);
    this.saveSyncQueue();

    console.log(`🗂️ Queued operation: ${operation.type} ${operation.endpoint}`);

    // If operation is associated with a local list item, mark it as syncing
    if (operation && operation.key && operation.optimisticId) {
      this._updateLocalItemFlags(operation.key, operation.optimisticId, { syncing: true, syncFailed: false });
      this._broadcastUpdated(operation.key);
    }

    // Try to sync immediately if online
    if (this.isOnline && !this.syncInProgress) {
      this.processSyncQueue();
    }
  }

  generateOperationId() {
    return 'sync_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }

  async performFullSync() {
    if (this.syncInProgress) return;

    console.log('🔄 Starting full synchronization...');
    this.syncInProgress = true;

    try {
      // Step 1: Process queued operations
      await this.processSyncQueue();

      // Step 2: Sync data from server
      await this.syncFromServer();

      // Step 3: Sync local changes to server
      await this.syncToServer();

      this.lastSyncTime = Date.now();
      console.log('✅ Full synchronization completed');

      // Notify user if there's a notification system
      if (window.showNotification) {
        window.showNotification({
          title: 'المزامنة',
          message: 'تم تحديث البيانات بنجاح',
          type: 'success'
        });
      }

    } catch (error) {
      console.error('❌ Full sync failed:', error);

      if (window.showNotification) {
        window.showNotification({
          title: 'فشل المزامنة',
          message: 'حدث خطأ أثناء تحديث البيانات',
          type: 'error'
        });
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  async processSyncQueue() {
    if (this._processing) return;
    if (!this.syncQueue || this.syncQueue.length === 0) return;

    this._processing = true;
    console.log(`🚚 Processing ${this.syncQueue.length} queued operations...`);

    let earliestNext = null;

    for (const item of this.syncQueue) {
      // Skip items that exhausted retries and are waiting for explicit retry
      if (item.failed === true) continue;

      // Respect nextAttemptAt for backoff
      if (item.nextAttemptAt && Date.now() < item.nextAttemptAt) {
        earliestNext = earliestNext === null ? item.nextAttemptAt : Math.min(earliestNext, item.nextAttemptAt);
        continue;
      }

      try {
        await this.executeQueuedOperation(item);

        // Success reconciliation: clear flags on local copy if any
        if (item.key && item.optimisticId) {
          this._updateLocalItemFlags(item.key, item.optimisticId, { syncing: false, syncFailed: false });
          this._broadcastUpdated(item.key);
        }

        // Remove item from queue on success
        this._removeFromQueue(item.id);
        console.log(`✔️ Synced operation: ${item.type} ${item.endpoint}`);
      } catch (error) {
        item.retries = (item.retries || 0) + 1;
        console.warn(`⚠️ Sync failed for ${item.type} ${item.endpoint} (retry ${item.retries}/${this.maxRetries}):`, error);

        if (item.retries >= this.maxRetries) {
          console.error(`⛔ Max retries exceeded for ${item.type} ${item.endpoint}`);
          // Mark as failed and stop auto-processing until manual retry
          item.failed = true;
          // Update local failed flag and stop syncing
          if (item.key && item.optimisticId) {
            this._updateLocalItemFlags(item.key, item.optimisticId, { syncing: false, syncFailed: true });
            // Notify listeners
            try {
              window.dispatchEvent(new CustomEvent('sync:failed', { detail: { key: item.key, optimisticId: item.optimisticId } }));
            } catch (_) {}
          }
        } else {
          // Compute exponential backoff with jitter (base 2^retries * 1s, +/- 250ms, capped 30s)
          const baseMs = Math.min(30000, Math.pow(2, item.retries) * 1000);
          const jitter = (Math.random() * 500) - 250; // +/- 250ms
          const delay = Math.max(0, Math.min(30000, Math.floor(baseMs + jitter)));
          item.nextAttemptAt = Date.now() + delay;
          earliestNext = earliestNext === null ? item.nextAttemptAt : Math.min(earliestNext, item.nextAttemptAt);
          // Ensure local item remains marked as syncing during retries
          if (item.key && item.optimisticId) {
            this._updateLocalItemFlags(item.key, item.optimisticId, { syncing: true, syncFailed: false });
          }
        }
      }
    }

    this.saveSyncQueue();

    // Schedule next attempt if needed
    if (earliestNext !== null) {
      const wait = Math.max(0, earliestNext - Date.now());
      setTimeout(() => this._releaseAndProcess(), wait + 5);
    } else {
      this._processing = false;
    }
  }

  async executeQueuedOperation(item) {
    if (!window.apiClient) {
      throw new Error('API client not available');
    }

    const { type, endpoint, method, data } = item;

    switch (type) {
      case 'create':
        return await window.apiClient.makeRequest(endpoint, {
          method: method || 'POST',
          body: JSON.stringify(data)
        });
      case 'update':
        return await window.apiClient.makeRequest(endpoint, {
          method: method || 'PUT',
          body: JSON.stringify(data)
        });
      case 'delete':
        return await window.apiClient.makeRequest(endpoint, {
          method: 'DELETE'
        });
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  async syncFromServer() {
    if (!window.apiClient) return;

    try {
      console.log('☁️ Syncing data from server...');

      // Get fresh data from server
      const [clearances, delegations, onboardings, profile] = await Promise.all([
        window.apiClient.getMyClearances().catch(() => []),
        window.apiClient.getMyDelegations().catch(() => []),
        window.apiClient.getMyOnboardings().catch(() => []),
        window.apiClient.getProfile().catch(() => null)
      ]);

      // Update localStorage with server data
      localStorage.setItem('requestsClearance', JSON.stringify(clearances));
      localStorage.setItem('requestsDelegation', JSON.stringify(delegations));
      localStorage.setItem('requestsOnboarding', JSON.stringify(onboardings));

      if (profile) {
        localStorage.setItem('userProfile', JSON.stringify(profile));
      }

      // Trigger storage events for cross-tab updates
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'requestsClearance',
        newValue: JSON.stringify(clearances)
      }));
      if (this.channel) {
        try {
          this.channel.postMessage({ key: 'requestsClearance', list: clearances });
          this.channel.postMessage({ key: 'requestsOnboarding', list: onboardings });
          this.channel.postMessage({ key: 'requestsDelegation', list: delegations });
        } catch (_) {}
      }

      console.log('☑️ Server data synced to localStorage');
    } catch (error) {
      console.warn('Failed to sync from server:', error);
    }
  }

  async syncToServer() {
    // Check for local changes that need to be pushed to server
    // This is more complex and would require change tracking
    console.log('📝 Checking for local changes to sync...');

    // For now, we'll rely on the queue system for outgoing changes
    // In a full implementation, we'd track local modifications
  }

  startPeriodicSync() {
    // Sync every 5 minutes when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.performFullSync();
      }
    }, 5 * 60 * 1000);
  }

  saveSyncQueue() {
    try {
      localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.warn('Failed to save sync queue:', error);
    }
  }

  loadSyncQueue() {
    try {
      const saved = localStorage.getItem('syncQueue');
      if (saved) {
        this.syncQueue = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  // Public API for other components
  scheduleSync(operation) {
    if (this.isOnline && !this.syncInProgress) {
      // Execute immediately if online
      this.executeQueuedOperation(operation).then(() => {
        // On direct success, reconcile flags
        if (operation && operation.key && operation.optimisticId) {
          this._updateLocalItemFlags(operation.key, operation.optimisticId, { syncing: false, syncFailed: false });
          this._broadcastUpdated(operation.key);
        }
      }).catch(error => {
        console.warn('Immediate sync failed, queueing:', error);
        this.queueOperation(operation);
      });
    } else {
      // Queue for later if offline
      this.queueOperation(operation);
    }
  }

  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      queueSize: this.syncQueue.length,
      lastSyncTime: this.lastSyncTime,
      syncInProgress: this.syncInProgress
    };
  }

  forceSyncNow() {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    return this.performFullSync();
  }

  // ============= Helpers: local flags, queue ops, events =============
  _updateLocalItemFlags(key, optimisticId, flags) {
    try {
      if (!key || !optimisticId) return;
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      const idx = list.findIndex(x => String(x.optimisticId || x.id) === String(optimisticId));
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...flags };
        localStorage.setItem(key, JSON.stringify(list));
      }
    } catch (e) {
      console.warn('Failed updating local flags', e);
    }
  }

  _broadcastUpdated(key) {
    try {
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      window.dispatchEvent(new CustomEvent('sync:updated', { detail: { key, list } }));
      if (this.channel) {
        try { this.channel.postMessage({ key, list }); } catch (_) {}
      }
    } catch (_) {}
  }

  _removeFromQueue(id) {
    this.syncQueue = (this.syncQueue || []).filter(x => x.id !== id);
    this.saveSyncQueue();
  }

  _releaseAndProcess() {
    this._processing = false;
    // Re-run if still online
    if (this.isOnline) this.processSyncQueue();
  }

  // Snapshot of queue status from localStorage-known keys
  getQueueStatus() {
    try {
      const keys = this.KNOWN_KEYS;
      let syncing = 0, failed = 0;
      keys.forEach(k => {
        const list = JSON.parse(localStorage.getItem(k) || '[]');
        syncing += list.filter(x => x && x.syncing === true).length;
        failed  += list.filter(x => x && x.syncFailed === true).length;
      });
      return { total: syncing + failed, syncing, failed };
    } catch (_) {
      return { total: 0, syncing: 0, failed: 0 };
    }
  }

  // Requeue a specific failed item by optimisticId
  retrySync(optimisticId) {
    try {
      if (!optimisticId) return false;
      const item = (this.syncQueue || []).find(x => String(x.optimisticId) === String(optimisticId));
      if (item) {
        item.retries = 0;
        item.nextAttemptAt = 0;
        item.failed = false;
        if (item.key && item.optimisticId) {
          this._updateLocalItemFlags(item.key, item.optimisticId, { syncing: true, syncFailed: false });
          this._broadcastUpdated(item.key);
        }
        this.saveSyncQueue();
        this.processSyncQueue();
        return true;
      }
      // If not found in queue, best-effort: try to reconstruct from localStorage flags (no-op if not possible)
      return false;
    } catch (_) {
      return false;
    }
  }
}

// Initialize global sync manager
window.syncManager = new SyncManager();

// Provide global functions
window.scheduleSync = (operation) => window.syncManager.scheduleSync(operation);
window.getSyncStatus = () => window.syncManager.getSyncStatus();
window.forceSyncNow = () => window.syncManager.forceSyncNow();

// New helpers exposed globally
window.retrySync = (optimisticId) => window.syncManager.retrySync(optimisticId);
window.getQueueStatus = () => window.syncManager.getQueueStatus();

console.log('✓ Sync Manager initialized');

