import { describe, expect, it } from 'vitest';
import { assertValidVersion, normalizeVersionId } from './bibleVersions';

describe('bibleVersions', () => {
  it('migrates legacy rvr60 to rva2015', () => {
    expect(normalizeVersionId('rvr60')).toBe('rva2015');
  });

  it('falls back to NBLA for unknown versions', () => {
    expect(normalizeVersionId('invalid')).toBe('nbla');
    expect(normalizeVersionId('')).toBe('nbla');
  });

  it('rejects path traversal in version id', () => {
    expect(normalizeVersionId('../cba')).toBe('nbla');
    expect(normalizeVersionId('rva2015/../../etc')).toBe('nbla');
  });

  it('keeps valid version ids', () => {
    expect(assertValidVersion('nbla')).toBe('nbla');
    expect(assertValidVersion('kjv')).toBe('kjv');
  });
});
