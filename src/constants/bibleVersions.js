export const DEFAULT_VERSION = 'rva2015';

/** @type {Record<string, string>} */
export const VERSION_ALIASES = {
  rvr60: 'rva2015',
};

/** @type {readonly string[]} */
export const VALID_VERSION_IDS = ['rva2015', 'nbla', 'kjv'];

const UNSAFE_VERSION_PATTERN = /[./\\]/;

/**
 * @param {unknown} version
 * @returns {string}
 */
export function normalizeVersionId(version) {
  if (typeof version !== 'string' || !version.trim()) {
    return DEFAULT_VERSION;
  }

  const trimmed = version.trim();
  if (UNSAFE_VERSION_PATTERN.test(trimmed)) {
    return DEFAULT_VERSION;
  }

  const aliased = VERSION_ALIASES[trimmed] ?? trimmed;
  return VALID_VERSION_IDS.includes(aliased) ? aliased : DEFAULT_VERSION;
}

/**
 * @param {unknown} version
 * @returns {string}
 */
export function assertValidVersion(version) {
  return normalizeVersionId(version);
}
