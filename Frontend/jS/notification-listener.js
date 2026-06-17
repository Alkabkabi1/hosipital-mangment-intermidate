/**
 * Notification Listener System
 * Polls for role change notifications and displays them to the user
 */

class NotificationListener {
  constructor() {
    this.pollInterval = 30000; // Poll every 30 seconds
    this.intervalId = null;
    this.lastNotificationId = null;
    this.isPolling = false;
    this.notificationBadge = null;
  }

  /**
   * Start polling for notifications
   */
  start() {
    if (this.isPolling) {
      console.log('🔔 Notification listener already running');
      return;
    }

    console.log('🔔 Starting notification listener...');
    this.isPolling = true;

    // Initial check
    this.checkForNotifications();

    // Set up polling interval
    this.intervalId = setInterval(() => {
      this.checkForNotifications();
    }, this.pollInterval);
  }

  /**
   * Stop polling for notifications
   */
  stop() {
    if (!this.isPolling) {
      return;
    }

    console.log('🔔 Stopping notification listener...');
    this.isPolling = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Check for new notifications
   */
  async checkForNotifications() {
    try {
      if (!window.apiClient) {
        console.warn('⚠️ API client not available');
        return;
      }

      const response = await window.apiClient.makeRequest('/notifications/unread');
      
      if (response && response.success && response.data) {
        const notifications = response.data.notifications || [];
        const count = response.data.count || 0;

        // Update badge count
        this.updateNotificationBadge(count);

        // Check for new notifications
        if (notifications.length > 0) {
          const newNotifications = this.filterNewNotifications(notifications);
          
          if (newNotifications.length > 0) {
            console.log(`🔔 ${newNotifications.length} new notification(s) received`);
            
            // Display notifications
            newNotifications.forEach(notification => {
              this.displayNotification(notification);
            });

            // Update last notification ID
            this.lastNotificationId = notifications[0].notification_id;

            // Check if any are role changes requiring action
            const roleChangeNotifications = newNotifications.filter(n => n.type === 'ROLE_CHANGE');
            if (roleChangeNotifications.length > 0) {
              await this.handleRoleChangeNotifications(roleChangeNotifications);
            }
          }
        }
      }
    } catch (error) {
      // Silently fail - don't spam console for network errors
      if (error.message && !error.message.includes('NetworkError')) {
        console.warn('Failed to check notifications:', error.message);
      }
    }
  }

  /**
   * Filter out notifications we've already seen
   */
  filterNewNotifications(notifications) {
    if (!this.lastNotificationId) {
      return notifications;
    }

    const newNotifications = [];
    for (const notification of notifications) {
      if (notification.notification_id <= this.lastNotificationId) {
        break;
      }
      newNotifications.push(notification);
    }

    return newNotifications;
  }

  /**
   * Display a notification to the user
   */
  displayNotification(notification) {
    // Try to use browser notifications if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/Frontend/images/logo.png', // Adjust path as needed
        badge: '/Frontend/images/badge.png',
      });
    }

    // Display in-page notification (toast)
    this.showToast(notification);
  }

  /**
   * Show an in-page toast notification
   */
  showToast(notification) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('notification-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'notification-toast-container';
      toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 350px;
      `;
      document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.style.cssText = `
      background: white;
      border-left: 4px solid #4CAF50;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      padding: 15px 20px;
      margin-bottom: 10px;
      animation: slideInRight 0.3s ease-out;
      direction: rtl;
      text-align: right;
    `;

    if (notification.type === 'ROLE_CHANGE') {
      toast.style.borderLeftColor = '#2196F3';
    }

    toast.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px; color: #333;">
        ${notification.title}
      </div>
      <div style="color: #666; font-size: 14px;">
        ${notification.message}
      </div>
      <div style="font-size: 11px; color: #999; margin-top: 5px;">
        ${this.formatTimeAgo(notification.created_at)}
      </div>
    `;

    // Add animation
    const style = document.createElement('style');
    if (!document.getElementById('notification-toast-animation')) {
      style.id = 'notification-toast-animation';
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }

    toastContainer.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.3s ease-out reverse';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 5000);

    // Click to dismiss
    toast.addEventListener('click', () => {
      toast.remove();
    });
  }

  /**
   * Handle role change notifications - refresh permissions
   */
  async handleRoleChangeNotifications(notifications) {
    console.log('🔄 Role change detected, refreshing permissions and JWT token...');
    
    // Refresh role permissions if the class is available
    if (window.rolePermissions && typeof window.rolePermissions.refreshRoles === 'function') {
      try {
        await window.rolePermissions.refreshRoles();
        console.log('✅ Permissions and JWT token refreshed successfully');
        
        // Note: refreshRoles() now shows its own toast notification, so we don't show duplicate here
        
      } catch (error) {
        console.error('❌ Failed to refresh permissions:', error);
        
        // Show error toast only if refresh failed
        this.showToast({
          title: 'فشل تحديث الصلاحيات',
          message: 'حدث خطأ أثناء تحديث صلاحياتك. يرجى تحديث الصفحة للحصول على أحدث الصلاحيات.',
          type: 'ERROR',
          created_at: new Date()
        });
      }
    } else {
      console.warn('⚠️ rolePermissions.refreshRoles() not available - user may need to refresh page');
      
      // Show a toast asking user to refresh the page
      this.showToast({
        title: 'يرجى تحديث الصفحة',
        message: 'تم تحديث صلاحياتك. يرجى تحديث الصفحة لتطبيق التغييرات.',
        type: 'INFO',
        created_at: new Date()
      });
    }
  }

  /**
   * Update notification badge count
   */
  updateNotificationBadge(count) {
    // Find or create badge element
    if (!this.notificationBadge) {
      this.notificationBadge = document.getElementById('notification-badge') || 
                               document.querySelector('.notification-badge');
    }

    if (this.notificationBadge) {
      if (count > 0) {
        this.notificationBadge.textContent = count > 99 ? '99+' : count;
        this.notificationBadge.style.display = 'inline-block';
      } else {
        this.notificationBadge.style.display = 'none';
      }
    }

    // Update page title
    if (count > 0) {
      if (!document.title.startsWith('(')) {
        document.title = `(${count}) ${document.title}`;
      }
    } else {
      document.title = document.title.replace(/^\(\d+\)\s*/, '');
    }
  }

  /**
   * Format timestamp as relative time
   */
  formatTimeAgo(timestamp) {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now - notificationTime;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
  }

  /**
   * Request browser notification permission
   */
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('✅ Notification permission granted');
          return true;
        } else {
          console.log('⚠️ Notification permission denied');
          return false;
        }
      } catch (error) {
        console.warn('Failed to request notification permission:', error);
        return false;
      }
    }
    return Notification.permission === 'granted';
  }
}

// Create global instance
window.notificationListener = new NotificationListener();

// Auto-start on page load if user is authenticated
document.addEventListener('DOMContentLoaded', () => {
  const authUser = localStorage.getItem('authUser');
  if (authUser && authUser !== 'undefined' && authUser !== 'null') {
    console.log('🔔 User authenticated, starting notification listener');
    window.notificationListener.start();
    
    // Request notification permission
    window.notificationListener.requestNotificationPermission();
  }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationListener;
}

