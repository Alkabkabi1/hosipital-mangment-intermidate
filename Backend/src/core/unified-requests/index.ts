// =====================================================
// UNIFIED REQUEST SYSTEM - MODULE EXPORTS
// =====================================================
// Central export point for unified request system
// Provides clean imports for other parts of the application
// =====================================================

// Main service class
export { UnifiedRequestService } from './unified-request.service';

// Controller functions
export * from './unified-request.controller';

// Routes
export { default as unifiedRequestRoutes } from './unified-request.routes';

// Schemas and types
export * from './unified-request.schema';

// Utility functions
export { generateReferenceNumber, getStandardStatus } from './unified-request.service';
