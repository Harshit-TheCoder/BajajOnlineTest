'use strict';

/**
 * Parser — validates and deduplicates an array of node strings.
 *
 * A valid node string matches /^[A-Z]->[A-Z]$/ after trimming,
 * and must not be a self-loop (e.g. "A->A").
 *
 * @param {string[]} data - Raw input array from the request body.
 * @returns {{ validEdges: Array<{parent:string,child:string}>, invalidEntries: string[], duplicateEdges: string[] }}
 */
function parse(data) {
  const VALID_PATTERN = /^[A-Z]->[A-Z]$/;

  const validEdges = [];
  const invalidEntries = [];
  const duplicateEdges = [];

  // Track seen pairs to detect duplicates: "X->Y"
  const seen = new Set();
  // Track which pairs have already been added to duplicateEdges
  const reportedDuplicates = new Set();

  for (const entry of data) {
    const trimmed = typeof entry === 'string' ? entry.trim() : String(entry).trim();

    // Validate format
    if (!VALID_PATTERN.test(trimmed)) {
      // Store original (untrimmed) form
      invalidEntries.push(entry);
      continue;
    }

    const parent = trimmed[0];
    const child = trimmed[3];

    // Self-loop check (redundant given regex, but explicit per spec)
    if (parent === child) {
      invalidEntries.push(entry);
      continue;
    }

    const key = `${parent}->${child}`;

    if (seen.has(key)) {
      // Duplicate — add to duplicateEdges exactly once per pair
      if (!reportedDuplicates.has(key)) {
        duplicateEdges.push(key);
        reportedDuplicates.add(key);
      }
    } else {
      seen.add(key);
      validEdges.push({ parent, child });
    }
  }

  return { validEdges, invalidEntries, duplicateEdges };
}

module.exports = { parse };
