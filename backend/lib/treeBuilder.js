'use strict';

const { detectCycle } = require('./cycleDetector');

/**
 * Tree_Builder — builds connected components from valid, non-duplicate edges.
 *
 * @param {Array<{parent:string, child:string}>} validEdges
 * @returns {Array<{root:string, tree:object, depth:number, hasCycle:boolean}>}
 */
function buildComponents(validEdges) {
  if (validEdges.length === 0) return [];

  // --- Step 1: Build adjacency and parent maps, enforcing single-parent constraint ---
  // adjacency: parent → [children]  (used for tree building and cycle detection)
  const adjacency = new Map();
  // parentOf: child → parent  (used to enforce single-parent constraint)
  const parentOf = new Map();
  // allNodes: set of all nodes seen
  const allNodes = new Set();

  for (const { parent, child } of validEdges) {
    allNodes.add(parent);
    allNodes.add(child);

    // Single-parent constraint: discard edge if child already has a parent
    if (parentOf.has(child)) {
      continue; // silently discard
    }

    parentOf.set(child, parent);

    if (!adjacency.has(parent)) adjacency.set(parent, []);
    adjacency.get(parent).push(child);
  }

  // --- Step 2: Find connected components (undirected connectivity) ---
  const visited = new Set();
  const components = [];

  for (const node of allNodes) {
    if (visited.has(node)) continue;

    // BFS to collect all nodes in this connected component
    const componentNodes = new Set();
    const queue = [node];
    while (queue.length > 0) {
      const current = queue.shift();
      if (componentNodes.has(current)) continue;
      componentNodes.add(current);
      visited.add(current);

      // Traverse edges in both directions for undirected connectivity
      for (const child of (adjacency.get(current) || [])) {
        if (!componentNodes.has(child)) queue.push(child);
      }
      // Also traverse reverse edges (child → parent)
      if (parentOf.has(current)) {
        const parent = parentOf.get(current);
        if (!componentNodes.has(parent)) queue.push(parent);
      }
    }

    components.push(componentNodes);
  }

  // --- Step 3: For each component, find root, build tree, calculate depth ---
  return components.map((componentNodes) => {
    // Find root: node that never appears as a child within this component
    const roots = [];
    for (const n of componentNodes) {
      if (!parentOf.has(n)) {
        roots.push(n);
      }
    }

    let root;
    if (roots.length > 0) {
      // Use lexicographically smallest root if multiple (shouldn't happen in a tree,
      // but handles disconnected sub-components merged by undirected BFS)
      root = roots.sort()[0];
    } else {
      // Pure cycle — no natural root; use lexicographically smallest node
      root = [...componentNodes].sort()[0];
    }

    // Build component-local adjacency (only edges within this component)
    const localAdj = new Map();
    for (const n of componentNodes) {
      const children = (adjacency.get(n) || []).filter((c) => componentNodes.has(c));
      if (children.length > 0) localAdj.set(n, children);
    }

    // Detect cycle
    const hasCycle = detectCycle(root, localAdj);

    // Build nested tree object recursively
    const tree = hasCycle ? {} : buildTree(root, localAdj);

    // Calculate depth (only for non-cyclic trees)
    const depth = hasCycle ? undefined : calcDepth(root, localAdj);

    return { root, tree, depth, hasCycle };
  });
}

/**
 * Recursively builds a nested children object for the given node.
 * Returns { child1: { grandchild1: {}, ... }, child2: { ... } }
 * (i.e. the VALUE side of the parent's entry, not including the node key itself)
 * @param {string} node
 * @param {Map<string, string[]>} adjacency
 * @returns {object}
 */
function buildChildren(node, adjacency) {
  const children = adjacency.get(node) || [];
  const result = {};
  for (const child of children) {
    result[child] = buildChildren(child, adjacency);
  }
  return result;
}

/**
 * Builds the full nested tree object rooted at `node`.
 * Returns { node: { child1: { ... }, child2: { ... } } }
 * @param {string} node
 * @param {Map<string, string[]>} adjacency
 * @returns {object}
 */
function buildTree(node, adjacency) {
  return { [node]: buildChildren(node, adjacency) };
}

/**
 * Calculates the depth of a tree (number of nodes on the longest root-to-leaf path).
 * Root itself counts as 1.
 * @param {string} node
 * @param {Map<string, string[]>} adjacency
 * @returns {number}
 */
function calcDepth(node, adjacency) {
  const children = adjacency.get(node) || [];
  if (children.length === 0) return 1;
  return 1 + Math.max(...children.map((c) => calcDepth(c, adjacency)));
}

module.exports = { buildComponents };
