import React, { useEffect, useState, useMemo } from 'react';
import './challenge-mini-bar-variants.css';

// Small helper
const pad = (n) => String(n).padStart(2,'0');

function useCountdown(targetISO){
  const target = useMemo(()=> new Date(targetISO), [targetISO]);
  const [now, setNow] = useState(()=> new Date());
  useEffect(()=>{ const iv = setInterval(()=> setNow(new Date()),1000); return ()=> clearInterval(iv); },[]);
  let diff = Math.max(0, target - now);
  const finished = diff <= 0;
  const days = Math.floor(diff/86400000); diff -= days*86400000;
  const hours = Math.floor(diff/3600000); diff -= hours*3600000;
  const minutes = Math.floor(diff/60000); diff -= minutes*60000;
  const seconds = Math.floor(diff/1000);
  return { finished, days, hours, minutes, seconds };
}

export default function ChallengeMiniBar({
  targetDateISO='2025-10-01T00:00:00Z',
  variant='cmbv-1',
  showTooltip=true,
  leaderAddress='bc1qgp0wcf...6eg5c5re',
  leaderBestDiff=676_000_000 // example numeric best diff
}) {
  const { finished, days, hours, minutes, seconds } = useCountdown(targetDateISO);
  const [showTip, setShowTip] = useState(false); // tooltip visibility
  const shortAddr = useMemo(()=>{
    if(!leaderAddress) return '';
    if(leaderAddress.includes('...')) return leaderAddress;
    return leaderAddress.length > 16 ? leaderAddress.slice(0,8)+'...'+leaderAddress.slice(-6) : leaderAddress;
  },[leaderAddress]);
  const formattedDiff = useMemo(()=>{
    if(leaderBestDiff == null) return '';
    const units = [ ['T',1e12], ['G',1e9], ['M',1e6], ['K',1e3] ];
    for(const [u,v] of units){ if(leaderBestDiff >= v) return (leaderBestDiff / v).toFixed(leaderBestDiff >= v*100 ? 0 : 1)+u; }
    return String(leaderBestDiff);
  },[leaderBestDiff]);
  const proofUrl = 'https://www.blockchain.com/explorer/addresses/btc/bc1qufq2eu72lm5axm9rwc5mdc022s7z046njf29cy';
  const proofLabel = 'bc1qufq2e...9f29cy';
  return (
    <div
      className={`challenge-mini-bar-base ${variant} mt-2 mb-3 w-full`}
      role="region"
      aria-label="Bitaxe challenge"
    >
      <div className="cmb-left flex items-center gap-3">
        <span className="cmb-title font-title" style={{letterSpacing:'0.5px', fontSize:'0.95rem', fontWeight:500, color:'var(--secondary-text, #c7d2e1)'}}>Bitaxe best diff Challenge</span>
        <div className="relative flex items-center"
             onMouseEnter={()=> showTooltip && setShowTip(true)}
             onMouseLeave={()=> showTooltip && setShowTip(false)}>
          <button type="button" className="cmb-info" aria-label="Challenge info" aria-describedby={showTooltip && showTip ? 'challenge-info-tip' : undefined}>?</button>
          {showTooltip && showTip && (
            <div id="challenge-info-tip" role="tooltip" className="cmb-tooltip" style={{position:'absolute', top:'50%', left:'100%', transform:'translateY(-50%)', marginLeft:'10px', whiteSpace:'normal', maxWidth:'230px'}}>
              <>Highest single valid difficulty share before Oct 1 (UTC) wins <span style={{color:'var(--cmb-accent,#d7b56d)', fontWeight:600}}>20,000 sats</span>.</>
            </div>
          )}
        </div>
      </div>
      {/* Separator between title block and leader info */}
      <span className="cmb-sep" aria-hidden="true"></span>
      <div className="cmb-center flex items-center gap-3" style={{fontSize:'0.8rem'}}>
        {/* Winner address + congratulation (live indicator removed) */}
        <div className="cmb-winner flex items-center gap-2" style={{whiteSpace:'nowrap'}} aria-label="Challenge winner & payment proof">
          <span role="img" aria-label="crown" style={{fontSize:'0.8rem'}}>👑</span>
          <span className="winner-addr small-mono" style={{fontSize:'0.7rem', color:'#d9e6f2'}}>bc1qufq2eu...njf29cy</span>
          <span className="text-[0.6rem] uppercase tracking-wide font-semibold text-amber-400">Winner 20k sats</span>
          <a
            href={proofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted text-[0.6rem] text-sky-300 hover:text-sky-200 transition-colors"
            title="Payment proof (opens blockchain explorer)"
          >
            Proof {proofLabel}
          </a>
        </div>
        {/* Separator */}
        <span className="cmb-sep" aria-hidden="true"></span>
        {leaderAddress && (
          <div className="cmb-leader flex items-center gap-2" style={{whiteSpace:'nowrap'}} aria-label="Current leader">
            <span className="leader-addr small-mono" style={{fontSize:'0.7rem', color:'#d9e6f2'}}>{shortAddr}</span>
            <span className="sep" style={{opacity:0.45}}>•</span>
            <span className="leader-diff small-mono" style={{fontSize:'0.7rem'}}>Best diff: <strong style={{color:'var(--gold-accent,#d7b56d)'}}>{formattedDiff}</strong></span>
          </div>
        )}
      </div>
      {/* Separator between leader info and countdown */}
      <span className="cmb-sep" aria-hidden="true"></span>
      <div className="cmb-right" title="Ends 1 Oct 2025 UTC" style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'0.85rem'}}>
        {finished ? (
          <span className="cmb-finished" style={{fontFamily:'var(--font-title, inherit)'}}>Finished</span>
        ) : (
          <span className={`cmb-countdown ${days === 0 ? 'cmb-urgent':''} small-mono small-gold-stat`} style={{display:'flex', alignItems:'center', gap:'4px'}} aria-live="polite">
            <span className="seg" style={{minWidth:'1.2ch', textAlign:'right'}}>{days}</span><span className="lab">d</span>
            <span className="seg" style={{minWidth:'2ch', textAlign:'right'}}>{pad(hours)}</span><span className="lab">h</span>
            <span className="seg" style={{minWidth:'2ch', textAlign:'right'}}>{pad(minutes)}</span><span className="lab">m</span>
            <span className="seg" style={{minWidth:'2ch', textAlign:'right'}}>{pad(seconds)}</span><span className="lab">s</span>
          </span>
        )}
      </div>
  <span className="sr-only" aria-live="polite">Bitaxe challenge ends October 1 2025 at 00 00 UTC. {finished? 'Finished' : `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds remaining.`} Winner awarded twenty thousand sats. Payment proof link available. {leaderAddress ? `Current leader ${shortAddr} best diff ${formattedDiff}.` : ''}</span>
    </div>
  );
}

export function ChallengeMiniBarVariantSelector({ targetDateISO, initial='cmbv-1' }) {
  const [variant, setVariant] = useState(initial);
  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-2">
        <label className="text-xs uppercase tracking-wide text-secondary-text">Style</label>
        <select value={variant} onChange={e=>setVariant(e.target.value)} className="bg-[#0c1926] border border-[#213447] text-xs px-2 py-1 rounded-md focus:outline-none focus:ring-1 focus:ring-[#d7b56d]">
          <option value="cmbv-1">Variant 1 - Flat</option>
          <option value="cmbv-2">Variant 2 - Gradient</option>
          <option value="cmbv-3">Variant 3 - Ghost</option>
          <option value="cmbv-4">Variant 4 - Inset</option>
          <option value="cmbv-5">Variant 5 - Dotted</option>
          <option value="cmbv-6">Variant 6 - Gold Bar</option>
          <option value="cmbv-7">Variant 7 - Gold Outline</option>
          <option value="cmbv-8">Variant 8 - Glass</option>
          <option value="cmbv-9">Variant 9 - Segmented</option>
          <option value="cmbv-10">Variant 10 - Minimal</option>
          <option value="cmbv-tiles">Variant 11 - Tiles Match</option>
        </select>
      </div>
      <ChallengeMiniBar targetDateISO={targetDateISO} variant={variant} />
    </div>
  );
}
