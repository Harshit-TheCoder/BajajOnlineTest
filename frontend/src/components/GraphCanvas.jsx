import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

// ── Layout: arrange nodes in a circle (or sphere for many nodes) ──────────────
function computeLayout(nodes) {
  const positions = {};
  const n = nodes.length;
  if (n === 0) return positions;

  if (n <= 12) {
    // Circle layout
    nodes.forEach((node, i) => {
      const angle = (i / n) * Math.PI * 2;
      const r = Math.max(2.5, n * 0.45);
      positions[node] = [Math.cos(angle) * r, Math.sin(angle) * r, 0];
    });
  } else {
    // Fibonacci sphere layout for many nodes
    const phi = Math.PI * (3 - Math.sqrt(5));
    nodes.forEach((node, i) => {
      const y = 1 - (i / (n - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const r = Math.max(4, n * 0.3);
      positions[node] = [
        Math.cos(theta) * radius * r,
        y * r,
        Math.sin(theta) * radius * r,
      ];
    });
  }
  return positions;
}

// ── Animated node sphere ──────────────────────────────────────────────────────
function NodeSphere({ position, label, isRoot, hasCycle, isHovered, onHover }) {
  const meshRef = useRef();
  const color = hasCycle ? '#f59e0b' : isRoot ? '#818cf8' : '#38bdf8';
  const emissive = hasCycle ? '#7c3a00' : isRoot ? '#3730a3' : '#0c4a6e';

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.008;
      if (isHovered) {
        meshRef.current.scale.setScalar(
          1.3 + Math.sin(state.clock.elapsedTime * 4) * 0.08
        );
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => onHover(label)}
        onPointerOut={() => onHover(null)}
        castShadow
      >
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={isHovered ? 1.2 : 0.4}
          roughness={0.2}
          metalness={0.7}
        />
      </mesh>

      {/* Glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.45, 0.04, 8, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, 0.65, 0]}
        fontSize={0.38}
        color="#e2e8f0"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04}
        outlineColor="#000"
        font={undefined}
      >
        {label}
      </Text>

      {/* Tooltip on hover */}
      {isHovered && (
        <Html distanceFactor={6} center>
          <div style={{
            background: 'rgba(10,12,30,0.92)',
            border: '1px solid rgba(99,102,241,0.5)',
            borderRadius: 8,
            padding: '4px 10px',
            color: '#e2e8f0',
            fontSize: 12,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            {isRoot ? '👑 Root' : hasCycle ? '⟳ Cycle' : '◉ Node'}: <b>{label}</b>
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Animated directed edge ────────────────────────────────────────────────────
function Edge({ start, end, color = '#6366f1' }) {
  const ref = useRef();

  // Midpoint for slight arc
  const mid = useMemo(() => {
    const mx = (start[0] + end[0]) / 2;
    const my = (start[1] + end[1]) / 2 + 0.4;
    const mz = (start[2] + end[2]) / 2;
    return [mx, my, mz];
  }, [start, end]);

  const points = useMemo(
    () => [new THREE.Vector3(...start), new THREE.Vector3(...mid), new THREE.Vector3(...end)],
    [start, mid, end]
  );

  useFrame((state) => {
    if (ref.current) {
      ref.current.material.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
    }
  });

  return (
    <Line
      ref={ref}
      points={points}
      color={color}
      lineWidth={1.5}
      transparent
      opacity={0.55}
    />
  );
}

// ── Floating distance label ───────────────────────────────────────────────────
function DistanceLabel({ start, end, dist }) {
  const mid = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2 + 0.6,
    (start[2] + end[2]) / 2,
  ];
  return (
    <Text
      position={mid}
      fontSize={0.22}
      color="#94a3b8"
      anchorX="center"
      anchorY="middle"
    >
      {dist}
    </Text>
  );
}

// ── Rotating ambient particles ────────────────────────────────────────────────
function AmbientParticles() {
  const ref = useRef();
  const count = 120;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.04;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#6366f1" transparent opacity={0.5} />
    </points>
  );
}

// ── Main 3D Graph Scene ───────────────────────────────────────────────────────
function GraphScene({ nodes, edges, distances, roots, cycleNodes }) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const positions = useMemo(() => computeLayout(nodes), [nodes]);

  const rootSet = new Set(roots);
  const cycleSet = new Set(cycleNodes);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.2} color="#818cf8" />
      <pointLight position={[-10, -10, -5]} intensity={0.6} color="#38bdf8" />
      <spotLight position={[0, 15, 0]} intensity={0.8} angle={0.4} penumbra={0.5} />

      <AmbientParticles />

      {/* Edges */}
      {edges.map((edge, i) => {
        const s = positions[edge.source];
        const t = positions[edge.target];
        if (!s || !t) return null;
        const isCycleEdge = cycleSet.has(edge.source) && cycleSet.has(edge.target);
        return (
          <Edge
            key={i}
            start={s}
            end={t}
            color={isCycleEdge ? '#f59e0b' : '#6366f1'}
          />
        );
      })}

      {/* Distance labels for hovered node */}
      {hoveredNode &&
        nodes.map((target) => {
          if (target === hoveredNode) return null;
          const d = distances?.[hoveredNode]?.[target];
          if (d === null || d === undefined) return null;
          const s = positions[hoveredNode];
          const t = positions[target];
          if (!s || !t) return null;
          return (
            <DistanceLabel key={target} start={s} end={t} dist={`d=${d}`} />
          );
        })}

      {/* Nodes */}
      {nodes.map((node) => {
        const pos = positions[node];
        if (!pos) return null;
        return (
          <NodeSphere
            key={node}
            position={pos}
            label={node}
            isRoot={rootSet.has(node)}
            hasCycle={cycleSet.has(node)}
            isHovered={hoveredNode === node}
            onHover={setHoveredNode}
          />
        );
      })}

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        autoRotate={true}
        autoRotateSpeed={0.6}
        minDistance={3}
        maxDistance={30}
      />
    </>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
export default function GraphCanvas({ graph, hierarchies }) {
  const { nodes = [], edges = [], distances = {} } = graph || {};

  const roots = useMemo(
    () => (hierarchies || []).filter((h) => !h.has_cycle).map((h) => h.root),
    [hierarchies]
  );

  const cycleNodes = useMemo(() => {
    const set = new Set();
    (hierarchies || [])
      .filter((h) => h.has_cycle)
      .forEach((h) => {
        // Mark all nodes in cycle edges
        edges.forEach(({ source, target }) => {
          // crude: if root is cycle root, mark connected nodes
          if (source === h.root || target === h.root) {
            set.add(source);
            set.add(target);
          }
        });
        set.add(h.root);
      });
    return [...set];
  }, [hierarchies, edges]);

  if (nodes.length === 0) return null;

  return (
    <div className="graph-canvas-wrapper">
      <p className="section-title" style={{ marginBottom: '0.5rem' }}>
        🔮 3D Graph — {nodes.length} nodes · {edges.length} edges
        <span className="graph-hint"> (drag to rotate · scroll to zoom · hover node for distances)</span>
      </p>
      <div className="graph-canvas">
        <Canvas
          camera={{ position: [0, 0, 12], fov: 55 }}
          shadows
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <GraphScene
            nodes={nodes}
            edges={edges}
            distances={distances}
            roots={roots}
            cycleNodes={cycleNodes}
          />
        </Canvas>
      </div>

      {/* Distance matrix table */}
      {nodes.length > 0 && nodes.length <= 12 && (
        <div className="dist-matrix-wrapper">
          <p className="section-title" style={{ marginBottom: '0.5rem' }}>
            Floyd-Warshall Distance Matrix
          </p>
          <div className="dist-matrix-scroll">
            <table className="dist-matrix">
              <thead>
                <tr>
                  <th></th>
                  {nodes.map((n) => <th key={n}>{n}</th>)}
                </tr>
              </thead>
              <tbody>
                {nodes.map((from) => (
                  <tr key={from}>
                    <th>{from}</th>
                    {nodes.map((to) => {
                      const d = distances?.[from]?.[to];
                      const isZero = d === 0;
                      const isInf = d === null;
                      return (
                        <td
                          key={to}
                          className={isZero ? 'cell-zero' : isInf ? 'cell-inf' : 'cell-dist'}
                          title={`${from} → ${to}: ${isInf ? '∞' : d}`}
                        >
                          {isZero ? '0' : isInf ? '∞' : d}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
