'use strict';

/**
 * Floyd-Warshall shortest-path computation.
 * All edge weights are treated as 1 (unweighted directed graph).
 *
 * @param {Array<{parent:string, child:string}>} validEdges
 * @returns {{
 *   nodes: string[],
 *   dist: Object,          // dist[u][v] = shortest distance (Infinity if unreachable)
 *   matrix: number[][],    // 2-D matrix in node-index order
 *   nodeIndex: Object      // node → row/col index
 * }}
 */
function floydWarshall(validEdges) {
  // Collect all unique nodes
  const nodeSet = new Set();
  for (const { parent, child } of validEdges) {
    nodeSet.add(parent);
    nodeSet.add(child);
  }
  const nodes = [...nodeSet].sort();
  const n = nodes.length;

  if (n === 0) return { nodes: [], dist: {}, matrix: [], nodeIndex: {} };

  // Map node → index
  const nodeIndex = {};
  nodes.forEach((node, i) => { nodeIndex[node] = i; });

  // Initialise distance matrix: Infinity everywhere, 0 on diagonal
  const INF = Infinity;
  const matrix = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : INF))
  );

  // Set direct edges (weight = 1)
  for (const { parent, child } of validEdges) {
    const u = nodeIndex[parent];
    const v = nodeIndex[child];
    matrix[u][v] = 1;
  }

  // Floyd-Warshall O(n³)
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (matrix[i][k] !== INF && matrix[k][j] !== INF) {
          const through = matrix[i][k] + matrix[k][j];
          if (through < matrix[i][j]) {
            matrix[i][j] = through;
          }
        }
      }
    }
  }

  // Build readable dist object: dist[u][v]
  const dist = {};
  for (let i = 0; i < n; i++) {
    dist[nodes[i]] = {};
    for (let j = 0; j < n; j++) {
      dist[nodes[i]][nodes[j]] = matrix[i][j] === INF ? null : matrix[i][j];
    }
  }

  return { nodes, dist, matrix, nodeIndex };
}

module.exports = { floydWarshall };
