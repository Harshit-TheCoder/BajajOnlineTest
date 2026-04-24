import React from 'react';
import { motion } from 'framer-motion';

const stats = (summary) => [
  { value: summary.total_trees, label: 'Trees', icon: '🌳', color: '#22c55e' },
  { value: summary.total_cycles, label: 'Cycles', icon: '⟳', color: '#f59e0b' },
  {
    value: summary.largest_tree_root || '—',
    label: 'Largest Root',
    icon: '👑',
    color: '#818cf8',
  },
];

export default function SummaryPanel({ summary }) {
  return (
    <motion.section
      className="glass-card summary-panel"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      aria-label="Summary statistics"
    >
      <p className="section-title">Summary</p>
      <div className="summary-grid">
        {stats(summary).map(({ value, label, icon, color }, i) => (
          <motion.div
            key={label}
            className="summary-stat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            whileHover={{ scale: 1.05, y: -3 }}
            style={{ '--stat-color': color }}
          >
            <div className="stat-icon">{icon}</div>
            <div className="stat-value" style={{ color }}>
              {value}
            </div>
            <div className="stat-label">{label}</div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
