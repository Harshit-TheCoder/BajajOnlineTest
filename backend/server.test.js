'use strict';

const request = require('supertest');

// Set env vars before requiring app
process.env.USER_ID = 'johndoe_17091999';
process.env.EMAIL_ID = 'john@college.edu';
process.env.COLLEGE_ROLL_NUMBER = '21CS1001';

const app = require('./server');

describe('POST /bfhl — Integration Tests', () => {
  test('valid payload returns 200 with correct structure', async () => {
    const res = await request(app)
      .post('/bfhl')
      .send({
        data: [
          'A->B', 'A->C', 'B->D', 'C->E', 'E->F',
          'X->Y', 'Y->Z', 'Z->X',
          'P->Q', 'Q->R',
          'G->H', 'G->H', 'G->I',
          'hello', '1->2', 'A->',
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.user_id).toBe('johndoe_17091999');
    expect(res.body.email_id).toBe('john@college.edu');
    expect(res.body.college_roll_number).toBe('21CS1001');
    expect(Array.isArray(res.body.hierarchies)).toBe(true);
    expect(res.body.invalid_entries).toEqual(['hello', '1->2', 'A->']);
    expect(res.body.duplicate_edges).toEqual(['G->H']);
    expect(res.body.summary.total_trees).toBe(3);
    expect(res.body.summary.total_cycles).toBe(1);
    expect(res.body.summary.largest_tree_root).toBe('A');
  });

  test('missing data field returns 400', async () => {
    const res = await request(app).post('/bfhl').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('non-array data returns 400', async () => {
    const res = await request(app).post('/bfhl').send({ data: 'A->B' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('empty data array returns 200 with empty hierarchies', async () => {
    const res = await request(app).post('/bfhl').send({ data: [] });
    expect(res.status).toBe(200);
    expect(res.body.hierarchies).toEqual([]);
    expect(res.body.summary.total_trees).toBe(0);
    expect(res.body.summary.total_cycles).toBe(0);
    expect(res.body.summary.largest_tree_root).toBe('');
  });

  test('identity fields are present in every response', async () => {
    const res = await request(app).post('/bfhl').send({ data: ['A->B'] });
    expect(res.body.user_id).toBeTruthy();
    expect(res.body.email_id).toBeTruthy();
    expect(res.body.college_roll_number).toBeTruthy();
  });

  test('CORS headers are present', async () => {
    const res = await request(app)
      .post('/bfhl')
      .set('Origin', 'http://localhost:5173')
      .send({ data: ['A->B'] });
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });

  test('response time for 50-item payload is under 3 seconds', async () => {
    const data = [];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    for (let i = 0; i < 25; i++) {
      data.push(`${letters[i]}->${letters[(i + 1) % 26]}`);
    }
    // Pad to 50 with some invalid entries
    while (data.length < 50) data.push('invalid');

    const start = Date.now();
    const res = await request(app).post('/bfhl').send({ data });
    const elapsed = Date.now() - start;

    expect(res.status).toBe(200);
    expect(elapsed).toBeLessThan(3000);
  });
});
