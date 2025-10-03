import React, { useEffect, useState, useMemo } from 'react';

// Helper pad
const pad = (n) => String(n).padStart(2,'0');

// Compute remaining fraction for progress bar + time parts
function useCountdown(targetISO, onFinish){
  const target = useMemo(()=> new Date(targetISO), [targetISO]);
  const [now, setNow] = useState(new Date());
  useEffect(()=>{ const t = setInterval(()=> setNow(new Date()), 1000); return ()=> clearInterval(t); },[]);
  const total = Math.max(0, target - now);
  const finished = total <= 0;
  // (Optional) call finish callback once
  useEffect(()=>{ if (finished && onFinish) onFinish(); }, [finished, onFinish]);

  let diff = total;
  const days = Math.floor(diff / 86400000); diff -= days*86400000;
  const hours = Math.floor(diff / 3600000); diff -= hours*3600000;
  const minutes = Math.floor(diff / 60000); diff -= minutes*60000;
  const seconds = Math.floor(diff / 1000);

  return { finished, days, hours, minutes, seconds, totalMs: total, target };
}

function CountdownSegments({ days, hours, minutes, seconds }){
  return (
    <div className="countdown-chip" aria-label="time remaining" aria-live="polite">
      <span className="seg" title="days">{days}</span><span className="lab">d</span>
      <span className="seg">{pad(hours)}</span><span className="lab">h</span>
      <span className="seg">{pad(minutes)}</span><span className="lab">m</span>
      <span className="seg">{pad(seconds)}</span><span className="lab">s</span>
    </div>
  );
}

export default function CountdownBadge({ targetDateISO = '2025-10-01T00:00:00Z' }) {
  const { finished, days, hours, minutes, seconds, totalMs, target } = useCountdown(targetDateISO);

  // For progress bar we compute fraction remaining relative to a fixed window (challenge start?).
  // If no defined start, assume 30 days before target for a stable visual gradient reference.
  const assumedDuration = 30 * 86400000; // 30 days
  const startApprox = target.getTime() - assumedDuration;
  const nowMs = Date.now();
  const elapsed = Math.min(Math.max(nowMs - startApprox, 0), assumedDuration);
  const remainingFraction = 1 - (elapsed / assumedDuration);
  const barWidth = finished ? 0 : Math.max(0, Math.min(100, remainingFraction * 100));

  return (
    <div className="relative mt-2 mb-3 bg-dark-blue-card/70 backdrop-blur-md border border-dark-blue-border/50 shadow-black/20 shadow-lg rounded-lg px-6 py-3 flex items-center transition-all duration-300 hover:bg-dark-blue-card/80 hover:shadow-2xl hover:shadow-bitcoin-orange/10 hover:border-bitcoin-orange/50" role="region" aria-label="Bitaxe challenge countdown">
      <div className="challenge-premium-line" aria-hidden="true" />
      <div className="flex w-full items-center text-[12px] tracking-wide">
        {/* Group 1: Title */}
        <div className="flex items-center gap-2 pr-6 border-r border-slate-600/30">
          <span className="text-slate-300 font-medium whitespace-nowrap">Best diff</span>
          <span className="text-slate-100 font-semibold" style={{letterSpacing:'0.55px'}}>bitaxe</span>
        </div>
        {/* Group 2: Prize (center) */}
        <div className="flex items-center justify-center flex-1 px-6">
          <span className="challenge-prize-pill">
            <span className="dot" aria-hidden="true" />
            <span className="prize-shimmer">20,000 sats</span>
          </span>
        </div>
        {/* Group 3: Countdown + date */}
        <div className="flex items-center gap-5 pl-6 border-l border-slate-600/30">
          {finished ? (
            <span className="text-amber-500 font-semibold text-[12px]">Finished</span>
          ) : (
            <CountdownSegments days={days} hours={hours} minutes={minutes} seconds={seconds} />
          )}
          <div className="challenge-date-badge whitespace-nowrap">
            <span className="clock" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="8" strokeWidth="1.4"/><path d="M12 8v4l2.5 2.5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <span className="label">Ends</span>
            <span className="value">1 Oct</span>
          </div>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">Bitaxe best difficulty challenge ends October 1 2025 at 00 00 UTC. {finished ? 'Finished' : `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds remaining.`}</span>
    </div>
  );
}
