import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

import LoginModal from './components/LoginModal';
import InputPanel from './components/InputPanel';
import HierarchyCard from './components/HierarchyCard';
import SummaryPanel from './components/SummaryPanel';
import GraphCanvas from './components/GraphCanvas';

// ── tsParticles ───────────────────────────────────────────────────────────────
function ParticleBackground() {
  const init = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={init}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      options={{
        background: { color: { value: 'transparent' } },
        fpsLimit: 60,
        interactivity: {
          events: { onHover: { enable: true, mode: 'repulse' }, resize: true },
          modes: { repulse: { distance: 90, duration: 0.4 } },
        },
        particles: {
          color: { value: ['#6366f1', '#a78bfa', '#818cf8', '#38bdf8'] },
          links: { color: '#6366f1', distance: 130, enable: true, opacity: 0.15, width: 1 },
          move: { enable: true, speed: 0.7, outModes: { default: 'bounce' }, random: true },
          number: { density: { enable: true, area: 900 }, value: 65 },
          opacity: { value: { min: 0.15, max: 0.55 } },
          shape: { type: 'circle' },
          size: { value: { min: 1, max: 2.5 } },
        },
        detectRetina: true,
      }}
    />
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);   // { token, name, username }
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);

  const handleLogin = (data) => {
    setSession(data);
    localStorage.setItem('bfhl_token', data.token);
    localStorage.setItem('bfhl_name', data.name);
  };

  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.token}` },
      });
    } catch (_) { /* ignore */ }
    setSession(null);
    setResult(null);
    setError(null);
    localStorage.removeItem('bfhl_token');
    localStorage.removeItem('bfhl_name');
  };

  // Restore session from localStorage on first render
  React.useEffect(() => {
    const token = localStorage.getItem('bfhl_token');
    const name  = localStorage.getItem('bfhl_name');
    if (token && name) setSession({ token, name });
  }, []);

  return (
    <>
      <ParticleBackground />

      {/* Login gate */}
      <AnimatePresence>
        {!session && <LoginModal onLogin={handleLogin} />}
      </AnimatePresence>

      {session && (
        <div className="app">
          {/* ── Header ── */}
          <motion.header
            className="app-header"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <motion.div
              className="header-glow"
              animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.75, 0.4] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <h1 className="gradient-title">Node Hierarchy Explorer</h1>
            <p className="header-sub">SRM BFHL Full Stack Engineering Challenge</p>

            {/* User pill */}
            <div className="user-pill">
              <span className="user-avatar">{session.name?.[0]?.toUpperCase() || '?'}</span>
              <span className="user-name">{session.name}</span>
              <motion.button
                className="btn-logout"
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign out
              </motion.button>
            </div>
          </motion.header>

          <main>
            <InputPanel onResult={setResult} onError={setError} token={session?.token} />

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="error-banner"
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <span>⚠</span><span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence>
              {result && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Summary */}
                  <SummaryPanel summary={result.summary} />

                  {/* 3D Graph */}
                  {result.graph?.nodes?.length > 0 && (
                    <motion.div
                      className="glass-card"
                      style={{ marginBottom: '1.5rem', padding: '1.2rem' }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <GraphCanvas
                        graph={result.graph}
                        hierarchies={result.hierarchies}
                      />
                    </motion.div>
                  )}

                  {/* Hierarchy cards */}
                  {result.hierarchies.length > 0 && (
                    <section className="hierarchies-section">
                      <motion.p className="section-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                        Hierarchies ({result.hierarchies.length})
                      </motion.p>
                      <div className="hierarchy-grid">
                        {result.hierarchies.map((h, i) => (
                          <HierarchyCard key={`${h.root}-${i}`} hierarchy={h} index={i} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Invalid + Duplicate */}
                  <div className="tags-row-outer">
                    <motion.section className="glass-card tags-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                      <p className="section-title">✗ Invalid Entries ({result.invalid_entries.length})</p>
                      <div className="tags-row">
                        {result.invalid_entries.length === 0 ? (
                          <span className="tag-empty">None</span>
                        ) : result.invalid_entries.map((e, i) => (
                          <motion.span key={i} className="tag tag-invalid" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                            {e === '' ? '(empty)' : e}
                          </motion.span>
                        ))}
                      </div>
                    </motion.section>

                    <motion.section className="glass-card tags-section" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                      <p className="section-title">⊕ Duplicate Edges ({result.duplicate_edges.length})</p>
                      <div className="tags-row">
                        {result.duplicate_edges.length === 0 ? (
                          <span className="tag-empty">None</span>
                        ) : result.duplicate_edges.map((e, i) => (
                          <motion.span key={i} className="tag tag-duplicate" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                            {e}
                          </motion.span>
                        ))}
                      </div>
                    </motion.section>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      )}
    </>
  );
}
