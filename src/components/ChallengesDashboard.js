import React, { useMemo, useState, useEffect } from 'react';
import './challenge-card-themes.css';

// Helper formatting
const shorten = (addr) => addr && addr.length > 16 ? addr.slice(0,8)+'...'+addr.slice(-6) : addr;
const formatDiff = (v) => {
  if(!v) return '0';
  const units = [['T',1e12],['G',1e9],['M',1e6],['K',1e3]];
  for(const [u,n] of units){ if(v>=n) return (v/n >= 100 ? Math.round(v/n) : (v/n).toFixed(1))+u; }
  return String(v);
};
const formatCountdown = (ms) => {
  if (ms <= 0) return '0s';
  const d = Math.floor(ms / 86400000); ms -= d*86400000;
  const h = Math.floor(ms / 3600000); ms -= h*3600000;
  const m = Math.floor(ms / 60000); ms -= m*60000;
  const s = Math.floor(ms / 1000);
  if (d>0) return `${d}d ${h}h`;
  if (h>0) return `${h}h ${m}m`;
  if (m>0) return `${m}m ${s}s`;
  return `${s}s`;
};

// Card component with richer visuals
const ChallengeCard = ({ challenge, now, t, variant }) => {
  const isFuture = now < challenge.start;
  const isFinished = now >= challenge.end;
  const isOngoing = !isFuture && !isFinished;
  const timeToStart = challenge.start - now;
  const timeToEnd = challenge.end - now;
  let countdown = isFuture ? timeToStart : timeToEnd;
  let countdownLabel = isFuture ? t('challengesStartsIn') : t('challengesEndsIn');
  // Allow overriding upcoming countdown to point to end date (user request for Oct events)
  if (isFuture && challenge.countdownToEnd) {
    countdown = timeToEnd;
    countdownLabel = t('challengesEndsIn');
  }
  const duration = challenge.end - challenge.start;
  const progressPct = isOngoing && duration > 0 ? Math.min(100, Math.max(0, ((now - challenge.start) / duration) * 100)) : (isFinished ? 100 : 0);
  const typeIcon = challenge.type === 'best-diff' ? '⛏️' : '🎯';
  const statusPill = isOngoing ? t('challengesStatusLive') : isFuture ? t('challengesStatusUpcoming') : t('challengesStatusDone');
  const statusColor = isOngoing ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40' : isFuture ? 'bg-sky-500/15 text-sky-300 border-sky-400/40' : 'bg-slate-500/15 text-slate-300 border-slate-400/40';
  return (
    <div className={`challenge-card-base relative group p-4 variant-${variant} shadow-lg shadow-black/30 overflow-hidden`}>
      {/* Decorative gradient ring */}
      <div className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{background:'radial-gradient(circle at 30% 20%, rgba(255,184,76,0.15), transparent 60%)'}} />
      <div className="flex items-start justify-between relative z-10">
        <h3 className="text-sm font-semibold font-title leading-tight pr-2 flex items-center gap-2">
          <span className="text-lg leading-none" aria-hidden>{typeIcon}</span>
          {challenge.title}
        </h3>
        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wide font-semibold ${statusColor}`}>{statusPill}</span>
      </div>
      <div className="mt-2 text-[11px] text-secondary-text flex flex-wrap gap-x-5 gap-y-1 relative z-10">
        <span className="flex items-center gap-1"><span className="opacity-60">{t('challengesReward')}:</span> <span className="text-amber-300 font-semibold tracking-wide">{challenge.reward}</span></span>
        <span className="flex items-center gap-1"><span className="opacity-60">{countdownLabel}:</span> <span className="small-mono text-sky-300">{countdown > 0 ? formatCountdown(countdown) : '0s'}</span></span>
        {isOngoing && (
          <span className="flex items-center gap-1"><span className="opacity-60">{t('challengesProgress')}:</span> <span className="small-mono text-emerald-300">{progressPct.toFixed(progressPct < 10 ? 1 : 0)}%</span></span>
        )}
      </div>
      {/* Progress bar */}
      {(isOngoing || isFinished) && (
        <div className="mt-3 h-1.5 w-full bg-slate-800/60 rounded overflow-hidden relative z-10">
          <div className={`h-full ${isFinished ? 'bg-gradient-to-r from-emerald-400 via-amber-400 to-pink-400' : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600'} transition-all duration-700`} style={{width: progressPct + '%'}} />
        </div>
      )}
      {isFinished && (
        <div className="mt-2 text-xs">
          {challenge.winner ? (
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-secondary-text">{t('challengesWinner')}:</span>
                <span className="small-mono text-emerald-300">{challenge.winner.short || shorten(challenge.winner.address)}</span>
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-400/30 rounded uppercase tracking-wide">20k sats</span>
              </div>
              <a href={challenge.winner.proof} target="_blank" rel="noopener noreferrer" className="text-[11px] underline decoration-dotted text-sky-300 hover:text-sky-200">
                {t('challengesProof')} {challenge.winner.proofShort || challenge.winner.short || ''}
              </a>
            </div>
          ) : (
            <div className="text-secondary-text italic text-[11px]">{t('challengesNoWinner')}</div>
          )}
        </div>
      )}
      {isOngoing && challenge.liveLeader?.address && (
        <div className="mt-3 flex items-center justify-between text-[11px]">
          <div className="flex flex-col">
            <span className="text-secondary-text">{t('challengesLeader')}</span>
            <span className="small-mono text-primary-text">{shorten(challenge.liveLeader.address)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-secondary-text">{t('challengesBestDiff')}</span>
            <span className="small-mono text-amber-400">{formatDiff(challenge.liveLeader.diff)}</span>
          </div>
        </div>
      )}
      {isFuture && (
        <div className="mt-3 text-[11px] text-secondary-text italic">{t('challengesUpcoming')}</div>
      )}
    </div>
  );
};

export default function ChallengesDashboard({ t, leader }) {
  const now = Date.now();
  const [cardVariant, setCardVariant] = useState(() => {
    try { return localStorage.getItem('challenge_card_variant') || '1'; } catch { return '1'; }
  });
  const [layoutVariant, setLayoutVariant] = useState(() => {
    try { return localStorage.getItem('challenge_layout_variant') || '1'; } catch { return '1'; }
  });
  const variants = [
    { id:'1', label:'Subtle Gradient' },
    { id:'2', label:'Frosted Glass' },
    { id:'3', label:'Gold Outline' },
    { id:'4', label:'Diagonal Stripes' },
    { id:'5', label:'Hex Grid' },
    { id:'6', label:'Copper Glow' },
    { id:'7', label:'Blueprint Grid' },
    { id:'8', label:'Dark Embossed' },
    { id:'9', label:'Orbit Rings' },
    { id:'10', label:'Pulse Edge' },
  ];
  useEffect(() => {
    try { localStorage.setItem('challenge_card_variant', cardVariant); } catch {}
  }, [cardVariant]);
  useEffect(() => {
    try { localStorage.setItem('challenge_layout_variant', layoutVariant); } catch {}
  }, [layoutVariant]);
  // Static mock for now (can be replaced by API call later)
  const challenges = useMemo(() => [
    {
      id: 'bitaxe-oct-2025',
      title: 'Bitaxe Best Diff Season 1 (September)',
      reward: '20,000 sats',
      start: new Date('2025-09-01T00:00:00Z').getTime(),
      end: new Date('2025-10-01T00:00:00Z').getTime(),
      type: 'best-diff',
      unit: 'difficulty',
      // Static declared winner (September Bitaxe Challenge)
      winner: {
        address: 'bc1qufq2eu72lm5axm9rwc5mdc022s7z046njf29cy',
        proof: 'https://www.blockchain.com/explorer/addresses/btc/bc1qufq2eu72lm5axm9rwc5mdc022s7z046njf29cy',
        short: 'bc1qufq2eu...njf29cy',
        proofShort: 'bc1qufq2e...9f29cy'
      },
      liveLeader: null // finished challenge -> no live leader
    },
    {
      id: 'october-diff-sprint',
      title: 'October Diff Sprint',
      reward: '10,000 sats',
      start: new Date('2025-10-01T00:00:00Z').getTime(),
      end: new Date('2025-11-01T00:00:00Z').getTime(),
      type: 'best-diff',
      unit: 'difficulty',
      winner: null,
      liveLeader: null,
      countdownToEnd: true
    },
    {
      id: 'october-random-pick',
      title: 'October Random Address Pick',
      reward: '10,000 sats',
      start: new Date('2025-10-01T00:00:00Z').getTime(),
      end: new Date('2025-11-01T00:00:00Z').getTime(),
      type: 'random-pick',
      unit: 'n/a',
      winner: null,
      liveLeader: null,
      countdownToEnd: true
    }
  ], [leader, now]);

  const ongoing = challenges.filter(c => now >= c.start && now < c.end);
  const upcoming = challenges.filter(c => now < c.start);
  const finished = challenges.filter(c => now >= c.end);

  const stats = {
    total: challenges.length,
    ongoing: ongoing.length,
    upcoming: upcoming.length,
    finished: finished.length
  };

  const Hero = () => (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-mono font-semibold tracking-wide text-secondary-text flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.15)] animate-pulse" />
            <span className="text-white">{t('challengesPoolHeader')}</span>
            <span className="text-[10px] px-2 py-0.5 rounded border border-amber-500/40 text-amber-300 uppercase">Beta</span>
          </h1>
          <p className="mt-2 text-[12px] text-slate-400 max-w-xl leading-relaxed">{t('challengesDescription')}</p>
        </div>
        {/* Actions removed per user request */}
      </div>
      {/* Quick stats row */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-md px-3 py-2 flex flex-col">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">{t('challengesStatsTotal')}</span>
          <span className="mt-0.5 text-sm font-mono text-white">{stats.total}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-md px-3 py-2 flex flex-col">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">{t('challengesStatsLive')}</span>
          <span className="mt-0.5 text-sm font-mono text-emerald-300">{stats.ongoing}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-md px-3 py-2 flex flex-col">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">{t('challengesStatsUpcoming')}</span>
          <span className="mt-0.5 text-sm font-mono text-sky-300">{stats.upcoming}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-md px-3 py-2 flex flex-col">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">{t('challengesStatsFinished')}</span>
          <span className="mt-0.5 text-sm font-mono text-slate-300">{stats.finished}</span>
        </div>
      </div>
    </div>
  );

  // --- Helper subcomponents for new hero ---
  const HeroStat = ({ label, value, accent='amber', pulse=false }) => {
    const colorMap = {
      amber: 'from-amber-400/90 to-amber-500/50 text-amber-200 border-amber-400/30',
      emerald: 'from-emerald-400/90 to-emerald-500/40 text-emerald-200 border-emerald-400/30',
      sky: 'from-sky-400/90 to-sky-500/50 text-sky-200 border-sky-400/30',
      slate: 'from-slate-400/70 to-slate-500/30 text-slate-200 border-slate-400/30'
    };
    return (
      <div className={`relative overflow-hidden rounded-lg border ${colorMap[accent] || colorMap.amber} bg-gradient-to-br px-3.5 py-2.5 shadow-inner shadow-black/30`}>
        {pulse && <div className="absolute inset-0 animate-pulse bg-emerald-400/5" />}
        <div className="relative z-10 flex flex-col">
          <span className="text-[10px] uppercase tracking-wide opacity-75 font-semibold">{label}</span>
          <span className="mt-0.5 text-lg font-title font-semibold leading-none drop-shadow-[0_0_4px_rgba(0,0,0,0.4)]">{value}</span>
        </div>
      </div>
    );
  };

  const HighlightPanel = ({ title, color='emerald', challenge, now, upcoming=false }) => {
    const endOrStartMs = upcoming ? (challenge.start - now) : (challenge.end - now);
  const label = upcoming ? t('challengesStartsIn') : t('challengesEndsIn');
    const colorRing = color==='emerald' ? 'text-emerald-300' : color==='sky' ? 'text-sky-300' : 'text-amber-300';
    return (
      <div className="relative p-5 rounded-xl border border-slate-700/60 bg-[#0f2533]/70 backdrop-blur-md overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(circle at 85% 20%, rgba(255,190,90,0.18), transparent 65%)'}} />
        <h2 className={`text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2 ${colorRing}`}>{title}</h2>
        <div className="text-[11px] text-slate-300 space-y-1">
          <div className="flex justify-between"><span className="opacity-60">{t('challengesTitleLabel')}</span><span className="small-mono text-slate-100 truncate max-w-[160px]">{challenge.title}</span></div>
          <div className="flex justify-between"><span className="opacity-60">{t('challengesReward')}</span><span className="text-amber-300">{challenge.reward}</span></div>
          <div className="flex justify-between"><span className="opacity-60">{label}</span><span className="small-mono text-sky-300">{formatCountdown(endOrStartMs)}</span></div>
          {challenge.liveLeader?.address && !upcoming && (
            <div className="flex justify-between"><span className="opacity-60">{t('challengesLeader')}</span><span className="small-mono text-emerald-300 truncate max-w-[160px]">{shorten(challenge.liveLeader.address)}</span></div>
          )}
        </div>
        <div className="mt-3 h-1.5 bg-slate-800/60 rounded overflow-hidden">
          <div className={`h-full ${upcoming? 'bg-gradient-to-r from-sky-300 via-sky-500 to-sky-700' : 'bg-gradient-to-r from-emerald-300 via-amber-400 to-pink-500'} transition-all duration-700`} style={{width: upcoming? '35%' : Math.min(100, ((now - challenge.start)/(challenge.end-challenge.start))*100)+'%'}} />
        </div>
      </div>
    );
  };

  const section = (title, items, kind) => (
    <div className="mt-10">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-lg font-semibold font-title flex items-center gap-2">
          {kind === 'ongoing' && <span className="text-emerald-400">⚡</span>}
          {kind === 'upcoming' && <span className="text-sky-300">🕒</span>}
          {kind === 'finished' && <span className="text-slate-400">🏁</span>}
          {title}
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-slate-600/60 via-transparent to-transparent" />
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map(ch => (
          <div key={ch.id} className="relative">
            <ChallengeCard challenge={ch} now={now} t={t} variant={cardVariant} />
          </div>
        ))}
      </div>
    </div>
  );

  // --- Additional Layout Renderers ---
  const renderClassic = () => (
    <div>
      {ongoing.length>0 && section(t('challengesOngoing'), ongoing, 'ongoing')}
      {upcoming.length>0 && section(t('challengesUpcoming'), upcoming, 'upcoming')}
      {finished.length>0 && section(t('challengesFinished'), finished, 'finished')}
    </div>
  );
  const renderSidebar = () => (
    <div className="flex flex-col lg:flex-row gap-8">
      <aside className="lg:w-72 flex flex-col gap-6">
        <div className="p-5 rounded-xl border border-slate-700/60 bg-[#102131]/70 backdrop-blur-md">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-secondary-text mb-3">{t('challengesStatsTotal')}</h3>
          <ul className="text-[11px] space-y-1 text-secondary-text">
            <li>{t('challengesStatsTotal')}: <span className="text-amber-300">{stats.total}</span></li>
            <li>{t('challengesStatsLive')}: <span className="text-emerald-300">{stats.ongoing}</span></li>
            <li>{t('challengesStatsUpcoming')}: <span className="text-sky-300">{stats.upcoming}</span></li>
            <li>{t('challengesStatsFinished')}: <span className="text-slate-300">{stats.finished}</span></li>
          </ul>
        </div>
        {ongoing[0] && (
          <div className="p-5 rounded-xl border border-emerald-600/40 bg-emerald-900/10">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-300 mb-2">{t('challengesLiveHighlight')}</h3>
            <p className="text-[11px] text-secondary-text mb-2">{ongoing[0].title}</p>
            <p className="text-[11px] text-amber-300">{t('challengesEndsIn')} {formatCountdown(ongoing[0].end - now)}</p>
          </div>
        )}
      </aside>
      <div className="flex-1 space-y-10">
        {ongoing.length>0 && section(t('challengesOngoing'), ongoing, 'ongoing')}
        {upcoming.length>0 && section(t('challengesUpcoming'), upcoming, 'upcoming')}
        {finished.length>0 && section(t('challengesFinished'), finished, 'finished')}
      </div>
    </div>
  );
  const renderTimeline = () => {
    const all = [
      ...ongoing.map(c=>({...c,_status:'ongoing'})),
      ...upcoming.map(c=>({...c,_status:'upcoming'})),
      ...finished.map(c=>({...c,_status:'finished'})),
    ].sort((a,b)=> a.start - b.start);
    const colorFor = s => s==='ongoing'?'text-emerald-300': s==='upcoming'?'text-sky-300':'text-slate-400';
    return (
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/30 via-slate-600/30 to-transparent" />
        <div className="space-y-10 pl-10">
          {all.map(ch => (
            <div key={ch.id} className="relative">
              <div className="absolute -left-5 w-3 h-3 rounded-full bg-amber-400 shadow-md shadow-amber-500/40" />
              <div className="flex items-center gap-3 mb-2">
                <h3 className={`text-sm font-semibold font-title flex items-center gap-2 ${colorFor(ch._status)}`}>
                  <span>{ch._status==='ongoing'?'⚡': ch._status==='upcoming'?'🕒':'🏁'}</span>{ch.title}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wide font-semibold ${ch._status==='ongoing'?'bg-emerald-600/20 text-emerald-300 border-emerald-400/40': ch._status==='upcoming'?'bg-sky-600/20 text-sky-300 border-sky-400/40':'bg-slate-600/20 text-slate-300 border-slate-400/40'}`}>{ch._status==='ongoing'? t('challengesStatusLive') : ch._status==='upcoming'? t('challengesStatusUpcoming') : t('challengesStatusDone')}</span>
              </div>
              <div className="max-w-4xl">
                <ChallengeCard challenge={ch} now={now} t={t} variant={cardVariant} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  const renderMasonry = () => (
    <div className="columns-1 md:columns-2 xl:columns-3 gap-6 [column-fill:_balance]">
      {[...ongoing, ...upcoming, ...finished].map(ch => (
        <div key={ch.id} className="mb-6 break-inside-avoid">
          <ChallengeCard challenge={ch} now={now} t={t} variant={cardVariant} />
        </div>
      ))}
    </div>
  );
  const renderLeaderboard = () => (
    <div className="space-y-12">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-12">
          {ongoing.length>0 && section(t('challengesOngoing'), ongoing, 'ongoing')}
          {upcoming.length>0 && section(t('challengesUpcoming'), upcoming, 'upcoming')}
        </div>
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-slate-700/60 bg-[#102131]/70">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-secondary-text mb-3">Leaderboard (Finished)</h3>
            <ul className="text-[11px] space-y-1 text-secondary-text">
              {finished.slice(0,6).map((f,i)=>(
                <li key={f.id} className="flex justify-between gap-4 items-center">
                  <span className="flex items-center gap-2">
                    <span className="text-amber-400">#{i+1}</span>
                    {f.title}
                  </span>
                  {f.winner ? (
                    <span className="small-mono text-emerald-300">{f.winner.short || shorten(f.winner.address)}</span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </li>
              ))}
              {finished.length===0 && <li className="italic opacity-60">No finished yet</li>}
            </ul>
          </div>
          {finished.length>0 && (
            <div className="p-5 rounded-xl border border-slate-700/60 bg-[#0f202d]/70">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-3">{t('challengesFinished')}</h3>
              <div className="space-y-4 max-h-[520px] overflow-auto pr-1">
                {finished.map(ch => <ChallengeCard key={ch.id} challenge={ch} now={now} t={t} variant={cardVariant} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  const renderFinishedTable = () => (
    <div className="space-y-12">
      {ongoing.length>0 && section(t('challengesOngoing'), ongoing, 'ongoing')}
      {upcoming.length>0 && section(t('challengesUpcoming'), upcoming, 'upcoming')}
      {finished.length>0 && (
        <div>
          <h2 className="text-sm font-title font-semibold mb-4 text-slate-300">🏁 {t('challengesFinished')}</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-700/60 bg-[#0e1d29]/60">
            <table className="min-w-full text-[11px]">
              <thead className="bg-slate-800/60 text-secondary-text uppercase tracking-wide">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">{t('challengesTitleLabel')}</th>
                  <th className="text-left px-3 py-2 font-medium">{t('challengesReward')}</th>
                  <th className="text-left px-3 py-2 font-medium">{t('challengesWinner')}</th>
                  <th className="text-left px-3 py-2 font-medium">{t('challengesStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {finished.map(ch => (
                  <tr key={ch.id} className="border-t border-slate-700/40 hover:bg-slate-800/40">
                    <td className="px-3 py-2 whitespace-pre-wrap max-w-xs">{ch.title}</td>
                    <td className="px-3 py-2 text-amber-300">{ch.reward}</td>
                    <td className="px-3 py-2 small-mono text-emerald-300">{ch.winner ? (ch.winner.short || shorten(ch.winner.address)) : '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {ch.winner?.proof ? (
                        <span className="flex items-center gap-2 text-[11px]">
                          <span className="text-amber-300 font-semibold tracking-wide">{t('challengesPaid')}</span>
                          <a
                            href={ch.winner.proof}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-dotted text-sky-300 hover:text-sky-200"
                            title="Payment proof"
                          >Proof</a>
                        </span>
                      ) : (
                        <span className="text-amber-300 font-semibold tracking-wide">{t('challengesPaid')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderByLayout = () => {
    switch(layoutVariant){
      case '2': return renderSidebar();
      case '3': return renderTimeline();
      case '4': return renderMasonry();
      case '5': return renderLeaderboard();
      case '6': return renderFinishedTable();
      default: return renderClassic();
    }
  };

  return (
    <div className={`challenges-minimal-theme ${layoutVariant === '6' ? 'flat-mode' : ''}`}>
      <Hero />
      {renderByLayout()}
      {ongoing.length===0 && upcoming.length===0 && finished.length===0 && (
        <div className="mt-10 p-8 rounded-xl border border-dashed border-slate-600/50 text-center bg-slate-800/30">
          <p className="text-sm text-secondary-text">{t('challengesNoLive')} <span className="text-amber-300">{t('challengesNoLiveCta')}</span></p>
        </div>
      )}
    </div>
  );
}
