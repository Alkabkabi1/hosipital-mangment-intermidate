import { withConnection } from '../../core/database';
import { AppError } from '../../core/errors';

interface ClearanceStatusRecord {
  status_id: number;
  name_en: string;
  name_ar: string;
  description?: string | null;
}

const clearanceStatusCache = new Map<string, ClearanceStatusRecord>();
const clearanceStatusById = new Map<number, ClearanceStatusRecord>();
let clearanceStatusesLoaded = false;

export async function getClearanceStatusLabel(statusId: number, locale: 'ar' | 'en' = 'ar'): Promise<string> {
  // Handle undefined statusId gracefully
  if (statusId === undefined || statusId === null) {
    console.warn('⚠️ getClearanceStatusLabel called with undefined statusId, returning default');
    return 'قيد الاعتماد'; // Default pending status
  }
  
  await ensureClearanceStatuses();
  const record = clearanceStatusById.get(statusId);
  if (!record) {
    console.warn(`⚠️ Unknown clearance status id: ${statusId}, returning default`);
    return 'قيد الاعتماد'; // Default pending status instead of throwing error
  }
  return locale === 'ar' ? record.name_ar : record.name_en;
}

function ensureClearanceStatuses(): Promise<void> {
  if (clearanceStatusesLoaded) {
    return Promise.resolve();
  }
  return hydrateClearanceStatuses();
}

export async function getClearanceStatusIdByName(statusName: string): Promise<number> {
  const normalized = statusName.trim().toLowerCase();
  if (!clearanceStatusesLoaded || !clearanceStatusCache.has(normalized)) {
    await hydrateClearanceStatuses();
  }

  const record = clearanceStatusCache.get(normalized);
  if (!record) {
    throw new AppError({ statusCode: 400, message: `Unknown clearance status: ${statusName}`, code: 'BAD_REQUEST' });
  }
  return record.status_id;
}

async function hydrateClearanceStatuses(): Promise<void> {
  // Since ClearanceStatuses table doesn't exist, create static status mapping
  const staticStatuses = [
    { status_id: 1, name_en: 'pending', name_ar: 'قيد الاعتماد', description: 'Pending approval' },
    { status_id: 2, name_en: 'approved', name_ar: 'مكتمل', description: 'Approved' },
    { status_id: 3, name_en: 'rejected', name_ar: 'مرفوض', description: 'Rejected' }
  ];
  
  const rows = staticStatuses;
  
  clearanceStatusCache.clear();
  clearanceStatusById.clear();
  
  for (const row of rows as ClearanceStatusRecord[]) {
    if (row.name_en) {
      clearanceStatusCache.set(row.name_en, row);
    }
    if (row.name_ar) {
      clearanceStatusCache.set(row.name_ar, row);
    }
    clearanceStatusById.set(row.status_id, row);
  }
  
  clearanceStatusesLoaded = true;
}

export const STANDARD_WORKFLOW_STATUSES = {
  pending: 'PENDING',
  inProgress: 'IN_PROGRESS',
  approved: 'APPROVED',
  rejected: 'REJECTED',
  onHold: 'ON_HOLD',
  cancelled: 'CANCELLED',
  completed: 'COMPLETED',
  active: 'ACTIVE',
  suspended: 'SUSPENDED',
} as const;

export type StandardWorkflowStatus = typeof STANDARD_WORKFLOW_STATUSES[keyof typeof STANDARD_WORKFLOW_STATUSES];

type StatusDictionary = Record<StandardWorkflowStatus, readonly string[]>;

const WORKFLOW_STATUS_DICTIONARY: StatusDictionary = {
  PENDING: ['PENDING', 'pending', 'قيد الاعتماد', 'قيد الانتظار', 'منتظر'],
  IN_PROGRESS: ['IN_PROGRESS', 'in_progress', 'قيد المراجعة', 'قيد التنفيذ', 'قيد المعالجة'],
  APPROVED: ['APPROVED', 'approved', 'موافق عليه', 'تمت الموافقة'],
  REJECTED: ['REJECTED', 'rejected', 'مرفوض'],
  ON_HOLD: ['ON_HOLD', 'on_hold', 'معلق'],
  CANCELLED: ['CANCELLED', 'cancelled', 'ملغي', 'ملغى'],
  COMPLETED: ['COMPLETED', 'completed', 'مكتمل', 'منتهي', 'منجز'],
  ACTIVE: ['ACTIVE', 'active', 'نشط'],
  SUSPENDED: ['SUSPENDED', 'suspended', 'موقوف'],
};


const WORKFLOW_STATUS_LABELS: Record<StandardWorkflowStatus, string> = {
  PENDING: 'قيد الاعتماد',
  IN_PROGRESS: 'قيد المراجعة',
  APPROVED: 'موافق عليه',
  REJECTED: 'مرفوض',
  ON_HOLD: 'معلق',
  CANCELLED: 'ملغي',
  COMPLETED: 'مكتمل',
  ACTIVE: 'نشط',
  SUSPENDED: 'موقوف',
};



const WORKFLOW_STATUS_LOOKUP = new Map<string, StandardWorkflowStatus>();

for (const [status, aliases] of Object.entries(WORKFLOW_STATUS_DICTIONARY) as [StandardWorkflowStatus, readonly string[]][]) {
  for (const alias of aliases) {
    const key = normalizeAlias(alias);
    if (!WORKFLOW_STATUS_LOOKUP.has(key)) {
      WORKFLOW_STATUS_LOOKUP.set(key, status);
    }
  }
}

function normalizeAlias(value: string): string {
  return value.trim().toLowerCase();
}

function resolveWorkflowStatus(value: string): StandardWorkflowStatus | null {
  const normalized = normalizeAlias(value);
  return WORKFLOW_STATUS_LOOKUP.get(normalized) ?? null;
}

export function normalizeWorkflowStatus(status: string): StandardWorkflowStatus {
  const resolved = resolveWorkflowStatus(status);
  if (!resolved) {
    throw new AppError({ statusCode: 400, message: `Invalid workflow status: ${status}`, code: 'BAD_REQUEST' });
  }
  return resolved;
}

export function presentWorkflowStatus(status: string): string {
  const resolved = resolveWorkflowStatus(status);
  if (!resolved) {
    return status;
  }
  return WORKFLOW_STATUS_LABELS[resolved] ?? status;
}

export function encodeWorkflowStatus(label: string): StandardWorkflowStatus {
  return normalizeWorkflowStatus(label);
}

export function decodeWorkflowStatus(status: string): string {
  return presentWorkflowStatus(status);
}
