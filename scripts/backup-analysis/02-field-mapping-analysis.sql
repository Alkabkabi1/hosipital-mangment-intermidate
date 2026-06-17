-- =====================================================
-- FIELD MAPPING ANALYSIS - SCHEMA CONFLICTS RESOLUTION
-- =====================================================
-- This script analyzes field relationships between conflicting implementations
-- Identifies data patterns for safe consolidation
-- =====================================================

-- =====================================================
-- SECTION 1: CLEARANCE REQUESTS FIELD ANALYSIS
-- =====================================================

-- Compare fields between different clearance implementations
-- Schema A: employee-requests service (comprehensive)
-- Schema B: dedicated clearance module (clean architecture)

SELECT 'CLEARANCE FIELD ANALYSIS' as analysis_section;

-- Check which additional fields exist in current schema
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Clearance_Requests' 
    AND TABLE_SCHEMA = DATABASE()
ORDER BY ORDINAL_POSITION;

-- Analyze clearance-specific fields usage
SELECT 
    'clearance_type field usage' as field_analysis,
    clearance_type,
    COUNT(*) as usage_count
FROM Clearance_Requests 
WHERE clearance_type IS NOT NULL
GROUP BY clearance_type;

SELECT 
    'specific_reason field usage' as field_analysis,
    specific_reason,
    COUNT(*) as usage_count
FROM Clearance_Requests 
WHERE specific_reason IS NOT NULL
GROUP BY specific_reason;

SELECT 
    'document_number field usage' as field_analysis,
    COUNT(CASE WHEN document_number IS NOT NULL THEN 1 END) as has_document_number,
    COUNT(*) as total_records,
    ROUND(COUNT(CASE WHEN document_number IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as percentage_with_doc_num
FROM Clearance_Requests;

-- Status field analysis for consolidation
SELECT 
    'status field values' as field_analysis,
    status,
    COUNT(*) as usage_count
FROM Clearance_Requests 
GROUP BY status
ORDER BY usage_count DESC;

-- =====================================================
-- SECTION 2: ONBOARDING REQUESTS FIELD ANALYSIS  
-- =====================================================

SELECT 'ONBOARDING FIELD ANALYSIS' as analysis_section;

-- Analyze current onboarding schema
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Onboarding_Requests' 
    AND TABLE_SCHEMA = DATABASE()
ORDER BY ORDINAL_POSITION;

-- Check payload_json usage patterns
SELECT 
    'payload_json usage analysis' as field_analysis,
    COUNT(CASE WHEN payload_json IS NOT NULL THEN 1 END) as has_payload,
    COUNT(*) as total_records,
    ROUND(COUNT(CASE WHEN payload_json IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as percentage_with_payload
FROM Onboarding_Requests;

-- Analyze start_date vs request_date patterns
SELECT 
    'date field analysis' as field_analysis,
    COUNT(CASE WHEN start_date IS NOT NULL THEN 1 END) as has_start_date,
    COUNT(CASE WHEN start_date != request_date THEN 1 END) as different_dates,
    COUNT(*) as total_records
FROM Onboarding_Requests;

-- =====================================================
-- SECTION 3: MULTI-APPROVAL INTEGRATION ANALYSIS
-- =====================================================

SELECT 'MULTI-APPROVAL INTEGRATION ANALYSIS' as analysis_section;

-- Check which request types use multi-approval system
SELECT 
    'Multi-approval usage by request type' as analysis_type,
    'Onboarding' as request_type,
    COUNT(CASE WHEN approval_stage IS NOT NULL THEN 1 END) as using_multi_approval,
    COUNT(*) as total_records
FROM Onboarding_Requests
UNION ALL
SELECT 
    'Multi-approval usage by request type' as analysis_type,
    'Clearance' as request_type,
    COUNT(CASE WHEN approval_stage IS NOT NULL THEN 1 END) as using_multi_approval,
    COUNT(*) as total_records
FROM Clearance_Requests;

-- =====================================================
-- SECTION 4: REFERENCE NUMBER PATTERN ANALYSIS
-- =====================================================

SELECT 'REFERENCE NUMBER PATTERN ANALYSIS' as analysis_section;

-- Analyze reference number patterns across request types
SELECT 
    'Onboarding Reference Patterns' as request_type,
    LEFT(reference_number, 3) as prefix,
    COUNT(*) as count
FROM Onboarding_Requests 
WHERE reference_number IS NOT NULL
GROUP BY LEFT(reference_number, 3)
ORDER BY count DESC;

SELECT 
    'Clearance Reference Patterns' as request_type,
    LEFT(reference_number, 3) as prefix,
    COUNT(*) as count
FROM Clearance_Requests 
WHERE reference_number IS NOT NULL
GROUP BY LEFT(reference_number, 3)
ORDER BY count DESC;

-- =====================================================
-- SECTION 5: EMPLOYEE LINKAGE ANALYSIS
-- =====================================================

SELECT 'EMPLOYEE LINKAGE ANALYSIS' as analysis_section;

-- Check employee_id vs email linkage patterns
SELECT 
    'Employee linkage - Onboarding' as request_type,
    COUNT(CASE WHEN employee_id IS NOT NULL THEN 1 END) as has_employee_id,
    COUNT(CASE WHEN employee_email IS NOT NULL THEN 1 END) as has_employee_email,
    COUNT(CASE WHEN employee_id IS NOT NULL AND employee_email IS NOT NULL THEN 1 END) as has_both,
    COUNT(*) as total_records
FROM Onboarding_Requests;

SELECT 
    'Employee linkage - Clearance' as request_type,
    COUNT(CASE WHEN employee_id IS NOT NULL THEN 1 END) as has_employee_id,
    COUNT(CASE WHEN employee_email IS NOT NULL THEN 1 END) as has_employee_email,
    COUNT(CASE WHEN employee_id IS NOT NULL AND employee_email IS NOT NULL THEN 1 END) as has_both,
    COUNT(*) as total_records
FROM Clearance_Requests;

-- =====================================================
-- SECTION 6: CONFLICT RESOLUTION RECOMMENDATIONS
-- =====================================================

SELECT 'FIELD CONSOLIDATION RECOMMENDATIONS' as analysis_section;

-- Generate field mapping recommendations
SELECT 
    'FIELD MAPPING RECOMMENDATIONS' as recommendation_type,
    'Consolidate last_working_day and last_work_day to last_work_day' as clearance_recommendation,
    'Merge status_id with status field, use status as primary' as status_recommendation,
    'Preserve payload_json for complex form data storage' as payload_recommendation,
    'Maintain employee_id and employee_email for dual lookup capability' as employee_recommendation;
