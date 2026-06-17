/**
 * Refresh After Approval - Auto-refresh dashboards when returning from detail pages
 * This ensures completed requests disappear from pending sections
 */

(function() {
  'use strict';

  // Check if we just came back from a detail page after approval
  const cameFromDetail = sessionStorage.getItem('returnedFromDetail');
  
  if (cameFromDetail) {
    console.log('🔄 Returned from detail page - refreshing data...');
    
    // Clear the flag
    sessionStorage.removeItem('returnedFromDetail');
    
    // Force reload data from API (not cache)
    setTimeout(() => {
      if (typeof loadDashboardData === 'function') {
        console.log('🔄 Reloading dashboard data...');
        loadDashboardData();
      } else if (typeof loadDirectRequests === 'function') {
        console.log('🔄 Reloading inbox data...');
        loadDirectRequests();
      } else if (typeof loadClearanceRequests === 'function') {
        console.log('🔄 Reloading clearance inbox...');
        loadClearanceRequests();
      }
    }, 500);
  }

  // Set flag when navigating TO detail pages
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function() {
    if (arguments[2] && arguments[2].includes('detail.html')) {
      console.log('📍 Navigating to detail page');
    }
    return originalPushState.apply(history, arguments);
  };

  // Listen for navigation away from detail pages
  window.addEventListener('beforeunload', function() {
    if (window.location.href.includes('detail.html')) {
      sessionStorage.setItem('returnedFromDetail', 'true');
    }
  });

  console.log('✅ Refresh after approval system loaded');
})();

