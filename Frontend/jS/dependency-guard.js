// Global dependency guard - ensures all required globals are available
// This prevents the cascade of errors when scripts load out of order
(function() {
  'use strict';
  
  const REQUIRED_GLOBALS = ['apiClient', 'NotificationStore', 'resolveFrontendPath'];
  const MAX_WAIT_TIME = 5000; // 5 seconds
  const CHECK_INTERVAL = 100; // 100ms
  
  function checkDependencies() {
    const missing = REQUIRED_GLOBALS.filter(global => typeof window[global] === 'undefined');
    return missing;
  }
  
  function waitForDependencies(callback, requiredGlobals = null) {
    const globalsToCheck = requiredGlobals || REQUIRED_GLOBALS;
    let elapsed = 0;
    
    const check = () => {
      const missing = globalsToCheck.filter(global => typeof window[global] === 'undefined');
      
      if (missing.length === 0) {
        console.log('✅ All required dependencies loaded:', globalsToCheck);
        callback();
        return;
      }
      
      elapsed += CHECK_INTERVAL;
      
      if (elapsed >= MAX_WAIT_TIME) {
        console.error('❌ Timeout waiting for dependencies:', missing);
        console.error('🔧 Check script loading order in HTML file');
        console.error('📋 Available globals:', Object.keys(window).filter(k => !k.startsWith('webkit')));
        
        // Still call callback but with warning
        console.warn('⚠️ Proceeding with missing dependencies - expect errors');
        callback();
        return;
      }
      
      // Log progress every second
      if (elapsed % 1000 === 0) {
        console.log(`⏳ Still waiting for dependencies (${elapsed/1000}s):`, missing);
      }
      
      setTimeout(check, CHECK_INTERVAL);
    };
    
    check();
  }
  
  // Safe wrapper for common operations
  function safeCall(globalName, method, args = [], fallback = null) {
    if (typeof window[globalName] === 'undefined') {
      console.warn(`⚠️ ${globalName} not available, using fallback`);
      return fallback;
    }
    
    if (typeof window[globalName][method] !== 'function') {
      console.warn(`⚠️ ${globalName}.${method} is not a function`);
      return fallback;
    }
    
    try {
      return window[globalName][method](...args);
    } catch (error) {
      console.error(`❌ Error calling ${globalName}.${method}:`, error);
      return fallback;
    }
  }
  
  // Debug helper
  function debugDependencies() {
    console.group('🔍 Dependency Status');
    REQUIRED_GLOBALS.forEach(global => {
      const available = typeof window[global] !== 'undefined';
      const status = available ? '✅' : '❌';
      console.log(`${status} ${global}:`, available ? typeof window[global] : 'undefined');
    });
    console.groupEnd();
  }
  
  // Export functions to global scope
  window.waitForDependencies = waitForDependencies;
  window.safeCall = safeCall;
  window.debugDependencies = debugDependencies;
  
  // Auto-debug in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    setTimeout(debugDependencies, 1000);
  }
  
  console.log('🛡️ Dependency guard initialized');
})();
