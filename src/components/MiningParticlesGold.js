import React, { useRef, useEffect } from 'react';

// Deep blue particle stream with rare gold sparks
export default function MiningParticlesGold({ density = 0.0018, goldFrequency = 0.025, opacity = 0.12 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.clientWidth || 800;
    let h = canvas.clientHeight || 480;
    const DPR = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(w * DPR));
    canvas.height = Math.max(1, Math.floor(h * DPR));
    ctx.scale(DPR, DPR);

    // Respect reduced motion
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // create particle pool based on area
    const targetCount = Math.max(8, Math.floor(w * h * density));
    const particles = [];

    function rand(min, max) { return min + Math.random() * (max - min); }

    function createParticle(isGold = false) {
      return {
        x: Math.random() * w,
        y: h + Math.random() * 60,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.2 - Math.random() * 0.6,
        r: isGold ? rand(0.9, 2.2) : rand(0.6, 1.6),
        life: 60 + Math.random() * 320,
        alpha: isGold ? rand(0.6, 0.95) : rand(0.06, 0.22),
        gold: isGold
      };
    }

    for (let i = 0; i < targetCount; i++) particles.push(createParticle(Math.random() < goldFrequency * 0.5));

    function resize() {
      w = canvas.clientWidth || 800;
      h = canvas.clientHeight || 480;
      canvas.width = Math.max(1, Math.floor(w * DPR));
      canvas.height = Math.max(1, Math.floor(h * DPR));
      ctx.scale(DPR, DPR);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function draw() {
      if (pausedRef.current) { rafRef.current = requestAnimationFrame(draw); return; }
  // clear with deep blue backdrop subtle (slightly reduced alpha)
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = `rgba(6,12,28,${opacity * 0.9})`;
  ctx.fillRect(0, 0, w, h);

      // update & draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;

        // gentle horizontal sway for blue particles
        if (!p.gold) p.x += Math.sin((p.life + i) * 0.01) * 0.12;

        if (p.gold) {
          // gold spark: radial gradient
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 8);
          g.addColorStop(0, `rgba(255,230,150,${Math.min(1, p.alpha)})`);
          g.addColorStop(0.25, `rgba(255,200,90,${Math.min(0.36, p.alpha * 0.5)})`);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
        } else {
          // blue particle: soft circle (crisper alpha)
          const blue = `rgba(120,170,240,${Math.max(0.12, p.alpha * 0.85)})`;
          ctx.fillStyle = blue;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        if (p.life <= 0 || p.y < -40 || p.x < -40 || p.x > w + 40) {
          // recycle occasionally as gold with low probability
          particles[i] = createParticle(Math.random() < goldFrequency);
        }
      }

      // occasionally spawn a solitary gold spark
      if (Math.random() < goldFrequency * 0.01) particles.push(createParticle(true));

      rafRef.current = requestAnimationFrame(draw);
    }

    // Pause when not visible
    const io = new IntersectionObserver(entries => {
      for (const e of entries) pausedRef.current = !e.isIntersecting;
      if (!pausedRef.current && !rafRef.current) rafRef.current = requestAnimationFrame(draw);
    });
    io.observe(canvas);

    if (!reduce) rafRef.current = requestAnimationFrame(draw);

    return () => {
      ro.disconnect();
      io.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [density, goldFrequency, opacity]);

  return (
    <div className="absolute inset-0 pointer-events-none -z-10" style={{ zIndex: 0 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}
