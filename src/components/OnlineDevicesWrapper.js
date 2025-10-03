import React, { useEffect, useRef } from 'react';
import Original from './OnlineDevices';

export default function OnlineDevicesWrapper(props) {
  const containerRef = useRef(null);

  useEffect(() => {
    let injected = false;
    let attempts = 0;
    const maxAttempts = 20;

    function injectDot() {
      if (injected) return;
      try {
        const root = containerRef.current || document;
          // Avoid duplicate if already present globally
          if (root.querySelector('.pool-challenge-dot')) { injected = true; return; }
          const nodes = Array.from(root.querySelectorAll('*')).filter(n => n.textContent && /(^|\b)bitaxe(\b|$)/i.test(n.textContent));
        if (!nodes.length) return;
        const target = nodes[0];
        if (!target) return;
          // Ensure parent cell exists for positioning
          const parent = target.parentElement || target;
          // Mark if previously injected
          if (parent.querySelector('.pool-challenge-dot')) { injected = true; return; }
          // Reserve space without shifting table layout unpredictably
          if (!parent.style.position || parent.style.position === 'static') parent.style.position = 'relative';
          if (!parent.dataset.challengePadApplied) {
            const currentPr = parseInt(window.getComputedStyle(parent).paddingRight || '0', 10);
            if (currentPr < 18) parent.style.paddingRight = (currentPr + 18) + 'px';
            parent.dataset.challengePadApplied = 'true';
          }
          const dot = document.createElement('span');
          dot.className = 'pool-challenge-dot';
          dot.setAttribute('role','status');
          dot.setAttribute('aria-label','Challenge running');
          dot.title = 'Challenge running';
          parent.appendChild(dot);
          injected = true;
        if (!document.getElementById('pool-challenge-dot-styles')) {
          const style = document.createElement('style');
          style.id = 'pool-challenge-dot-styles';
          style.textContent = `
            .pool-challenge-dot { 
                position:absolute; top:50%; right:4px; transform:translateY(-50%); width:10px; height:10px; border-radius:50%; 
                background:radial-gradient(circle at 35% 35%, #fff, #ffe9a8 45%, #f6b73a 70%, #b37200 100%);
                box-shadow:0 0 0 1px #d7951e,0 0 6px 2px rgba(255,200,80,0.65),0 0 14px 4px rgba(255,170,40,0.35);
                animation:pcd-pulse 1.3s infinite ease-in-out;
                cursor:help;
            }
            .pool-challenge-dot:after { content:''; position:absolute; inset:-4px; border-radius:inherit; background:radial-gradient(circle,#ffc75a33,#ffce6b10,transparent 70%); animation:pcd-glow 2.4s linear infinite; }
            @keyframes pcd-pulse { 0%,100% { transform:scale(.85); filter:brightness(1); } 50% { transform:scale(1.25); filter:brightness(1.25); } }
            @keyframes pcd-glow { 0% { opacity:.55; } 50% { opacity:.15; } 100% { opacity:.55; } }
            @media (prefers-reduced-motion: reduce) { .pool-challenge-dot { animation:none; } .pool-challenge-dot:after { animation:none; opacity:.4; } }
          `;
          document.head.appendChild(style);
        }
      } catch(e) { /* ignore */ }
    }

    const iv = setInterval(() => {
      if (injected || attempts > maxAttempts) { clearInterval(iv); return; }
      attempts++; injectDot();
    }, 250);

    const observer = new MutationObserver(() => {
      if (!injected) injectDot();
      if (injected) observer.disconnect();
    });
    if (containerRef.current) observer.observe(containerRef.current, { childList:true, subtree:true });

    return () => { clearInterval(iv); observer.disconnect(); };
  }, []);

  return (
    <div ref={containerRef}>
      <Original {...props} />
    </div>
  );
}
