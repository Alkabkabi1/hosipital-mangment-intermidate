import { describe, it, expect } from 'vitest';
import { toCanonicalStatus, assertCanonicalStatus } from '../../src/constants/status';
import { AppError } from '../../src/core/errors';

describe('Canonical Status', () => {
  it('maps Arabic/English variants to canonical', () => {
    expect(toCanonicalStatus('approved')).toBe('approved');
    expect(toCanonicalStatus('APPROVED')).toBe('approved');
    expect(toCanonicalStatus('completed')).toBe('approved');
    expect(toCanonicalStatus('rejected')).toBe('rejected');
    expect(toCanonicalStatus('declined')).toBe('rejected');
    expect(toCanonicalStatus('pending')).toBe('pending');
    expect(toCanonicalStatus('awaiting')).toBe('pending');
  });

  it('defaults to pending only for falsy', () => {
    expect(toCanonicalStatus('')).toBe('pending');
    expect(toCanonicalStatus(null as any)).toBe('pending');
    expect(toCanonicalStatus(undefined as any)).toBe('pending');
  });

  it('throws 422 for unknown non-falsy values', () => {
    try {
      toCanonicalStatus('weird-status');
      throw new Error('expected throw');
    } catch (err: any) {
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(422);
    }
  });

  it('assertCanonicalStatus narrows type or throws', () => {
    expect(() => assertCanonicalStatus('approved')).not.toThrow();
    expect(() => assertCanonicalStatus('invalid-x')).toThrow();
  });
});

