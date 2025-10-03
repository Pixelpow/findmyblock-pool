import React, { useRef, useEffect } from 'react';

// Subtle parallax background: a few layered SVG/CSS elements that move slightly with mouse/scroll
export default function MiningParallax({ depth = 3, intensity = 0.06, color = '255,215,120' }) {
  const rootRef = useRef(null);
  const rafRef = useRef(null);
  const stateRef = useRef({ mx: 0, my: 0, tx: 0, ty: 0, scrollY: 0 });

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    // Respect reduced motion
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function onMove(e) {
      const rect = el.getBoundingClientRect();
      const mx = ((e.clientX - (rect.left + rect.width / 2)) / rect.width) || 0;
      const my = ((e.clientY - (rect.top + rect.height / 2)) / rect.height) || 0;
      stateRef.current.mx = Math.max(-1, Math.min(1, mx));
      stateRef.current.my = Math.max(-1, Math.min(1, my));
    }

    function onScroll() {
      stateRef.current.scrollY = window.scrollY || window.pageYOffset || 0;
    }

    if (!reduce) window.addEventListener('mousemove', onMove);
    window.addEventListener('scroll', onScroll, { passive: true });

    function tick() {
      const s = stateRef.current;
      // interpolate
      s.tx += (s.mx - s.tx) * 0.08;
      s.ty += (s.my - s.ty) * 0.08;

      // apply transforms per layer
      const layers = el.querySelectorAll('[data-parallax-layer]');
      layers.forEach((lnode, i) => {
        const depthFactor = (i + 1) / (layers.length + 1);
        const tx = -s.tx * depthFactor * 12 * intensity;
        const ty = -s.ty * depthFactor * 8 * intensity + (s.scrollY * depthFactor * 0.002);
        lnode.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (!reduce) window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [intensity]);

  // Layers: a dark base, thin diagonal lines, neutral subtle streaks (no yellow glow)
  return (
    <div ref={rootRef} className="absolute inset-0 pointer-events-none -z-10" aria-hidden style={{ zIndex: 0 }}>
      <div data-parallax-layer style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 10% 10%, rgba(255,240,200,0.02), rgba(12,14,20,0.06))' }} />
      <div data-parallax-layer style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(135deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 1px, transparent 1px, transparent 28px)`, opacity: 0.35 }} />
        <div data-parallax-layer style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(90deg, rgba(20,22,28,0) 0%, rgba(180,180,190,0.03) 45%, rgba(180,180,190,0.04) 50%, rgba(180,180,190,0.02) 60%, rgba(20,22,28,0) 100%)`, filter: 'blur(4px)', opacity: 0.42 }} />
      {/* subtle vignette */}
      <div data-parallax-layer style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 60px 120px rgba(0,0,0,0.45)', borderRadius: '0', pointerEvents: 'none' }} />
    </div>
  );
}
