import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InputPanel({ onResult, onError, token }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationMsg, setValidationMsg] = useState('');

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed) {
      setValidationMsg('Please enter at least one node string.');
      return;
    }
    setValidationMsg('');

    const data = trimmed
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    setLoading(true);
    onError(null);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/bfhl', {
        method: 'POST',
        headers,
        body: JSON.stringify({ data }),
      });
      const json = await res.json();
      if (!res.ok) {
        onError(json.error || `Server error: ${res.status}`);
        onResult(null);
      } else {
        onResult(json);
      }
    } catch (err) {
      onError(`Network error: ${err.message}`);
      onResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setValidationMsg('');
    onResult(null);
    onError(null);
  };

  return (
    <motion.div
      className="glass-card input-panel"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <label htmlFor="node-input">Node Strings</label>
      <textarea
        id="node-input"
        value={input}
        onChange={(e) => { setInput(e.target.value); if (validationMsg) setValidationMsg(''); }}
        placeholder={'A->B, A->C, B->D\nX->Y, Y->Z, Z->X\nhello, 1->2'}
        disabled={loading}
        aria-label="Enter node strings separated by commas or newlines"
      />
      <p className="input-hint">Separate entries with commas or newlines.</p>

      <AnimatePresence>
        {validationMsg && (
          <motion.p className="validation-msg" role="alert"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            {validationMsg}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="input-actions">
        <motion.button className="btn-submit" onClick={handleSubmit} disabled={loading}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          {loading
            ? <><span className="spinner" aria-hidden="true" /> Processing…</>
            : <><span className="btn-icon">⚡</span> Analyse</>}
        </motion.button>
        <motion.button className="btn-clear" onClick={handleClear} disabled={loading}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          Clear
        </motion.button>
      </div>
    </motion.div>
  );
}
