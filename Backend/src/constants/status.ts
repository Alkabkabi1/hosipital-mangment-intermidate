import { AppError } from '../core/errors';

export type CanonicalStatus = 'pending' | 'approved' | 'rejected';

const EN_PENDING = new Set(['pending', 'awaiting', 'in_progress', 'submitted', 'new']);
const EN_APPROVED = new Set(['approved', 'accepted', 'done', 'complete', 'completed']);
const EN_REJECTED = new Set(['rejected', 'declined', 'denied', 'cancelled', 'canceled']);

const AR_PENDING = ['قيد', 'انتظار', 'مراجعة', 'معل'];
const AR_APPROVED = ['موافق', 'اعتماد', 'تمت موافق'];
const AR_REJECTED = ['مرفوض', 'رفض'];

function includesArabicAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

export function toCanonicalStatus(raw: unknown): CanonicalStatus {
  if (raw == null || raw === '') return 'pending';
  if (typeof raw !== 'string') throw new AppError({ statusCode: 422, message: 'Invalid status type' });

  const s = raw.trim();
  const lower = s.toLowerCase();

  if (EN_APPROVED.has(lower) || includesArabicAny(s, AR_APPROVED)) return 'approved';
  if (EN_REJECTED.has(lower) || includesArabicAny(s, AR_REJECTED)) return 'rejected';
  if (EN_PENDING.has(lower) || includesArabicAny(s, AR_PENDING)) return 'pending';

  throw new AppError({ statusCode: 422, message: `Unknown status value: ${s}` });
}

export function assertCanonicalStatus(value: unknown): asserts value is CanonicalStatus {
  const _ = toCanonicalStatus(value);
}
