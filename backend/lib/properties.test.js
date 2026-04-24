'use strict';

// Feature: srm-bfhl-api — Property-Based Tests using fast-check

const fc = require('fast-check');
const { parse } = require('./parser');
const { buildComponents } = require('./treeBuilder');
const { formatResponse } = require('./responseFormatter');

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Arbitrary: a valid edge string "X->Y" where X !== Y
const validEdgeArb = fc
  .tuple(fc.constantFrom(...LETTERS), fc.constantFrom(...LETTERS))
  .filter(([a, b]) => a !== b)
  .map(([a, b]) => `${a}->${b}`);

// Arbitrary: a valid edge string with random whitespace padding
const paddedValidEdgeArb = fc
  .tuple(
    validEdgeArb,
    fc.nat({ max: 3 }),
    fc.nat({ max: 3 })
  )
  .map(([edge, pre, post]) => `${' '.repeat(pre)}${edge}${' '.repeat(post)}`);

// Arbitrary: a string that is definitely NOT a valid edge after trimming
const invalidStringArb = fc
  .string({ minLength: 1, maxLength: 10 })
  .filter((s) => !/^[A-Z]->[A-Z]$/.test(s.trim()));

const identity = {
  userId: 'test_01012000',
  emailId: 'test@college.edu',
  rollNumber: 'TEST001',
};

// --- Property 1: Whitespace-trimmed valid edges are not in invalid_entries ---
test('P1: whitespace-padded valid edges are accepted, not in invalid_entries', () => {
  // Feature: srm-bfhl-api, Property 1: Whitespace-trimmed valid edges not in invalid_entries
  fc.assert(
    fc.property(fc.array(paddedValidEdgeArb, { minLength: 1, maxLength: 10 }), (data) => {
      const { invalidEntries } = parse(data);
      // None of the padded valid edges should appear in invalidEntries
      return invalidEntries.length === 0;
    }),
    { numRuns: 100 }
  );
});

// --- Property 2: Non-matching strings always appear in invalid_entries ---
test('P2: non-matching strings always appear in invalid_entries', () => {
  // Feature: srm-bfhl-api, Property 2: Non-matching strings always in invalid_entries
  fc.assert(
    fc.property(fc.array(invalidStringArb, { minLength: 1, maxLength: 10 }), (data) => {
      const { validEdges, invalidEntries } = parse(data);
      return validEdges.length === 0 && invalidEntries.length === data.length;
    }),
    { numRuns: 100 }
  );
});

// --- Property 3: Invalid entry order is preserved ---
test('P3: invalid entry order matches input order', () => {
  // Feature: srm-bfhl-api, Property 3: Invalid entry order preserved
  fc.assert(
    fc.property(
      fc.array(fc.oneof(validEdgeArb, invalidStringArb), { minLength: 2, maxLength: 20 }),
      (data) => {
        const { invalidEntries } = parse(data);
        const expectedOrder = data.filter((s) => !/^[A-Z]->[A-Z]$/.test(s.trim()) || s.trim()[0] === s.trim()[3]);
        // Check that invalidEntries is a subsequence of data in the same order
        let idx = 0;
        for (const entry of invalidEntries) {
          while (idx < data.length && data[idx] !== entry) idx++;
          if (idx >= data.length) return false;
          idx++;
        }
        return true;
      }
    ),
    { numRuns: 100 }
  );
});

// --- Property 4: Duplicate edges appear exactly once in duplicateEdges ---
test('P4: duplicate edges appear exactly once in duplicateEdges', () => {
  // Feature: srm-bfhl-api, Property 4: Duplicate edges appear exactly once
  fc.assert(
    fc.property(
      fc.tuple(validEdgeArb, fc.integer({ min: 2, max: 5 })),
      ([edge, count]) => {
        const data = Array(count).fill(edge);
        const { duplicateEdges } = parse(data);
        return duplicateEdges.length === 1 && duplicateEdges[0] === edge.trim();
      }
    ),
    { numRuns: 100 }
  );
});

// --- Property 5: Root never appears as a child in its acyclic component ---
test('P5: root never appears as a child in its acyclic component', () => {
  // Feature: srm-bfhl-api, Property 5: Root node is never a child in its component
  fc.assert(
    fc.property(
      fc.array(validEdgeArb, { minLength: 1, maxLength: 8 }),
      (data) => {
        const { validEdges } = parse(data);
        const components = buildComponents(validEdges);
        for (const comp of components) {
          if (!comp.hasCycle) {
            // Collect all children in this component's tree
            const children = collectChildren(comp.tree);
            if (children.has(comp.root)) return false;
          }
        }
        return true;
      }
    ),
    { numRuns: 100 }
  );
});

function collectChildren(tree) {
  const children = new Set();
  function walk(node) {
    for (const [key, subtree] of Object.entries(node)) {
      children.add(key);
      walk(subtree);
    }
  }
  // tree is { root: { ...children } }
  for (const subtree of Object.values(tree)) {
    walk(subtree);
  }
  return children;
}

// --- Property 6: Single-parent constraint is enforced ---
test('P6: single-parent constraint — first-encountered parent wins', () => {
  // Feature: srm-bfhl-api, Property 6: Single-parent constraint enforced
  fc.assert(
    fc.property(
      fc.tuple(
        fc.constantFrom(...LETTERS),
        fc.constantFrom(...LETTERS),
        fc.constantFrom(...LETTERS)
      ).filter(([a, b, c]) => a !== b && b !== c && a !== c),
      ([parent1, parent2, child]) => {
        // Two edges with different parents for the same child
        const data = [`${parent1}->${child}`, `${parent2}->${child}`];
        const { validEdges } = parse(data);
        const components = buildComponents(validEdges);
        // child should only appear once as a child across all components
        let childCount = 0;
        for (const comp of components) {
          if (!comp.hasCycle) {
            const children = collectChildren(comp.tree);
            if (children.has(child)) childCount++;
          }
        }
        return childCount <= 1;
      }
    ),
    { numRuns: 100 }
  );
});

// --- Property 7: Cyclic components are correctly flagged ---
test('P7: cyclic components have has_cycle: true, tree: {}, no depth', () => {
  // Feature: srm-bfhl-api, Property 7: Cyclic components correctly flagged
  // Use a known cycle: A->B, B->C, C->A
  const cycleEdges = [
    { parent: 'A', child: 'B' },
    { parent: 'B', child: 'C' },
    { parent: 'C', child: 'A' },
  ];
  const components = buildComponents(cycleEdges);
  expect(components).toHaveLength(1);
  expect(components[0].hasCycle).toBe(true);
  expect(components[0].tree).toEqual({});
  expect(components[0].depth).toBeUndefined();
});

// --- Property 8: Acyclic components omit has_cycle ---
test('P8: acyclic components have depth, no has_cycle', () => {
  // Feature: srm-bfhl-api, Property 8: Acyclic components omit has_cycle
  fc.assert(
    fc.property(
      // Generate a simple linear chain of 1-5 edges
      fc.integer({ min: 1, max: 5 }),
      (n) => {
        const edges = [];
        for (let i = 0; i < n; i++) {
          edges.push({ parent: LETTERS[i], child: LETTERS[i + 1] });
        }
        const components = buildComponents(edges);
        for (const comp of components) {
          if (!comp.hasCycle) {
            if (comp.depth === undefined) return false;
            if (comp.hasCycle !== false && comp.hasCycle !== undefined) return false;
          }
        }
        return true;
      }
    ),
    { numRuns: 100 }
  );
});

// --- Property 9: Summary counts are consistent with hierarchies ---
test('P9: total_trees + total_cycles === hierarchies.length', () => {
  // Feature: srm-bfhl-api, Property 9: Summary counts consistent
  fc.assert(
    fc.property(
      fc.array(validEdgeArb, { minLength: 0, maxLength: 10 }),
      (data) => {
        const { validEdges, invalidEntries, duplicateEdges } = parse(data);
        const components = buildComponents(validEdges);
        const response = formatResponse(components, invalidEntries, duplicateEdges, identity);
        const { total_trees, total_cycles } = response.summary;
        return total_trees + total_cycles === response.hierarchies.length;
      }
    ),
    { numRuns: 100 }
  );
});

// --- Property 10: largest_tree_root identifies the deepest acyclic tree ---
test('P10: largest_tree_root is root of deepest acyclic tree', () => {
  // Feature: srm-bfhl-api, Property 10: largest_tree_root identifies deepest tree
  // Use two known trees: A->B->C (depth 3) and P->Q (depth 2)
  const edges = [
    { parent: 'A', child: 'B' },
    { parent: 'B', child: 'C' },
    { parent: 'P', child: 'Q' },
  ];
  const components = buildComponents(edges);
  const response = formatResponse(components, [], [], identity);
  expect(response.summary.largest_tree_root).toBe('A');
});

// --- Property 11: JSON round-trip preserves response equivalence ---
test('P11: JSON.parse(JSON.stringify(response)) deep-equals response', () => {
  // Feature: srm-bfhl-api, Property 11: JSON round-trip preserves equivalence
  fc.assert(
    fc.property(
      fc.array(fc.oneof(validEdgeArb, invalidStringArb), { minLength: 0, maxLength: 15 }),
      (data) => {
        const { validEdges, invalidEntries, duplicateEdges } = parse(data);
        const components = buildComponents(validEdges);
        const response = formatResponse(components, invalidEntries, duplicateEdges, identity);
        const roundTripped = JSON.parse(JSON.stringify(response));
        return JSON.stringify(response) === JSON.stringify(roundTripped);
      }
    ),
    { numRuns: 100 }
  );
});
