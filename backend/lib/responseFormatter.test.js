'use strict';

const { formatResponse } = require('./responseFormatter');

const identity = {
  userId: 'johndoe_17091999',
  emailId: 'john@college.edu',
  rollNumber: '21CS1001',
};

describe('ResponseFormatter', () => {
  test('acyclic component has depth, no has_cycle', () => {
    const components = [{ root: 'A', tree: { A: { B: {} } }, depth: 2, hasCycle: false }];
    const { hierarchies } = formatResponse(components, [], [], identity);
    expect(hierarchies[0].depth).toBe(2);
    expect(hierarchies[0].has_cycle).toBeUndefined();
  });

  test('cyclic component has has_cycle: true, tree: {}, no depth', () => {
    const components = [{ root: 'X', tree: {}, depth: undefined, hasCycle: true }];
    const { hierarchies } = formatResponse(components, [], [], identity);
    expect(hierarchies[0].has_cycle).toBe(true);
    expect(hierarchies[0].tree).toEqual({});
    expect(hierarchies[0].depth).toBeUndefined();
  });

  test('total_trees counts non-cyclic components', () => {
    const components = [
      { root: 'A', tree: { A: {} }, depth: 1, hasCycle: false },
      { root: 'B', tree: { B: {} }, depth: 1, hasCycle: false },
      { root: 'X', tree: {}, depth: undefined, hasCycle: true },
    ];
    const { summary } = formatResponse(components, [], [], identity);
    expect(summary.total_trees).toBe(2);
  });

  test('total_cycles counts cyclic components', () => {
    const components = [
      { root: 'A', tree: { A: {} }, depth: 1, hasCycle: false },
      { root: 'X', tree: {}, depth: undefined, hasCycle: true },
      { root: 'Y', tree: {}, depth: undefined, hasCycle: true },
    ];
    const { summary } = formatResponse(components, [], [], identity);
    expect(summary.total_cycles).toBe(2);
  });

  test('largest_tree_root is root of deepest tree', () => {
    const components = [
      { root: 'A', tree: {}, depth: 4, hasCycle: false },
      { root: 'P', tree: {}, depth: 3, hasCycle: false },
    ];
    const { summary } = formatResponse(components, [], [], identity);
    expect(summary.largest_tree_root).toBe('A');
  });

  test('largest_tree_root tiebreaker: lexicographically smallest root', () => {
    const components = [
      { root: 'B', tree: {}, depth: 3, hasCycle: false },
      { root: 'A', tree: {}, depth: 3, hasCycle: false },
    ];
    const { summary } = formatResponse(components, [], [], identity);
    expect(summary.largest_tree_root).toBe('A');
  });

  test('largest_tree_root is "" when no acyclic trees', () => {
    const components = [{ root: 'X', tree: {}, depth: undefined, hasCycle: true }];
    const { summary } = formatResponse(components, [], [], identity);
    expect(summary.largest_tree_root).toBe('');
  });

  test('identity fields are included in response', () => {
    const response = formatResponse([], [], [], identity);
    expect(response.user_id).toBe('johndoe_17091999');
    expect(response.email_id).toBe('john@college.edu');
    expect(response.college_roll_number).toBe('21CS1001');
  });

  test('invalid_entries and duplicate_edges are passed through', () => {
    const response = formatResponse([], ['bad', 'worse'], ['A->B'], identity);
    expect(response.invalid_entries).toEqual(['bad', 'worse']);
    expect(response.duplicate_edges).toEqual(['A->B']);
  });

  test('full spec example produces correct response', () => {
    const components = [
      {
        root: 'A',
        tree: { A: { B: { D: {} }, C: { E: { F: {} } } } },
        depth: 4,
        hasCycle: false,
      },
      { root: 'X', tree: {}, depth: undefined, hasCycle: true },
      { root: 'P', tree: { P: { Q: { R: {} } } }, depth: 3, hasCycle: false },
      { root: 'G', tree: { G: { H: {}, I: {} } }, depth: 2, hasCycle: false },
    ];
    const response = formatResponse(
      components,
      ['hello', '1->2', 'A->'],
      ['G->H'],
      identity
    );
    expect(response.summary.total_trees).toBe(3);
    expect(response.summary.total_cycles).toBe(1);
    expect(response.summary.largest_tree_root).toBe('A');
    expect(response.invalid_entries).toEqual(['hello', '1->2', 'A->']);
    expect(response.duplicate_edges).toEqual(['G->H']);
  });
});
