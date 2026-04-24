import React, { useState } from 'react';
import { motion } from 'framer-motion';

function TreeNodes({ node, depth = 0 }) {
  const entries = Object.entries(node);
  if (entries.length === 0) return null;

  return (
    <ul className="tree-node" role="tree">
      {entries.map(([key, children], i) => (
        <motion.li
          key={key}
          role="treeitem"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: depth * 0.04 + i * 0.03, duration: 0.25 }}
        >
          <span className={depth === 0 ? 'tree-root-label' : 'tree-node-label'}>
            {key}
          </span>
          {Object.keys(children).length > 0 && (
            <TreeNodes node={children} depth={depth + 1} />
          )}
        </motion.li>
      ))}
    </ul>
  );
}

export default function HierarchyCard({ hierarchy, index = 0 }) {
  const { root, tree, depth, has_cycle } = hierarchy;
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      className="card-3d-wrapper"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
      whileHover={{ y: -5 }}
      onClick={() => setFlipped((f) => !f)}
      title="Click to flip"
    >
      {/* Flip container — CSS-only 3D flip, no framer on the inner element */}
      <div
        className={`flip-inner${flipped ? ' flipped' : ''}`}
        aria-label={`Hierarchy rooted at ${root}`}
      >
        {/* ── Front ── */}
        <div className={`flip-face flip-front hierarchy-card${has_cycle ? ' has-cycle' : ''}`}>
          <div className="card-header">
            <span className="card-root">{root}</span>
            {has_cycle
              ? <span className="badge badge-cycle">⟳ Cycle</span>
              : <span className="badge badge-tree">✦ Tree</span>}
          </div>

          {!has_cycle && depth !== undefined && (
            <p className="card-depth">Depth: <span>{depth}</span></p>
          )}

          <div className="tree-view" aria-label="Tree structure">
            {has_cycle
              ? <span className="cycle-empty">Cyclic — no tree structure</span>
              : <TreeNodes node={tree} />}
          </div>

          <p className="card-flip-hint">Click to flip ↺</p>
        </div>

        {/* ── Back ── */}
        <div className={`flip-face flip-back hierarchy-card${has_cycle ? ' has-cycle' : ''}`}>
          <p className="section-title" style={{ marginBottom: '0.5rem' }}>Raw JSON</p>
          <pre className="card-json">
            {JSON.stringify(hierarchy, null, 2)}
          </pre>
        </div>
      </div>
    </motion.div>
  );
}
