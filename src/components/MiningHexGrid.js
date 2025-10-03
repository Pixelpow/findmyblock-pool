import React, { useRef, useEffect, useState } from 'react';

// Simple hex grid SVG background with occasional glints
export default function MiningHexGrid({ hexRadius = 14, accentChance = 0.02, glintInterval = 1200, goldColor = '255,216,120', blueTone = '80,110,160', neutral = '40,52,68', glintOpacity = 0.88 }) {
  const ref = useRef(null);
  const [hexes, setHexes] = useState([]);
  const [glints, setGlints] = useState(new Set());
  const reduceMotion = (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const el = ref.current;
    if (!el) return;

    function computeGrid() {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const r = Math.max(8, hexRadius);
      const hexH = Math.sqrt(3) * r;
      const horiz = 1.5 * r;
      const vert = hexH;
      const cols = Math.ceil(w / horiz) + 2;
      const rows = Math.ceil(h / (vert)) + 2;
      const arr = [];
      let id = 0;
      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const x = col * horiz + ((row % 2) * horiz) / 2 + (r * 1.2);
          const y = row * (vert * 0.85) + (r * 1.2);
          arr.push({ id: id++, x, y, r });
        }
      }
      setHexes(arr);
    }

    computeGrid();
    const ro = new ResizeObserver(computeGrid);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hexRadius]);

  useEffect(() => {
    if (!hexes || !hexes.length) return;
    let mounted = true;
    const reduceMotion = (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const t = setInterval(() => {
      if (!mounted) return;
      // pick 1-2 hexes to glint
      const pickCount = Math.random() < 0.25 ? 2 : 1;
      const picks = new Set();
      for (let i = 0; i < pickCount; i++) {
        const idx = Math.floor(Math.random() * hexes.length);
        picks.add(hexes[idx].id);
      }
      setGlints(prev => {
        const next = new Set(prev);
        for (const p of picks) next.add(p);
        return next;
      });
      // clear after a short time, unless reduced-motion is preferred
  const clearDelay = reduceMotion ? Math.max(1000, glintInterval) : glintInterval;
      setTimeout(() => {
        setGlints(prev => {
          const next = new Set(prev);
          for (const p of picks) next.delete(p);
          return next;
        });
      }, clearDelay);
    }, Math.max(450, Math.floor(glintInterval * 0.6)));

    return () => { clearInterval(t); };
  }, [hexes, glintInterval]);

  const polygonPoints = (cx, cy, r) => {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 180 * (60 * i - 30);
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      pts.push(`${x},${y}`);
    }
    return pts.join(' ');
  };

  return (
    <div ref={ref} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${ref.current?.clientWidth || 800} ${ref.current?.clientHeight || 600}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
            <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
        </defs>
        {hexes.map(h => {
          const isGlint = glints.has(h.id);
          // keep per-render deterministic-ish by using id-derived pseudo-random
          const seed = (h.id * 9301 + 49297) % 233280;
          const rnd = (seed % 1000) / 1000;
          const accent = rnd < accentChance;
          const fill = isGlint ? `rgba(${goldColor}, ${glintOpacity})` : (accent ? `rgba(${goldColor}, ${0.045})` : `rgba(${blueTone}, ${0.035})`);
          const stroke = isGlint ? `rgba(${goldColor}, 0.18)` : `rgba(255,255,255,0.02)`;
          return (
            <polygon
              key={h.id}
              points={polygonPoints(h.x, h.y, h.r)}
              fill={fill}
              stroke={stroke}
              strokeWidth={isGlint ? 0.9 : 0.4}
              style={{ transition: reduceMotion ? 'none' : 'fill 260ms ease, stroke 260ms ease, opacity 260ms ease' }}
              filter={isGlint && !reduceMotion ? 'url(#softGlow)' : undefined}
            />
          );
        })}
      </svg>
    </div>
  );
}
