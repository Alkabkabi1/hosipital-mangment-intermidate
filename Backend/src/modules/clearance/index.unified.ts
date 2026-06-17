// =====================================================
// UNIFIED CLEARANCE MODULE - CONFLICT RESOLUTION EXPORTS
// =====================================================
// Single export point for unified clearance functionality
// Resolves dual implementation conflicts between clearance module
// and employee-requests clearance handling
// =====================================================

// Main unified service
export { UnifiedClearanceService } from './clearance.service.unified';

// Unified controllers (both new and legacy compatibility)
export * from './clearance.controller.unified';

// Unified routes
export { default as clearanceRoutes } from './clearance.routes.unified';

// Types and interfaces
export type { UnifiedClearanceInput, ClearanceResponse } from './clearance.service.unified';

// Legacy exports for backward compatibility
export { UnifiedClearanceService as ClearanceService } from './clearance.service.unified';

// Default export for easy importing
export default {
  service: require('./clearance.service.unified').UnifiedClearanceService,
  routes: require('./clearance.routes.unified').default,
  version: '2.0-unified'
};
