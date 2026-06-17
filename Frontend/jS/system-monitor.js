// System Monitoring and Logging
// Provides comprehensive logging, performance monitoring, and system health checks

class SystemMonitor {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.performanceMetrics = [];
    this.isMonitoring = false;
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.init();
  }

  init() {
    this.setupPerformanceMonitoring();
    this.setupErrorTracking();
    this.setupUserActivityTracking();
    this.startMonitoring();
    console.log('✅ System Monitor initialized');
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  setupPerformanceMonitoring() {
    // Monitor page load performance
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.logPerformance(entry);
        });
      });

      try {
        observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }

    // Monitor API response times
    this.interceptAPIRequests();
  }

  setupErrorTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'unhandled_promise_rejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
    });
  }

  setupUserActivityTracking() {
    // Track user interactions
    const events = ['click', 'submit', 'focus', 'blur'];
    events.forEach(eventType => {
      document.addEventListener(eventType, (e) => {
        this.logUserActivity(eventType, e.target);
      }, true);
    });

    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      this.logActivity('page_visibility', {
        visible: !document.hidden,
        timestamp: new Date().toISOString()
      });
    });

    // Track session duration
    window.addEventListener('beforeunload', () => {
      this.logActivity('session_end', {
        duration: Date.now() - this.startTime,
        timestamp: new Date().toISOString()
      });
      this.saveLogsToStorage();
    });
  }

  interceptAPIRequests() {
    if (window.apiClient && window.apiClient.makeRequest) {
      const originalMakeRequest = window.apiClient.makeRequest.bind(window.apiClient);
      
      window.apiClient.makeRequest = async (endpoint, options = {}) => {
        const startTime = performance.now();
        const requestId = this.generateRequestId();
        
        this.logActivity('api_request_start', {
          requestId,
          endpoint,
          method: options.method || 'GET',
          timestamp: new Date().toISOString()
        });

        try {
          const response = await originalMakeRequest(endpoint, options);
          const endTime = performance.now();
          const duration = endTime - startTime;

          this.logActivity('api_request_success', {
            requestId,
            endpoint,
            method: options.method || 'GET',
            duration: Math.round(duration),
            status: response?.status || 'success',
            timestamp: new Date().toISOString()
          });

          this.logPerformance({
            name: `API: ${options.method || 'GET'} ${endpoint}`,
            duration,
            entryType: 'api_request'
          });

          return response;
        } catch (error) {
          const endTime = performance.now();
          const duration = endTime - startTime;

          this.logActivity('api_request_error', {
            requestId,
            endpoint,
            method: options.method || 'GET',
            duration: Math.round(duration),
            error: error.message,
            status: error.response?.status || 'error',
            timestamp: new Date().toISOString()
          });

          throw error;
        }
      };
    }
  }

  generateRequestId() {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }

  logActivity(type, data) {
    const logEntry = {
      id: this.generateLogId(),
      sessionId: this.sessionId,
      type,
      level: 'info',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...data
    };

    this.addLog(logEntry);
  }

  logError(error) {
    const logEntry = {
      id: this.generateLogId(),
      sessionId: this.sessionId,
      type: 'error',
      level: 'error',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...error
    };

    this.addLog(logEntry);
    
    // Also send to console for debugging
    console.error('System Monitor - Error logged:', logEntry);
  }

  logPerformance(entry) {
    const perfEntry = {
      id: this.generateLogId(),
      sessionId: this.sessionId,
      type: 'performance',
      level: 'info',
      name: entry.name,
      entryType: entry.entryType,
      duration: Math.round(entry.duration || 0),
      startTime: Math.round(entry.startTime || 0),
      timestamp: new Date().toISOString()
    };

    this.performanceMetrics.push(perfEntry);
    
    // Keep only recent performance metrics
    if (this.performanceMetrics.length > 500) {
      this.performanceMetrics = this.performanceMetrics.slice(-300);
    }
  }

  logUserActivity(eventType, target) {
    // Avoid logging too many events
    if (this.shouldSkipEvent(eventType, target)) return;

    const activityData = {
      eventType,
      targetTag: target.tagName?.toLowerCase(),
      targetId: target.id || null,
      targetClass: target.className || null,
      targetText: target.textContent?.substring(0, 50) || null
    };

    this.logActivity('user_interaction', activityData);
  }

  shouldSkipEvent(eventType, target) {
    // Skip frequent events on certain elements
    if (eventType === 'focus' || eventType === 'blur') {
      return target.tagName?.toLowerCase() === 'input' && target.type === 'text';
    }
    
    // Skip clicks on body or html
    if (eventType === 'click' && ['body', 'html'].includes(target.tagName?.toLowerCase())) {
      return true;
    }

    return false;
  }

  generateLogId() {
    return 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }

  addLog(logEntry) {
    this.logs.unshift(logEntry);
    
    // Limit log size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Auto-save critical errors
    if (logEntry.level === 'error') {
      this.saveLogsToStorage();
    }
  }

  startMonitoring() {
    this.isMonitoring = true;
    
    // Log system info
    this.logActivity('session_start', {
      url: window.location.href,
      referrer: document.referrer,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: screen.width,
        height: screen.height
      },
      connection: this.getConnectionInfo(),
      memory: this.getMemoryInfo()
    });

    // Start periodic health checks
    this.startHealthChecks();
  }

  getConnectionInfo() {
    if (navigator.connection) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      };
    }
    return null;
  }

  getMemoryInfo() {
    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  startHealthChecks() {
    // Check system health every 30 seconds
    setInterval(() => {
      this.performHealthCheck();
    }, 30000);
  }

  async performHealthCheck() {
    const healthData = {
      timestamp: new Date().toISOString(),
      memory: this.getMemoryInfo(),
      performance: this.getPerformanceSnapshot(),
      cacheStats: window.getCacheStats ? window.getCacheStats() : null,
      errorCount: this.logs.filter(log => log.level === 'error').length,
      apiResponseTime: this.getAverageAPIResponseTime()
    };

    this.logActivity('health_check', healthData);

    // Check for issues and create alerts
    this.analyzeHealth(healthData);
  }

  getPerformanceSnapshot() {
    const recentMetrics = this.performanceMetrics.slice(-10);
    if (recentMetrics.length === 0) return null;

    const apiMetrics = recentMetrics.filter(m => m.entryType === 'api_request');
    
    return {
      avgApiResponseTime: apiMetrics.length > 0 
        ? Math.round(apiMetrics.reduce((sum, m) => sum + m.duration, 0) / apiMetrics.length)
        : null,
      recentErrorCount: this.logs.filter(log => 
        log.level === 'error' && 
        Date.now() - new Date(log.timestamp).getTime() < 300000 // last 5 minutes
      ).length
    };
  }

  getAverageAPIResponseTime() {
    const apiLogs = this.logs.filter(log => 
      log.type === 'api_request_success' && 
      Date.now() - new Date(log.timestamp).getTime() < 300000 // last 5 minutes
    );

    if (apiLogs.length === 0) return null;

    const totalTime = apiLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    return Math.round(totalTime / apiLogs.length);
  }

  analyzeHealth(healthData) {
    const issues = [];

    // Check memory usage
    if (healthData.memory && healthData.memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
      issues.push('High memory usage detected');
    }

    // Check error rate
    if (healthData.errorCount > 10) {
      issues.push('High error count detected');
    }

    // Check API response time
    if (healthData.apiResponseTime && healthData.apiResponseTime > 5000) { // 5 seconds
      issues.push('Slow API response times detected');
    }

    if (issues.length > 0) {
      this.logActivity('health_alert', {
        issues,
        severity: 'warning'
      });

      // Show notification if available
      if (window.showNotification) {
        window.showNotification({
          title: 'تحذير الأداء',
          message: 'تم اكتشاف مشاكل في أداء النظام',
          type: 'warning'
        });
      }
    }
  }

  saveLogsToStorage() {
    try {
      const logsToSave = this.logs.slice(0, 100); // Save only recent logs
      localStorage.setItem('systemMonitorLogs', JSON.stringify(logsToSave));
      localStorage.setItem('systemMonitorMetrics', JSON.stringify(this.performanceMetrics.slice(-50)));
    } catch (error) {
      console.warn('Failed to save logs to storage:', error);
    }
  }

  loadLogsFromStorage() {
    try {
      const savedLogs = localStorage.getItem('systemMonitorLogs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }

      const savedMetrics = localStorage.getItem('systemMonitorMetrics');
      if (savedMetrics) {
        this.performanceMetrics = JSON.parse(savedMetrics);
      }
    } catch (error) {
      console.warn('Failed to load logs from storage:', error);
    }
  }

  exportLogs() {
    const exportData = {
      sessionId: this.sessionId,
      exportTime: new Date().toISOString(),
      logs: this.logs,
      performanceMetrics: this.performanceMetrics,
      systemInfo: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${this.sessionId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📊 System logs exported');
  }

  getStats() {
    const errorLogs = this.logs.filter(log => log.level === 'error');
    const apiLogs = this.logs.filter(log => log.type.includes('api_request'));
    
    return {
      totalLogs: this.logs.length,
      errorCount: errorLogs.length,
      apiRequestCount: apiLogs.length,
      sessionDuration: Date.now() - this.startTime,
      performanceMetrics: this.performanceMetrics.length,
      averageApiResponseTime: this.getAverageAPIResponseTime(),
      memoryUsage: this.getMemoryInfo()
    };
  }

  clearLogs() {
    this.logs = [];
    this.performanceMetrics = [];
    localStorage.removeItem('systemMonitorLogs');
    localStorage.removeItem('systemMonitorMetrics');
    console.log('🧹 System logs cleared');
  }
}

// Initialize global system monitor
window.systemMonitor = new SystemMonitor();

// Provide global functions
window.exportSystemLogs = () => window.systemMonitor.exportLogs();
window.getSystemStats = () => window.systemMonitor.getStats();
window.clearSystemLogs = () => window.systemMonitor.clearLogs();

console.log('✅ System Monitor and Logging initialized');
