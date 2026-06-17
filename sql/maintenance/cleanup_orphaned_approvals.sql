-- تنظيف الموافقات اليتيمة (الموافقات التي تشير إلى طلبات غير موجودة)

-- فحص الموافقات اليتيمة للإخلاء
SELECT
    ra.approval_id,
    ra.request_id,
    ra.request_type,
    ra.status as approval_status,
    'Clearance request not found' as issue
FROM Request_Approvals ra
LEFT JOIN Clearance_Requests cr ON ra.request_type = 'clearance' AND ra.request_id = cr.id
WHERE ra.request_type = 'clearance'
    AND cr.id IS NULL;

-- فحص الموافقات اليتيمة للمباشرة
SELECT
    ra.approval_id,
    ra.request_id,
    ra.request_type,
    ra.status as approval_status,
    'Onboarding request not found' as issue
FROM Request_Approvals ra
LEFT JOIN Onboarding_Requests obr ON ra.request_type = 'onboarding' AND ra.request_id = obr.id
WHERE ra.request_type = 'onboarding'
    AND obr.id IS NULL;

-- فحص الموافقات اليتيمة للتفويض
SELECT
    ra.approval_id,
    ra.request_id,
    ra.request_type,
    ra.status as approval_status,
    'Delegation request not found' as issue
FROM Request_Approvals ra
LEFT JOIN Delegation_Requests dr ON ra.request_type = 'delegation' AND ra.request_id = dr.id
WHERE ra.request_type = 'delegation'
    AND dr.id IS NULL;

-- حذف الموافقات اليتيمة للإخلاء
DELETE ra FROM Request_Approvals ra
LEFT JOIN Clearance_Requests cr ON ra.request_type = 'clearance' AND ra.request_id = cr.id
WHERE ra.request_type = 'clearance'
    AND cr.id IS NULL;

-- حذف الموافقات اليتيمة للمباشرة
DELETE ra FROM Request_Approvals ra
LEFT JOIN Onboarding_Requests obr ON ra.request_type = 'onboarding' AND ra.request_id = obr.id
WHERE ra.request_type = 'onboarding'
    AND obr.id IS NULL;

-- حذف الموافقات اليتيمة للتفويض
DELETE ra FROM Request_Approvals ra
LEFT JOIN Delegation_Requests dr ON ra.request_type = 'delegation' AND ra.request_id = dr.id
WHERE ra.request_type = 'delegation'
    AND dr.id IS NULL;

-- فحص النتائج بعد التنظيف
SELECT 'Remaining approvals:' as status, COUNT(*) as count FROM Request_Approvals;

SELECT
    request_type,
    COUNT(*) as count
FROM Request_Approvals
GROUP BY request_type
ORDER BY request_type;
