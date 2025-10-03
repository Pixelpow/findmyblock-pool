import React, { useState, useMemo } from 'react';
import { challenges, categoryColors } from '../../data/challenges';

// Basic utility to format date range
function formatRange(start, end){
  const s = new Date(start); const e = new Date(end);
  const opts = { month:'short', day:'numeric'};
  const sameYear = s.getUTCFullYear() === e.getUTCFullYear();
  const yS = s.getUTCFullYear();
  const yE = e.getUTCFullYear();
  return `${s.toLocaleDateString('en-US', opts)}${sameYear?'':', '+yS} → ${e.toLocaleDateString('en-US', opts)}, ${yE}`;
}

function truncateAddress(addr){
  if(!addr) return '';
  return addr.length > 16 ? addr.slice(0,8)+'...'+addr.slice(-6) : addr;
}

const StatusBadge = ({ status }) => {
  const map = {
    active: { text:'Active', cls:'bg-emerald-600/20 text-emerald-300 border-emerald-500/30'},
    finished: { text:'Finished', cls:'bg-slate-600/20 text-slate-300 border-slate-500/30'},
    archived: { text:'Archived', cls:'bg-slate-800/60 text-slate-400 border-slate-600/40'},
    upcoming: { text:'Upcoming', cls:'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'}
  };
  const cfg = map[status] || map.finished;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide border ${cfg.cls}`}>{cfg.text}</span>;
};

const PrizeBadge = ({ prize }) => {
  if(!prize) return null;
  const sats = prize.sats?.toLocaleString();
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
      <span role="img" aria-label="prize">🏆</span>
      {sats} sats
    </span>
  );
};

const ChallengeCard = ({ c, onSelect }) => {
  const color = categoryColors[c.category] || '#64748b';
  return (
    <div className="group relative rounded-lg border border-slate-700/50 bg-slate-900/60 hover:bg-slate-900/80 transition-colors p-4 flex flex-col gap-3 cursor-pointer" onClick={()=>onSelect(c)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold tracking-wide text-slate-100 font-title flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-sm" style={{background:color}} />
            {c.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={c.status} />
            <PrizeBadge prize={c.prize} />
          </div>
        </div>
        {c.winner && (
          <div className="text-right text-xs text-slate-400 leading-tight">
            <p className="uppercase tracking-wide text-[10px] text-slate-500">Winner</p>
            <p className="font-mono text-[11px] text-slate-300">{truncateAddress(c.winner.address)}</p>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-400 line-clamp-3 min-h-[2.3rem]">{c.summary}</p>
      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mt-auto pt-1">
        <span>{formatRange(c.start, c.end)}</span>
        {c.winner?.bestDiff && (
          <span className="text-amber-300/90">Best diff: {Intl.NumberFormat('en-US').format(c.winner.bestDiff)}</span>
        )}
      </div>
      <div className="absolute inset-0 rounded-lg ring-0 group-hover:ring-1 ring-amber-500/40 pointer-events-none transition" />
    </div>
  );
};

const ActiveChallengeHighlight = ({ c }) => {
  if(!c) return <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-900/60 text-sm text-slate-400">No active challenge.</div>;
  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-amber-900/10 p-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-wide text-amber-300 font-title flex items-center gap-3">
          <span role="img" aria-label="crown">👑</span>
          {c.title}
        </h2>
        <PrizeBadge prize={c.prize} />
      </div>
      <p className="text-sm text-slate-300 max-w-3xl">{c.summary}</p>
      <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 font-medium">
        <span>Period: {formatRange(c.start, c.end)}</span>
        {c.winner && <span>Leader: <span className="text-slate-200 font-mono">{truncateAddress(c.winner.address)}</span></span>}
        {c.winner?.bestDiff && <span>Best diff: <span className="text-amber-300">{Intl.NumberFormat('en-US').format(c.winner.bestDiff)}</span></span>}
        {c.winner?.paymentProof && <a href={c.winner.paymentProof} target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:text-sky-200 underline decoration-dotted">Payment proof ↗</a>}
      </div>
    </div>
  );
};

export default function ChallengesPage(){
  const [view, setView] = useState('grid'); // 'grid' | 'timeline'
  const [selected, setSelected] = useState(null);

  const active = useMemo(()=> challenges.find(c => c.status === 'active'), []);
  const past = useMemo(()=> challenges.filter(c => c.status !== 'active').sort((a,b)=> new Date(b.end||0)-new Date(a.end||0)), []);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-wide text-white font-title">Challenges</h1>
        <p className="text-sm text-slate-400 max-w-2xl">Historic & active mining challenges. Track prizes, winners and performance metrics over time.</p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button onClick={()=>setView('grid')} className={`px-3 py-1 text-xs rounded-md border ${view==='grid'?'bg-amber-500 text-black border-amber-400':'border-slate-600 text-slate-300 hover:bg-slate-800'}`}>Grid</button>
          <button onClick={()=>setView('timeline')} className={`px-3 py-1 text-xs rounded-md border ${view==='timeline'?'bg-amber-500 text-black border-amber-400':'border-slate-600 text-slate-300 hover:bg-slate-800'}`}>Timeline (soon)</button>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-wide text-slate-200 font-title">Active Challenge</h2>
        <ActiveChallengeHighlight c={active} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-wide text-slate-200 font-title flex items-center gap-3">Past Challenges <span className="text-[11px] font-medium text-slate-500">{past.length}</span></h2>
        {past.length === 0 ? (
          <p className="text-xs text-slate-500">No past challenges yet.</p>
        ) : view === 'grid' ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {past.map(c => <ChallengeCard key={c.id} c={c} onSelect={setSelected} />)}
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic">Timeline view under construction.</div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={()=>setSelected(null)}>
          <div className="max-w-lg w-full bg-slate-900 border border-slate-700/60 rounded-xl p-6 relative" onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setSelected(null)} className="absolute top-2 right-2 text-slate-500 hover:text-slate-300" aria-label="Close">✕</button>
            <h3 className="text-xl font-semibold text-white font-title mb-2 flex items-center gap-2">{selected.title} <StatusBadge status={selected.status} /></h3>
            <div className="flex flex-wrap gap-3 text-[11px] text-slate-400 mb-3">
              <span>Period: {formatRange(selected.start, selected.end)}</span>
              {selected.prize && <span>Prize: {selected.prize.sats.toLocaleString()} sats</span>}
              {selected.winner?.address && <span>Winner: <span className="font-mono text-slate-300">{truncateAddress(selected.winner.address)}</span></span>}
              {selected.winner?.bestDiff && <span>Best diff: {selected.winner.bestDiff.toLocaleString()}</span>}
            </div>
            <p className="text-sm text-slate-300 mb-4 whitespace-pre-line leading-relaxed">{selected.summary}</p>
            {selected.winner?.paymentProof && (
              <a href={selected.winner.paymentProof} target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:text-sky-200 underline decoration-dotted text-xs">Open payment proof ↗</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
