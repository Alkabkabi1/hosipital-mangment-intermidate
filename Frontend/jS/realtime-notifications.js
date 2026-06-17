// Real-time Notifications System
// Provides live updates and notifications for user actions and system events

class RealtimeNotificationManager {
  constructor() {
    this.notifications = [];
    this.maxNotifications = 50;
    this.isVisible = false;
    this.unreadCount = 0;
    this.updateInterval = null;
    this.container = null;
    this.init();
  }

  init() {
    this.createNotificationContainer();
    this.setupEventListeners();
    this.startUpdateLoop();
    this.loadStoredNotifications();
    console.log('✅ Real-time Notifications Manager initialized');
  }

  createNotificationContainer() {
    // Create floating notification container
    const container = document.createElement('div');
    container.id = 'realtime-notifications';
    container.className = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 80px;
      left: 20px;
      width: 350px;
      max-height: 400px;
      overflow-y: auto;
      z-index: 10001;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(10px);
      transform: translateX(-120%);
      transition: transform 0.3s ease-out;
      font-family: 'Tajawal', sans-serif;
      direction: rtl;
    `;

    // Create header
    const header = document.createElement('div');
    header.className = 'notification-header';
    header.style.cssText = `
      padding: 15px 20px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border-radius: 12px 12px 0 0;
    `;

    const title = document.createElement('h3');
    title.textContent = 'الإشعارات';
    title.style.cssText = 'margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;';

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: #6b7280;
    `;
    closeBtn.onclick = () => this.hide();

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Create notifications list
    const list = document.createElement('div');
    list.id = 'notifications-list';
    list.className = 'notifications-list';
    list.style.cssText = `
      max-height: 300px;
      overflow-y: auto;
      padding: 10px 0;
    `;

    container.appendChild(header);
    container.appendChild(list);
    document.body.appendChild(container);

    this.container = container;
  }

  setupEventListeners() {
    // Listen for storage changes (cross-tab notifications)
    window.addEventListener('storage', (e) => {
      if (e.key === 'realtimeNotifications') {
        this.loadStoredNotifications();
      }
    });

    // Listen for custom notification events
    document.addEventListener('newNotification', (e) => {
      this.addNotification(e.detail);
    });

    // Listen for API responses to create notifications
    this.interceptAPIResponses();
  }

  interceptAPIResponses() {
    // Enhance the API client to emit notification events
    if (window.apiClient && window.apiClient.makeRequest) {
      const originalMakeRequest = window.apiClient.makeRequest.bind(window.apiClient);
      
      window.apiClient.makeRequest = async (endpoint, options = {}) => {
        try {
          const response = await originalMakeRequest(endpoint, options);
          
          // Create notifications for successful operations
          if (options.method === 'POST' && response && response.success !== false) {
            this.handleSuccessfulOperation(endpoint, response);
          }
          
          return response;
        } catch (error) {
          // Create notifications for errors
          this.handleOperationError(endpoint, error);
          throw error;
        }
      };
    }
  }

  handleSuccessfulOperation(endpoint, response) {
    let message = '';
    let type = 'success';
    
    if (endpoint.includes('/clearance')) {
      message = 'تم إرسال طلب الإخلاء بنجاح';
    } else if (endpoint.includes('/delegation')) {
      message = 'تم إرسال طلب التفويض بنجاح';
    } else if (endpoint.includes('/onboarding')) {
      message = 'تم إرسال طلب المباشرة بنجاح';
    } else if (endpoint.includes('/profile')) {
      message = 'تم تحديث الملف الشخصي بنجاح';
    }
    
    if (message) {
      this.addNotification({
        title: 'عملية ناجحة',
        message: message,
        type: type,
        timestamp: new Date().toISOString(),
        autoShow: true
      });
    }
  }

  handleOperationError(endpoint, error) {
    let message = 'حدث خطأ في العملية';
    
    if (endpoint.includes('/clearance')) {
      message = 'فشل في إرسال طلب الإخلاء';
    } else if (endpoint.includes('/delegation')) {
      message = 'فشل في إرسال طلب التفويض';
    } else if (endpoint.includes('/onboarding')) {
      message = 'فشل في إرسال طلب المباشرة';
    }
    
    this.addNotification({
      title: 'خطأ في العملية',
      message: message,
      type: 'error',
      timestamp: new Date().toISOString(),
      autoShow: true
    });
  }

  addNotification(notification) {
    const notificationObj = {
      id: this.generateId(),
      title: notification.title || 'إشعار',
      message: notification.message || '',
      type: notification.type || 'info', // success, error, warning, info
      timestamp: notification.timestamp || new Date().toISOString(),
      read: false,
      priority: notification.priority || 'normal', // high, normal, low
      autoShow: notification.autoShow || false
    };

    // Add to beginning of array
    this.notifications.unshift(notificationObj);
    
    // Limit notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    // Update unread count
    this.unreadCount++;
    
    // Save to storage
    this.saveNotifications();
    
    // Update UI
    this.updateNotificationsList();
    this.updateBellIcon();
    
    // Auto-show if requested
    if (notificationObj.autoShow && !this.isVisible) {
      this.show();
      // Auto-hide after 5 seconds
      setTimeout(() => {
        if (this.isVisible) this.hide();
      }, 5000);
    }
    
    console.log(`🔔 New notification: ${notificationObj.title}`);
  }

  generateId() {
    return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  updateNotificationsList() {
    const list = document.getElementById('notifications-list');
    if (!list) return;

    if (this.notifications.length === 0) {
      list.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">لا توجد إشعارات</div>';
      return;
    }

    list.innerHTML = this.notifications.map(notification => 
      this.createNotificationElement(notification)
    ).join('');
  }

  createNotificationElement(notification) {
    const typeColors = {
      success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
      error: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
      warning: { bg: '#fffbeb', border: '#fed7aa', text: '#92400e' },
      info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' }
    };

    const colors = typeColors[notification.type] || typeColors.info;
    const timeAgo = this.getTimeAgo(notification.timestamp);
    const isUnread = !notification.read;

    return `
      <div class="notification-item" data-id="${notification.id}" style="
        margin: 8px 12px;
        padding: 12px 15px;
        background: ${colors.bg};
        border: 1px solid ${colors.border};
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        ${isUnread ? 'border-left: 4px solid ' + colors.text + ';' : ''}
      " onclick="window.realtimeNotifications.markAsRead('${notification.id}')">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
          <div style="font-weight: 600; color: ${colors.text}; font-size: 14px;">
            ${notification.title}
            ${isUnread ? '<span style="color: #ef4444; font-size: 8px;">●</span>' : ''}
          </div>
          <div style="font-size: 11px; color: #6b7280;">${timeAgo}</div>
        </div>
        <div style="color: ${colors.text}; font-size: 13px; line-height: 1.4;">
          ${notification.message}
        </div>
      </div>
    `;
  }

  getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'الآن';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} د`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} س`;
    return `${Math.floor(diffInSeconds / 86400)} ي`;
  }

  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.saveNotifications();
      this.updateNotificationsList();
      this.updateBellIcon();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.unreadCount = 0;
    this.saveNotifications();
    this.updateNotificationsList();
    this.updateBellIcon();
  }

  show() {
    if (this.container) {
      this.container.style.transform = 'translateX(0)';
      this.isVisible = true;
      this.updateNotificationsList();
    }
  }

  hide() {
    if (this.container) {
      this.container.style.transform = 'translateX(-120%)';
      this.isVisible = false;
    }
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  updateBellIcon() {
    // Update any bell icons in the page
    const bellIcons = document.querySelectorAll('.notification-bell, #bell, .bell');
    bellIcons.forEach(bell => {
      const badge = bell.querySelector('.notification-badge, .badge, .dot');
      if (badge) {
        if (this.unreadCount > 0) {
          badge.style.display = 'flex';
          badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount.toString();
        } else {
          badge.style.display = 'none';
        }
      }
    });
  }

  saveNotifications() {
    try {
      localStorage.setItem('realtimeNotifications', JSON.stringify(this.notifications));
      localStorage.setItem('realtimeNotificationsCount', this.unreadCount.toString());
    } catch (error) {
      console.warn('Failed to save notifications to localStorage:', error);
    }
  }

  loadStoredNotifications() {
    try {
      const stored = localStorage.getItem('realtimeNotifications');
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
      
      const storedCount = localStorage.getItem('realtimeNotificationsCount');
      if (storedCount) {
        this.unreadCount = parseInt(storedCount, 10) || 0;
      }
      
      this.updateNotificationsList();
      this.updateBellIcon();
    } catch (error) {
      console.warn('Failed to load notifications from localStorage:', error);
    }
  }

  startUpdateLoop() {
    // Check for new notifications every 30 seconds
    this.updateInterval = setInterval(() => {
      this.checkForUpdates();
    }, 30000);
  }

  async checkForUpdates() {
    try {
      // Poll the server for new notifications and data updates
      if (window.apiClient) {
        // Check for new requests that might need attention
        const [clearances, delegations, onboardings] = await Promise.all([
          window.apiClient.getMyClearances().catch(() => []),
          window.apiClient.getMyDelegations().catch(() => []),
          window.apiClient.getMyOnboardings().catch(() => [])
        ]);

        // Check for status changes and create notifications
        this.checkForStatusChanges(clearances, 'clearance');
        this.checkForStatusChanges(delegations, 'delegation');
        this.checkForStatusChanges(onboardings, 'onboarding');

        // Update localStorage with fresh data
        localStorage.setItem('requestsClearance', JSON.stringify(clearances));
        localStorage.setItem('requestsDelegation', JSON.stringify(delegations));
        localStorage.setItem('requestsOnboarding', JSON.stringify(onboardings));
      }
    } catch (error) {
      console.warn('Failed to check for updates:', error);
    }
    
    this.updateBellIcon();
  }

  checkForStatusChanges(newRequests, type) {
    const storageKey = `requests${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const oldRequests = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    newRequests.forEach(newReq => {
      const oldReq = oldRequests.find(req => req.id === newReq.id);
      if (oldReq && oldReq.status !== newReq.status) {
        // Status changed - create notification
        this.addNotification({
          title: 'تحديث حالة الطلب',
          message: `تم تحديث حالة ${this.getRequestTypeArabic(type)} إلى: ${newReq.status}`,
          type: this.getNotificationTypeForStatus(newReq.status),
          autoShow: true
        });
      }
    });
  }

  getRequestTypeArabic(type) {
    const types = {
      clearance: 'طلب الإخلاء',
      delegation: 'طلب التفويض',
      onboarding: 'طلب المباشرة'
    };
    return types[type] || 'الطلب';
  }

  getNotificationTypeForStatus(status) {
    if (status.includes('موافق') || status.includes('مكتمل')) return 'success';
    if (status.includes('مرفوض')) return 'error';
    if (status.includes('معلق')) return 'warning';
    return 'info';
  }

  clearAll() {
    this.notifications = [];
    this.unreadCount = 0;
    this.saveNotifications();
    this.updateNotificationsList();
    this.updateBellIcon();
  }

  // Simulate system notifications (for testing)
  simulateNotifications() {
    const testNotifications = [
      { title: 'طلب جديد', message: 'تم استلام طلب إخلاء طرف جديد', type: 'info' },
      { title: 'تمت الموافقة', message: 'تمت الموافقة على طلب التفويض الخاص بك', type: 'success' },
      { title: 'تحديث مطلوب', message: 'يرجى تحديث بياناتك الشخصية', type: 'warning' },
      { title: 'خطأ في النظام', message: 'حدث خطأ مؤقت في النظام', type: 'error' }
    ];

    testNotifications.forEach((notif, index) => {
      setTimeout(() => {
        this.addNotification({ ...notif, autoShow: index === 0 });
      }, index * 2000);
    });
  }
}

// Initialize global notification manager
window.realtimeNotifications = new RealtimeNotificationManager();

// Provide global functions
window.showNotification = (notification) => window.realtimeNotifications.addNotification(notification);
window.toggleNotifications = () => window.realtimeNotifications.toggle();
window.clearAllNotifications = () => window.realtimeNotifications.clearAll();

// Auto-setup bell icons when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Find and enhance bell icons
  const bellIcons = document.querySelectorAll('.notification-bell, #bell, .bell');
  bellIcons.forEach(bell => {
    bell.style.cursor = 'pointer';
    bell.addEventListener('click', () => {
      window.realtimeNotifications.toggle();
      // Mark notifications as read when bell is clicked
      setTimeout(() => {
        window.realtimeNotifications.markAllAsRead();
      }, 1000);
    });
  });
});

console.log('✅ Real-time Notifications System initialized');
