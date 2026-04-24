'use strict';

const { buildComponents } = require('./treeBuilder');

describe('TreeBuilder', () => {
  test('single edge A->B produces one component with root A, depth 2', () => {
    const components = buildComponents([{ parent: 'A', child: 'B' }]);
    expect(components).toHaveLength(1);
    expect(components[0].root).toBe('A');
    expect(components[0].depth).toBe(2);
    expect(components[0].hasCycle).toBe(false);
  });

  test('linear chain A->B->C has depth 3', () => {
    const components = buildComponents([
      { parent: 'A', child: 'B' },
      { parent: 'B', child: 'C' },
    ]);
    expect(components).toHaveLength(1);
    expect(components[0].root).toBe('A');
    expect(components[0].depth).toBe(3);
  });

  test('branching tree depth = max branch length', () => {
    // A->B->D (depth 3), A->C (depth 2) → max depth 3
    const components = buildComponents([
      { parent: 'A', child: 'B' },
      { parent: 'A', child: 'C' },
      { parent: 'B', child: 'D' },
    ]);
    expect(components).toHaveLength(1);
    expect(components[0].depth).toBe(3);
  });

  test('root is the node that never appears as a child', () => {
    const components = buildComponents([
      { parent: 'P', child: 'Q' },
      { parent: 'Q', child: 'R' },
    ]);
    expect(components[0].root).toBe('P');
  });

  test('single-parent constraint: conflicting parent edge is discarded', () => {
    // A->D and B->D: B->D should be discarded (A->D comes first)
    const components = buildComponents([
      { parent: 'A', child: 'D' },
      { parent: 'B', child: 'D' },
    ]);
    // D should only have A as parent
    // A and B are separate roots, but D belongs to A's component
    const aComp = components.find((c) => c.root === 'A');
    expect(aComp).toBeDefined();
    expect(aComp.tree).toEqual({ A: { D: {} } });
  });

  test('multiple disconnected components are returned separately', () => {
    const components = buildComponents([
      { parent: 'A', child: 'B' },
      { parent: 'X', child: 'Y' },
    ]);
    expect(components).toHaveLength(2);
    const roots = components.map((c) => c.root).sort();
    expect(roots).toEqual(['A', 'X']);
  });

  test('pure cycle uses lexicographically smallest node as root', () => {
    // X->Y->Z->X — all nodes appear as children
    const components = buildComponents([
      { parent: 'X', child: 'Y' },
      { parent: 'Y', child: 'Z' },
      { parent: 'Z', child: 'X' },
    ]);
    expect(components).toHaveLength(1);
    expect(components[0].hasCycle).toBe(true);
    expect(components[0].root).toBe('X'); // X < Y < Z
  });

  test('cyclic component has hasCycle=true and empty tree', () => {
    const components = buildComponents([
      { parent: 'A', child: 'B' },
      { parent: 'B', child: 'A' },
    ]);
    expect(components[0].hasCycle).toBe(true);
    expect(components[0].tree).toEqual({});
    expect(components[0].depth).toBeUndefined();
  });

  test('empty validEdges returns empty array', () => {
    expect(buildComponents([])).toEqual([]);
  });

  test('nested tree structure is correct for example from spec', () => {
    const components = buildComponents([
      { parent: 'A', child: 'B' },
      { parent: 'A', child: 'C' },
      { parent: 'B', child: 'D' },
      { parent: 'C', child: 'E' },
      { parent: 'E', child: 'F' },
    ]);
    expect(components).toHaveLength(1);
    expect(components[0].root).toBe('A');
    expect(components[0].depth).toBe(4);
    expect(components[0].tree).toEqual({
      A: {
        B: { D: {} },
        C: { E: { F: {} } },
      },
    });
  });
});
