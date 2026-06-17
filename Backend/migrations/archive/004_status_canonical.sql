-- Canonicalize legacy statuses to pending|approved|rejected (idempotent)
SET NAMES utf8mb4;

-- Pending variants (English)
UPDATE Onboarding_Requests SET status = 'pending' WHERE LOWER(status) IN ('pending','awaiting','in_progress','submitted','new');
UPDATE Clearance_Requests  SET status = 'pending' WHERE LOWER(status) IN ('pending','awaiting','in_progress','submitted','new');
UPDATE Delegation_Requests SET status = 'pending' WHERE LOWER(status) IN ('pending','awaiting','in_progress','submitted','new');

-- Pending variants (Arabic keywords)
UPDATE Onboarding_Requests SET status = 'pending' 
  WHERE status LIKE '%قيد%' OR status LIKE '%انتظار%' OR status LIKE '%مراجعة%' OR status LIKE '%معل%';
UPDATE Clearance_Requests SET status = 'pending'
  WHERE status LIKE '%قيد%' OR status LIKE '%انتظار%' OR status LIKE '%مراجعة%' OR status LIKE '%معل%';
UPDATE Delegation_Requests SET status = 'pending'
  WHERE status LIKE '%قيد%' OR status LIKE '%انتظار%' OR status LIKE '%مراجعة%' OR status LIKE '%معل%';

-- Approved variants (English)
UPDATE Onboarding_Requests SET status = 'approved' WHERE LOWER(status) IN ('approved','accepted','done','complete','completed');
UPDATE Clearance_Requests  SET status = 'approved' WHERE LOWER(status) IN ('approved','accepted','done','complete','completed');
UPDATE Delegation_Requests SET status = 'approved' WHERE LOWER(status) IN ('approved','accepted','done','complete','completed');

-- Approved variants (Arabic keywords)
UPDATE Onboarding_Requests SET status = 'approved' WHERE status LIKE '%موافق%' OR status LIKE '%اعتماد%' OR status LIKE '%تمت موافق%';
UPDATE Clearance_Requests  SET status = 'approved' WHERE status LIKE '%موافق%' OR status LIKE '%اعتماد%' OR status LIKE '%تمت موافق%';
UPDATE Delegation_Requests SET status = 'approved' WHERE status LIKE '%موافق%' OR status LIKE '%اعتماد%' OR status LIKE '%تمت موافق%';

-- Rejected variants (English)
UPDATE Onboarding_Requests SET status = 'rejected' WHERE LOWER(status) IN ('rejected','declined','denied','cancelled','canceled');
UPDATE Clearance_Requests  SET status = 'rejected' WHERE LOWER(status) IN ('rejected','declined','denied','cancelled','canceled');
UPDATE Delegation_Requests SET status = 'rejected' WHERE LOWER(status) IN ('rejected','declined','denied','cancelled','canceled');

-- Rejected variants (Arabic keywords)
UPDATE Onboarding_Requests SET status = 'rejected' WHERE status LIKE '%مرفوض%' OR status LIKE '%رفض%';
UPDATE Clearance_Requests  SET status = 'rejected' WHERE status LIKE '%مرفوض%' OR status LIKE '%رفض%';
UPDATE Delegation_Requests SET status = 'rejected' WHERE status LIKE '%مرفوض%' OR status LIKE '%رفض%';

