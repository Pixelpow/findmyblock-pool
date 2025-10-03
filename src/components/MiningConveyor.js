import React, { useEffect, useRef } from 'react';

export default function MiningConveyor({ opacity = 0.06, speed = 18, color = '255,216,120' }) {
  const ref = useRef(null);

  useEffect(() => {
    // Inject styles once
    if (typeof document === 'undefined') return;
    if (document.getElementById('mining-conveyor-styles')) return;
    const style = document.createElement('style');
    style.id = 'mining-conveyor-styles';
    style.innerHTML = `
      .mining-conveyor { position: absolute; inset: 0; pointer-events: none; mix-blend-mode: screen; z-index: 0; }
      .mining-conveyor .strip { position: absolute; inset: 0; background-image: repeating-linear-gradient(135deg, rgba(${color}, ${opacity}) 0 2px, rgba(120,145,160,0.02) 2px 8px); background-size: 200% 200%; opacity: 0.9; }
      @keyframes conveyor-move { from { background-position: 0 0; } to { background-position: -200% 200%; } }
      .mining-conveyor .strip.play { animation: conveyor-move ${speed}s linear infinite; }
      @media (prefers-reduced-motion: reduce) { .mining-conveyor .strip.play { animation: none !important; } }
    `;
    document.head.appendChild(style);

    const el = ref.current;
    if (!el) return;
    // pause/resume using IntersectionObserver
    const obs = new IntersectionObserver(entries => {
      for (const e of entries) {
        const strip = el.querySelector('.strip');
        if (!strip) continue;
        if (e.isIntersecting) strip.classList.add('play'); else strip.classList.remove('play');
      }
    }, { threshold: 0.01 });
    obs.observe(el);

    return () => obs.disconnect();
  }, [opacity, speed, color]);

  return (
    <div ref={ref} className="mining-conveyor" aria-hidden="true">
      <div className="strip" />
    </div>
  );
}
