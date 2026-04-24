'use strict';

const { detectCycle } = require('./cycleDetector');

describe('CycleDetector', () => {
  test('acyclic tree A->B->C returns false', () => {
    const adj = new Map([['A', ['B']], ['B', ['C']]]);
    expect(detectCycle('A', adj)).toBe(false);
  });

  test('simple cycle A->B, B->A returns true', () => {
    const adj = new Map([['A', ['B']], ['B', ['A']]]);
    expect(detectCycle('A', adj)).toBe(true);
  });

  test('three-node cycle X->Y->Z->X returns true', () => {
    const adj = new Map([['X', ['Y']], ['Y', ['Z']], ['Z', ['X']]]);
    expect(detectCycle('X', adj)).toBe(true);
  });

  test('cycle reachable from root returns true', () => {
    // A->B->C->B (cycle at B-C)
    const adj = new Map([['A', ['B']], ['B', ['C']], ['C', ['B']]]);
    expect(detectCycle('A', adj)).toBe(true);
  });

  test('single node with no edges returns false', () => {
    const adj = new Map();
    expect(detectCycle('A', adj)).toBe(false);
  });

  test('branching tree with no cycle returns false', () => {
    const adj = new Map([['A', ['B', 'C']], ['B', ['D']], ['C', ['E']]]);
    expect(detectCycle('A', adj)).toBe(false);
  });
});
