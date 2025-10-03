import React, { useRef, useEffect } from 'react';

// Premium subtle gilded mesh background: SVG mesh with soft gold strokes and a moving sheen
export default function MiningGildedMesh({ rows = 8, cols = 18, stroke = 'rgba(255,215,120,0.08)', highlight = 'rgba(255,236,150,0.14)', sheenColor = '255,220,120' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    // inject minimal CSS for animation (idempotent)
    if (document.getElementById('gilded-mesh-styles')) return;
    const style = document.createElement('style');
    style.id = 'gilded-mesh-styles';
      style.innerHTML = `
        .gilded-mesh { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .gilded-mesh svg { width: 100%; height: 100%; opacity: 0.42; filter: drop-shadow(0 0 6px rgba(255,200,120,0.08)); }
        .gilded-mesh .veil { position: absolute; inset: 0; background: radial-gradient(ellipse at center, rgba(10,20,40,0.06), rgba(2,6,20,0.5)); mix-blend-mode: multiply; }
      `;
    document.head.appendChild(style);
    return () => { /* keep styles for lifecycle simplicity */ };
  }, []);

  // Build a lightweight lattice of lines in SVG coordinates
  const viewW = 1600;
  const viewH = 900;
  const cx = viewW / cols;
  const cy = viewH / rows;

  const lines = [];
  // horizontal-ish lines
  for (let r = 0; r <= rows; r++) {
    const y = Math.round(r * cy + (r % 2 ? cy * 0.12 : -cy * 0.08));
    lines.push({ x1: 0, y1: y, x2: viewW, y2: y, opacity: 0.06 + (r % 3 === 0 ? 0.02 : 0) });
  }
  // diagonal mesh
  for (let c = -1; c <= cols + 1; c++) {
    const x = Math.round(c * cx * 0.86);
    lines.push({ x1: x, y1: 0, x2: x + viewW * 0.18, y2: viewH, opacity: 0.04 });
  }

  return (
    <div ref={ref} className="gilded-mesh absolute inset-0 pointer-events-none" aria-hidden="true">
      <svg viewBox={`0 0 ${viewW} ${viewH}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="gildedSheen" x1="0" x2="1">
            <stop offset="0%" stopColor={`rgba(${sheenColor},0)`} />
            <stop offset="48%" stopColor={`rgba(${sheenColor},0.28)`} />
            <stop offset="52%" stopColor={`rgba(${sheenColor},0.36)`} />
            <stop offset="100%" stopColor={`rgba(${sheenColor},0)`} />
          </linearGradient>
          <mask id="meshMask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
          </mask>
        </defs>

        <g opacity="0.92">
          {lines.map((l, i) => (
            <line key={`ln-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke={stroke} strokeWidth={i % 7 === 0 ? 0.9 : 0.6} strokeLinecap="round" opacity={l.opacity} />
          ))}
        </g>

        {/* soft highlights: a few gentle arcs with gold tint */}
        <g opacity="0.85">
          <path d={`M ${viewW * 0.02} ${viewH * 0.12} Q ${viewW * 0.4} ${viewH * 0.06}, ${viewW * 0.9} ${viewH * 0.18}`}
            fill="none" stroke={highlight} strokeWidth="1.4" strokeLinecap="round" opacity="0.42" />
          <path d={`M ${viewW * 0.05} ${viewH * 0.72} Q ${viewW * 0.5} ${viewH * 0.86}, ${viewW * 0.95} ${viewH * 0.68}`}
            fill="none" stroke={highlight} strokeWidth="1.2" strokeLinecap="round" opacity="0.36" />
        </g>

        {/* moving sheen overlay */}
        <g className="gilded-sheen" style={{ transform: 'translateX(-20%)' }}>
          <rect x="-40%" y="0" width="180%" height="100%" fill="url(#gildedSheen)" mask="url(#meshMask)" />
        </g>
      </svg>
    </div>
  );
}
