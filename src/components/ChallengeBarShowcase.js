import React, { useState, useMemo } from 'react';

// Utility for countdown formatting (simple, reused)
const pad = n => String(n).padStart(2,'0');
function useCountdown(targetISO){
  const target = useMemo(()=> new Date(targetISO),[targetISO]);
  const [now,setNow]=React.useState(new Date());
  React.useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t);},[]);
  let diff = Math.max(0, target - now);
  const days = Math.floor(diff/86400000); diff -= days*86400000;
  const hours = Math.floor(diff/3600000); diff -= hours*3600000;
  const minutes = Math.floor(diff/60000); diff -= minutes*60000;
  const seconds = Math.floor(diff/1000);
  return {days,hours,minutes,seconds};
}

const variantsMeta = [
  { key:'nv1', label:'Ultra Clean Baseline'},
  { key:'nv2', label:'Dual-Tone Gradient'},
  { key:'nv3', label:'Segmented Rail'},
  { key:'nv4', label:'Underbar Glow'},
  { key:'nv5', label:'Center Halo'},
  { key:'nv6', label:'Capsule Cluster'},
  { key:'nv7', label:'Floating Badge'},
  { key:'nv8', label:'Dense Compact'},
  { key:'nv9', label:'Soft Ribbon'},
  { key:'nv10', label:'Double Frame'},
  { key:'nv11', label:'Vertical Pillars'},
  { key:'nv12', label:'Top Bar Accent'},
  { key:'nv13', label:'Center Orb'},
  { key:'nv14', label:'Baseline Stripe'},
  { key:'nv15', label:'Executive Spacing'},
  { key:'nv16', label:'Micro Grid'},
  { key:'nv17', label:'Halo Focus'},
  { key:'nv18', label:'Metallic Noise'},
  { key:'nv19', label:'Airy Minimal'},
  { key:'nv20', label:'Slim Strip'},
];

export default function ChallengeBarShowcase({ targetDateISO = '2025-10-01T00:00:00Z', onSelect }) {
  const {days,hours,minutes,seconds} = useCountdown(targetDateISO);
  const [variant,setVariant]=useState('nv6');

  const countdown = (
    <span className="font-mono text-xs text-slate-300 flex items-center gap-1">
      <span>{days}d</span>
      <span>{pad(hours)}:{pad(minutes)}:{pad(seconds)}</span>
    </span>
  );

  const prize = (extraClass="") => (
    <span className={`flex items-center gap-2 ${extraClass}`}>
      <span className="variant-dot" />
      <span className="prize-core">20,000 sats</span>
    </span>
  );

  const dateBadge = (
    <span className="challenge-date-badge">
      <span className="clock" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="8" strokeWidth="1.4"/><path d="M12 8v4l2.5 2.5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
      <span className="label">Ends</span><span className="value">1 Oct</span>
    </span>
  );

  const commonLeft = (
    <div className="flex items-center gap-2 text-[12px]">
      <span className="text-slate-300 font-medium">Best diff</span>
      <span className="text-slate-100 font-semibold tracking-wide">bitaxe</span>
    </div>
  );

  function renderVariant(v){
    switch(v){
      case 'nv1':
        return <div className="challenge-variant challenge-nv1 w-full justify-between">{commonLeft}{prize()}<div className="flex items-center gap-4">{countdown}{dateBadge}</div></div>;
      case 'nv2':
        return <div className="challenge-variant challenge-nv2 w-full justify-between">{commonLeft}{prize()}<div className="flex items-center gap-5">{countdown}{dateBadge}</div></div>;
      case 'nv3':
        return <div className="challenge-variant challenge-nv3 w-full"> 
          <div className="seg">{commonLeft}</div>
          <div className="seg">{prize()}</div>
          <div className="seg">{countdown}{dateBadge}</div>
        </div>;
      case 'nv4':
        return <div className="challenge-variant challenge-nv4 w-full flex items-center justify-between">{commonLeft}{prize()}<div className="flex items-center gap-4">{countdown}{dateBadge}</div></div>;
      case 'nv5':
        return <div className="challenge-variant challenge-nv5 w-full flex items-center gap-10">{commonLeft}<div className="mx-auto">{prize()}</div><div className="flex items-center gap-5">{countdown}{dateBadge}</div></div>;
      case 'nv6':
        return <div className="challenge-variant challenge-nv6 w-full flex items-center gap-10">{commonLeft}<div className="capsule mx-auto">{prize()} {countdown}</div><div className="ml-auto">{dateBadge}</div></div>;
      case 'nv7':
        return <div className="challenge-variant challenge-nv7 w-full flex items-center justify-between pt-3"><div>{commonLeft}</div><div className="floating-prize">{prize()}</div><div className="flex items-center gap-4">{countdown}{dateBadge}</div></div>;
      case 'nv8':
        return <div className="challenge-variant challenge-nv8 w-full">{commonLeft}{prize()} {countdown} {dateBadge}</div>;
      case 'nv9':
        return <div className="challenge-variant challenge-nv9 w-full flex items-center gap-10">{commonLeft}<div className="challenge-spacer" />{prize()}<div className="challenge-spacer" />{countdown}{dateBadge}</div>;
      case 'nv10':
        return <div className="challenge-variant challenge-nv10 w-full flex items-center gap-8">{commonLeft}{prize()}<div className="challenge-spacer" />{countdown}{dateBadge}</div>;
      case 'nv11':
        return <div className="challenge-variant challenge-nv11 w-full flex items-center gap-10">{commonLeft}{prize()}<div className="challenge-spacer" />{countdown}{dateBadge}</div>;
      case 'nv12':
        return <div className="challenge-variant challenge-nv12 w-full flex items-center gap-10">{commonLeft}{prize()}<div className="challenge-spacer" />{countdown}{dateBadge}</div>;
      case 'nv13':
        return <div className="challenge-variant challenge-nv13 w-full flex items-center gap-10">{commonLeft}{prize()}<div className="challenge-spacer" />{countdown}{dateBadge}</div>;
      case 'nv14':
        return <div className="challenge-variant challenge-nv14 w-full flex items-center gap-12">{commonLeft}{prize()}<div className="challenge-spacer" />{countdown}{dateBadge}</div>;
      case 'nv15':
        return <div className="challenge-variant challenge-nv15 w-full flex items-center gap-8">{commonLeft}{prize()}<div className="challenge-spacer" />{countdown}{dateBadge}</div>;
      case 'nv16':
        return <div className="challenge-variant challenge-nv16 w-full flex items-center gap-10">{commonLeft}{prize()}<div className="challenge-spacer" />{countdown}{dateBadge}</div>;
      case 'nv17':
        return <div className="challenge-variant challenge-nv17 w-full flex items-center gap-10">{commonLeft}<div className="halo">{prize()}</div><div className="challenge-spacer" />{countdown}{dateBadge}</div>;
      case 'nv18':
        return <div className="challenge-variant challenge-nv18 w-full flex items-center gap-10">{commonLeft}{prize()}<div className="challenge-spacer" />{countdown}{dateBadge}</div>;
      case 'nv19':
        return <div className="challenge-variant challenge-nv19 w-full flex items-center gap-10">{commonLeft}<div className="light-sep" />{prize()}<div className="challenge-spacer" />{countdown}{dateBadge}</div>;
      case 'nv20':
        return <div className="challenge-variant challenge-nv20 w-full flex items-center gap-8">{commonLeft}{prize()}<div className="challenge-spacer" />{countdown}{dateBadge}</div>;
      default:
        return null;
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-xs text-slate-400">Variant:</label>
        <select className="bg-slate-800/70 border border-slate-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400" value={variant} onChange={e=>{setVariant(e.target.value); onSelect && onSelect(e.target.value);}}>
          {variantsMeta.map(v => <option key={v.key} value={v.key}>{v.key} — {v.label}</option>)}
        </select>
      </div>
      <div className="relative">
        {renderVariant(variant)}
      </div>
    </div>
  );
}