'use strict';

/**
 * Response_Formatter — assembles the final API response object.
 *
 * @param {Array<{root:string, tree:object, depth:number|undefined, hasCycle:boolean}>} components
 * @param {string[]} invalidEntries
 * @param {string[]} duplicateEdges
 * @param {{ userId:string, emailId:string, rollNumber:string }} identity
 * @returns {object} Complete ApiResponse
 */
function formatResponse(components, invalidEntries, duplicateEdges, identity) {
  const hierarchies = components.map((comp) => {
    if (comp.hasCycle) {
      // Cyclic: has_cycle: true, tree: {}, no depth
      return {
        root: comp.root,
        tree: {},
        has_cycle: true,
      };
    } else {
      // Acyclic: depth present, no has_cycle
      return {
        root: comp.root,
        tree: comp.tree,
        depth: comp.depth,
      };
    }
  });

  // Summary
  const acyclicTrees = hierarchies.filter((h) => !h.has_cycle);
  const cyclicGroups = hierarchies.filter((h) => h.has_cycle);

  const total_trees = acyclicTrees.length;
  const total_cycles = cyclicGroups.length;

  let largest_tree_root = '';
  if (acyclicTrees.length > 0) {
    // Find max depth
    const maxDepth = Math.max(...acyclicTrees.map((h) => h.depth));
    // Among trees with max depth, pick lexicographically smallest root
    const tied = acyclicTrees
      .filter((h) => h.depth === maxDepth)
      .map((h) => h.root)
      .sort();
    largest_tree_root = tied[0];
  }

  return {
    user_id: identity.userId,
    email_id: identity.emailId,
    college_roll_number: identity.rollNumber,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root,
    },
  };
}

module.exports = { formatResponse };
