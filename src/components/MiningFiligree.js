import React, { useEffect } from 'react';

export default function MiningFiligree({ intensity = 0.08, sheenColor = '255,220,120' }) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('mining-filigree-styles')) return;
    const style = document.createElement('style');
    style.id = 'mining-filigree-styles';
    style.innerHTML = `
      .mining-filigree { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
      .mining-filigree .pattern { width:100%; height:100%; background-image: radial-gradient(rgba(255,235,190,0.02) 0.6px, transparent 0.6px), repeating-linear-gradient(45deg, rgba(255,215,120,${intensity}) 0px, rgba(255,215,120,${intensity}) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 28px);
        background-position: 0 0, 0 0; background-size: 28px 28px, 56px 56px; mix-blend-mode: screen; opacity: 0.06; }
      .mining-filigree .sheen { position: absolute; inset: -30%  -40%; transform: rotate(-18deg); background: linear-gradient(90deg, rgba(${sheenColor},0) 0%, rgba(${sheenColor},0.12) 48%, rgba(${sheenColor},0.18) 52%, rgba(${sheenColor},0) 100%); width: 180%; height: 160%; filter: blur(8px); mix-blend-mode: screen; opacity: 0.18; animation: filigree-sheen 9s linear infinite; }
      @keyframes filigree-sheen { 0% { transform: translateX(-40%) rotate(-18deg); } 100% { transform: translateX(140%) rotate(-18deg); } }
      @media (prefers-reduced-motion: reduce) { .mining-filigree .sheen { animation: none; } }
      .mining-filigree .sparkles { position:absolute; inset:0; pointer-events:none; }
      .mining-filigree .sparkles svg { width:100%; height:100%; }
    `;
    document.head.appendChild(style);
    return () => { /* keep styles for page lifecycle */ };
  }, [intensity, sheenColor]);

  // lightweight SVG of scatter sparkles (opacity very low)
  const sparkles = (
    <svg preserveAspectRatio="none" viewBox="0 0 100 100" className="pointer-events-none" aria-hidden>
      <g fillOpacity="0.0" strokeOpacity="0.08" strokeWidth="0.2" stroke={`rgba(255,240,200,0.12)`}>
        <circle cx="12" cy="18" r="0.6" fill={`rgba(255,236,150,0.06)`} />
        <circle cx="28" cy="34" r="0.5" fill={`rgba(255,236,150,0.05)`} />
        <circle cx="68" cy="12" r="0.7" fill={`rgba(255,236,150,0.07)`} />
        <circle cx="84" cy="46" r="0.45" fill={`rgba(255,236,150,0.04)`} />
        <circle cx="44" cy="72" r="0.6" fill={`rgba(255,236,150,0.05)`} />
        <circle cx="76" cy="82" r="0.5" fill={`rgba(255,236,150,0.04)`} />
      </g>
    </svg>
  );

  return (
    <div className="mining-filigree absolute inset-0 pointer-events-none -z-10" aria-hidden>
      <div className="pattern" />
      <div className="sheen" />
      <div className="sparkles">{sparkles}</div>
    </div>
  );
}
