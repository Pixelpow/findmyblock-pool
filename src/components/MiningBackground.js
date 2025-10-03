import React, { useRef, useEffect } from 'react';

/**
 * Discrete mining background: lightweight canvas particle stream.
 * Props:
 *  - density (number) : relative particle count (default 0.6)
 *  - speed (number) : global speed multiplier (default 1)
 *  - accentChance (0..1) : chance for a particle to be accent (gold) (default 0.02)
 */
export default function MiningBackground({ density = 0.6, speed = 1, accentChance = 0.02 }) {
  const ref = useRef(null);
  const rafRef = useRef(null);
  const lastTsRef = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0;
    let particles = [];

    function resize() {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    }

    function initParticles() {
      const area = w * h;
      const base = Math.max(40, Math.floor((area / 12000) * density));
      particles = new Array(base).fill(0).map(() => makeParticle(true));
    }

    function makeParticle(init=false) {
      const size = (Math.random() * 6 + 4) * (Math.random() < 0.2 ? 1.6 : 1);
      const x = Math.random() * w;
      const y = init ? Math.random() * h : (h + size + Math.random() * 40);
      const vy = (0.15 + Math.random() * 0.6) * speed * (Math.random() < 0.08 ? 2.6 : 1);
      const alpha = 0.06 + Math.random() * 0.18;
      const accent = Math.random() < accentChance;
      return { x, y, vy, size, alpha, accent, ttl: 0 };
    }

    function draw(ts) {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min(60, ts - lastTsRef.current);
      lastTsRef.current = ts;

      ctx.clearRect(0, 0, w, h);
      for (let p of particles) {
        p.y -= p.vy * (dt / 16.67);
        p.x += Math.sin((p.y + p.ttl) * 0.002) * 0.2;
        if (p.y + p.size < -20 || p.x < -40 || p.x > w + 40) {
          const idx = particles.indexOf(p);
          if (idx >= 0) particles[idx] = makeParticle(false);
          continue;
        }
        ctx.beginPath();
        if (p.accent) {
          ctx.fillStyle = `rgba(255,216,120,${0.7 * p.alpha})`;
          ctx.shadowColor = 'rgba(255,216,120,0.08)';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = `rgba(120,145,160,${p.alpha})`;
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }
        const wrect = p.size * (0.9 + Math.random() * 0.35);
        const hrect = p.size * (0.5 + Math.random() * 0.75);
        const rx = Math.min(3, wrect * 0.2);
        const x = p.x - wrect / 2;
        const y = p.y - hrect / 2;
        roundRect(ctx, x, y, wrect, hrect, rx);
        ctx.fill();
        ctx.shadowBlur = 0;
        p.ttl += dt;
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    function roundRect(ctx, x, y, wrect, hrect, r) {
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + wrect, y, x + wrect, y + hrect, r);
      ctx.arcTo(x + wrect, y + hrect, x, y + hrect, r);
      ctx.arcTo(x, y + hrect, x, y, r);
      ctx.arcTo(x, y, x + wrect, y, r);
      ctx.closePath();
    }

    function start() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    }

    function stop() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const obs = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) start();
        else stop();
      }
    }, { threshold: 0.01 });
    obs.observe(canvas);

    window.addEventListener('resize', resize, { passive: true });
    resize();

    return () => {
      stop();
      obs.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [density, speed, accentChance]);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-70 mix-blend-screen"
      aria-hidden="true"
      style={{ zIndex: 0 }}
    />
  );
}
