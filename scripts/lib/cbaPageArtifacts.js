const PAGE_PROXIMITY = 20000;

function numericContextIsMeaningful(text, index, length) {
  const before = text.slice(Math.max(0, index - 32), index).toLocaleLowerCase('es');
  const after = text.slice(index + length, index + length + 28).toLocaleLowerCase('es');

  if (/\b(?:p(?:á|a)g(?:ina)?s?|pp|dtg|cs|ec|cra|pvgm|mm|oe|pr|3jt|2jt|1jt)\.?\s*$/u.test(before)) {
    return true;
  }

  if (/\b(?:año|años|mes|meses|día|días|semana|siglo|siglos|capítulo|secciones?|artículos?)\s*$/u.test(before)) {
    return true;
  }

  const hasPreviousNumber = /\d{1,2}\s*$/u.test(before);
  if (!hasPreviousNumber && /^\s*(?:años|días|meses|semanas|km\b|kilómetros?|metros?|m\b|ac\b|a\.\s*c\.)/u.test(after)) {
    return true;
  }

  return false;
}

function hasNearbyNumber(candidatesByNumber, number, index) {
  return (candidatesByNumber.get(number) ?? []).some((candidate) => (
    Math.abs(candidate.position - index) <= PAGE_PROXIMITY
  ));
}

function belongsToPageSequence(candidatesByNumber, candidate) {
  const hasPrevious = hasNearbyNumber(candidatesByNumber, candidate.number - 1, candidate.position);
  const hasNext = hasNearbyNumber(candidatesByNumber, candidate.number + 1, candidate.position);
  const startsSequence = hasNext
    && hasNearbyNumber(candidatesByNumber, candidate.number + 2, candidate.position);
  const endsSequence = hasPrevious
    && hasNearbyNumber(candidatesByNumber, candidate.number - 2, candidate.position);

  return (hasPrevious && hasNext) || startsSequence || endsSequence;
}

/**
 * Removes high-confidence page numbers embedded by the original The Word module.
 * A number is removed only when it is part of a nearby consecutive page sequence
 * and its immediate linguistic context does not identify it as a real quantity or citation.
 *
 * @param {Array<{ blocks: Array<{ text: string }> }>} entries
 * @returns {number}
 */
export function removeLikelyInlinePageArtifacts(entries) {
  const candidates = [];
  const seenBlocks = new Set();
  let position = 0;

  for (const entry of entries) {
    for (const block of entry.blocks) {
      if (seenBlocks.has(block)) continue;
      seenBlocks.add(block);

      for (const match of block.text.matchAll(/(?<![\d.:])\b(\d{3})(?![\d.:])/gu)) {
        candidates.push({
          block,
          index: match.index,
          length: match[1].length,
          number: Number(match[1]),
          position: position + match.index,
        });
      }
      position += block.text.length + 1;
    }
  }

  const candidatesByNumber = new Map();
  for (const candidate of candidates) {
    const candidatesForNumber = candidatesByNumber.get(candidate.number) ?? [];
    candidatesForNumber.push(candidate);
    candidatesByNumber.set(candidate.number, candidatesForNumber);
  }

  const removals = new Map();
  for (const candidate of candidates) {
    if (!belongsToPageSequence(candidatesByNumber, candidate)) continue;
    if (numericContextIsMeaningful(candidate.block.text, candidate.index, candidate.length)) continue;

    const indexes = removals.get(candidate.block) ?? [];
    indexes.push(candidate);
    removals.set(candidate.block, indexes);
  }

  for (const [block, blockRemovals] of removals) {
    let text = block.text;
    for (const candidate of blockRemovals.sort((left, right) => right.index - left.index)) {
      text = `${text.slice(0, candidate.index)}${text.slice(candidate.index + candidate.length)}`;
    }
    block.text = text.replace(/\s{2,}/gu, ' ').trim();
  }

  return [...removals.values()].reduce((total, blockRemovals) => total + blockRemovals.length, 0);
}
