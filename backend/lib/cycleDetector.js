'use strict';

/**
 * Cycle_Detector — detects directed cycles in a graph component.
 *
 * Uses iterative DFS with a recursion stack to find back-edges.
 *
 * @param {string} root - The root node to start DFS from.
 * @param {Map<string, string[]>} adjacency - Adjacency list (parent → children[]).
 * @returns {boolean} true if a directed cycle is reachable from root.
 */
function detectCycle(root, adjacency) {
  // visited: nodes fully processed
  const visited = new Set();
  // recursionStack: nodes on the current DFS path
  const recursionStack = new Set();

  // Iterative DFS using an explicit stack.
  // Each stack frame: { node, childIndex } so we can resume after visiting children.
  const stack = [{ node: root, childIndex: 0 }];
  recursionStack.add(root);

  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    const { node } = frame;
    const children = adjacency.get(node) || [];

    if (frame.childIndex < children.length) {
      const child = children[frame.childIndex];
      frame.childIndex += 1;

      if (recursionStack.has(child)) {
        // Back-edge found — cycle detected
        return true;
      }

      if (!visited.has(child)) {
        recursionStack.add(child);
        stack.push({ node: child, childIndex: 0 });
      }
    } else {
      // All children processed — pop frame
      visited.add(node);
      recursionStack.delete(node);
      stack.pop();
    }
  }

  return false;
}

module.exports = { detectCycle };
