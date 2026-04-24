'use strict';

const { parse } = require('./parser');

describe('Parser', () => {
  test('valid edge "A->B" is accepted', () => {
    const { validEdges, invalidEntries } = parse(['A->B']);
    expect(validEdges).toEqual([{ parent: 'A', child: 'B' }]);
    expect(invalidEntries).toHaveLength(0);
  });

  test('whitespace-padded valid edge "  A->B  " is accepted', () => {
    const { validEdges, invalidEntries } = parse(['  A->B  ']);
    expect(validEdges).toEqual([{ parent: 'A', child: 'B' }]);
    expect(invalidEntries).toHaveLength(0);
  });

  test('invalid format "ABC" goes to invalid_entries', () => {
    const { validEdges, invalidEntries } = parse(['ABC']);
    expect(validEdges).toHaveLength(0);
    expect(invalidEntries).toContain('ABC');
  });

  test('self-loop "A->A" is invalid', () => {
    const { validEdges, invalidEntries } = parse(['A->A']);
    expect(validEdges).toHaveLength(0);
    expect(invalidEntries).toContain('A->A');
  });

  test('empty string is invalid', () => {
    const { validEdges, invalidEntries } = parse(['']);
    expect(validEdges).toHaveLength(0);
    expect(invalidEntries).toContain('');
  });

  test('duplicate "A->B" appears once in duplicateEdges', () => {
    const { validEdges, duplicateEdges } = parse(['A->B', 'A->B', 'A->B']);
    expect(validEdges).toHaveLength(1);
    expect(duplicateEdges).toEqual(['A->B']);
  });

  test('invalid entry order is preserved', () => {
    const { invalidEntries } = parse(['hello', 'A->B', '1->2', 'A->C', 'bad']);
    expect(invalidEntries).toEqual(['hello', '1->2', 'bad']);
  });

  test('duplicate edge order is preserved (first-encounter order)', () => {
    const { duplicateEdges } = parse(['A->B', 'C->D', 'A->B', 'C->D', 'E->F', 'E->F']);
    expect(duplicateEdges).toEqual(['A->B', 'C->D', 'E->F']);
  });

  test('multi-character parent "AB->C" is invalid', () => {
    const { invalidEntries } = parse(['AB->C']);
    expect(invalidEntries).toContain('AB->C');
  });

  test('wrong separator "A-B" is invalid', () => {
    const { invalidEntries } = parse(['A-B']);
    expect(invalidEntries).toContain('A-B');
  });

  test('missing child "A->" is invalid', () => {
    const { invalidEntries } = parse(['A->']);
    expect(invalidEntries).toContain('A->');
  });

  test('lowercase letters "a->b" are invalid', () => {
    const { invalidEntries } = parse(['a->b']);
    expect(invalidEntries).toContain('a->b');
  });

  test('empty data array returns empty results', () => {
    const result = parse([]);
    expect(result.validEdges).toHaveLength(0);
    expect(result.invalidEntries).toHaveLength(0);
    expect(result.duplicateEdges).toHaveLength(0);
  });

  test('original untrimmed form stored in invalidEntries', () => {
    const { invalidEntries } = parse(['  bad  ']);
    expect(invalidEntries).toContain('  bad  ');
  });
});
