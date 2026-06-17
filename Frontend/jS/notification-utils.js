// Safe NotificationStore wrapper and utilities
// Prevents crashes when NotificationStore is not loaded or available
(function() {
  'use strict';
  
  function safeNotificationStore() {
    if (typeof window.NotificationStore === 'undefined') {
      console.warn('⚠️ NotificationStore not available, using fallback');
      return {
        getAll: () => {
          try {
            return JSON.parse(localStorage.getItem('notifications') || '[]');
          } catch (error) {
            console.error('❌ Error reading notifications from localStorage:', error);
            return [];
          }
        },
        setAll: (notifications) => {
          try {
            localStorage.setItem('notifications', JSON.stringify(notifications || []));
          } catch (error) {
            console.error('❌ Error saving notifications to localStorage:', error);
          }
        },
        add: (notification) => {
          try {
            const existing = JSON.parse(localStorage.getItem('notifications') || '[]');
            const newNotification = {
              id: `ntf-${Date.now()}-${Math.random().toString(16).slice(2)}`,
              time: new Date().toLocaleString('ar-SA'),
              unread: true,
              ...notification
            };
            existing.unshift(newNotification);
            localStorage.setItem('notifications', JSON.stringify(existing));
            return newNotification;
          } catch (error) {
            console.error('❌ Error adding notification:', error);
            return null;
          }
        },
        getStorageKey: () => 'notifications'
      };
    }
    return window.NotificationStore;
  }
  
  // Global helper functions with safe fallbacks
  window.safeNotificationStore = safeNotificationStore;
  
  window.addNotification = function(title, payload = {}) {
    if (!title) {
      console.warn('⚠️ addNotification called without title');
      return;
    }
    
    try {
      const store = safeNotificationStore();
      const notification = {
        title,
        time: new Date().toLocaleString('ar-SA'),
        unread: true,
        ...payload
      };
      
      const result = store.add(notification);
      console.log('📢 Notification added:', title);
      return result;
    } catch (error) {
      console.error('❌ Error adding notification:', error);
    }
  };
  
  window.notifyAdmins = function(title, payload = {}) {
    if (!title) {
      console.warn('⚠️ notifyAdmins called without title');
      return;
    }
    
    try {
      // Get admin emails from localStorage or use default
      const adminEmails = JSON.parse(localStorage.getItem('adminEmails') || '["admin@dev.local"]');
      
      adminEmails.forEach(email => {
        window.addNotification(title, { 
          recipient: email.toLowerCase(), 
          ...payload 
        });
      });
      
      console.log('📢 Admin notification sent:', title, 'to', adminEmails.length, 'admins');
    } catch (error) {
      console.error('❌ Error notifying admins:', error);
      // Fallback: add notification without specific recipient
      window.addNotification(title, payload);
    }
  };
  
  window.markAllNotificationsRead = function() {
    try {
      const store = safeNotificationStore();
      const all = store.getAll();
      const updated = all.map(n => ({ ...n, unread: false }));
      store.setAll(updated);
      console.log('✅ All notifications marked as read');
      
      // Trigger storage event for other tabs/windows
      window.dispatchEvent(new StorageEvent('storage', {
        key: store.getStorageKey(),
        newValue: JSON.stringify(updated)
      }));
      
      return updated;
    } catch (error) {
      console.error('❌ Error marking notifications as read:', error);
      return [];
    }
  };
  
  window.getUnreadNotificationCount = function() {
    try {
      const store = safeNotificationStore();
      const all = store.getAll();
      return all.filter(n => n.unread).length;
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      return 0;
    }
  };
  
  // Safe notification display helpers
  window.updateNotificationBell = function(bellElement, dotElement) {
    if (!bellElement || !dotElement) {
      console.warn('⚠️ updateNotificationBell called without required elements');
      return;
    }
    
    try {
      const unreadCount = window.getUnreadNotificationCount();
      
      if (unreadCount > 0) {
        dotElement.style.display = 'flex';
        dotElement.textContent = String(unreadCount);
      } else {
        dotElement.style.display = 'none';
      }
      
      // Add click handler to mark all as read
      bellElement.onclick = function() {
        window.markAllNotificationsRead();
        dotElement.style.display = 'none';
      };
      
    } catch (error) {
      console.error('❌ Error updating notification bell:', error);
    }
  };
  
  // Global logout function
  window.logout = function() {
    try {
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      
      console.log('🔄 User logged out, redirecting to login...');
      
      if (window.showSuccess) {
        window.showSuccess('تم تسجيل الخروج بنجاح');
      }
      
      setTimeout(() => {
        if (typeof window.resolveFrontendPath === 'function') {
          window.location.href = window.resolveFrontendPath('login.html');
        } else {
          window.location.href = 'login.html';
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Force redirect even on error
      window.location.href = 'login.html';
    }
  };

  // Debug helper
  window.debugNotifications = function() {
    const store = safeNotificationStore();
    const all = store.getAll();
    console.group('🔔 Notification Debug');
    console.log('Total notifications:', all.length);
    console.log('Unread notifications:', all.filter(n => n.unread).length);
    console.log('Recent notifications:', all.slice(0, 5));
    console.groupEnd();
  };
  
  console.log('🔔 Notification utilities initialized');
})();
