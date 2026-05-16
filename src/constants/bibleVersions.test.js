import { describe, expect, it } from 'vitest';
import { assertValidVersion, normalizeVersionId } from './bibleVersions';

describe('bibleVersions', () => {
  it('migrates legacy rvr60 to rva2015', () => {
    expect(normalizeVersionId('rvr60')).toBe('rva2015');
  });

  it('falls back to rva2015 for unknown versions', () => {
    expect(normalizeVersionId('invalid')).toBe('rva2015');
    expect(normalizeVersionId('')).toBe('rva2015');
  });

  it('rejects path traversal in version id', () => {
    expect(normalizeVersionId('../cba')).toBe('rva2015');
    expect(normalizeVersionId('rva2015/../../etc')).toBe('rva2015');
  });

  it('keeps valid version ids', () => {
    expect(assertValidVersion('nbla')).toBe('nbla');
    expect(assertValidVersion('kjv')).toBe('kjv');
  });
});
