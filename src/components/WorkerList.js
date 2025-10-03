import React from 'react';

const StatusDot = ({ status }) => {
  const cls = status === 'active' ? 'bg-green-500' : status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500';
  return <span className={`inline-block w-2 h-2 rounded-full ${cls} mr-2`} />;
};

function formatHashrate(hashrate) {
  if (hashrate === null || isNaN(hashrate)) return 'N/A';
  const units = ['H/s', 'kH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s'];
  let i = 0;
  let val = hashrate;
  while (val >= 1000 && i < units.length - 1) {
    val /= 1000;
    i++;
  }
  return `${val.toFixed(2)} ${units[i]}`;
}

// Small inline editable name control
function InlineEditableName({ value, onSave }) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(value || '');

  React.useEffect(() => { setVal(value || ''); }, [value]);

  return (
    <div>
      {!editing ? (
        <div className="flex items-center gap-2">
          <div className="text-sm text-white font-semibold">{val}</div>
          <button className="text-xs text-secondary-text" onClick={() => setEditing(true)}>✎</button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input className="bg-slate-800/60 rounded px-2 py-1 text-sm" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setEditing(false); onSave(val); } if (e.key === 'Escape') { setEditing(false); setVal(value || ''); } }} />
          <button className="text-xs text-secondary-text" onClick={() => { setEditing(false); onSave(val); }}>Save</button>
        </div>
      )}
    </div>
  );
}

function formatNumber(n) {
  if (n === null || n === undefined || isNaN(n)) return 'N/A';
  try {
    return new Intl.NumberFormat().format(Math.round(n));
  } catch (e) {
    return String(n);
  }
}

function formatDifficulty(diff) {
  if (diff === null || diff === undefined || isNaN(diff)) return 'N/A';
  const units = ['', 'K', 'M', 'G', 'T', 'P', 'E'];
  let i = 0;
  let val = diff;
  while (val >= 1000 && i < units.length - 1) {
    val /= 1000;
    i++;
  }
  return `${val.toFixed(2)}${units[i]}`;
}

function formatUptime(startTime, lastSeen) {
  if (startTime) {
    const now = Date.now();
    const start = new Date(startTime).getTime();
    let seconds = Math.floor((now - start) / 1000);
    if (seconds < 0) seconds = 0;
    const d = Math.floor(seconds / (3600*24));
    seconds  -= d*3600*24;
    const h = Math.floor(seconds / 3600);
    seconds  -= h*3600;
    const m = Math.floor(seconds / 60);
    let s = seconds % 60;
    return `${d > 0 ? d + 'd ' : ''}${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s > 0 ? s + 's' : ''}`.trim() || '<1s';
  }
  if (lastSeen) {
    const diff = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff/60)}m`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h`;
    return `${Math.floor(diff/86400)}d`;
  }
  return 'N/A';
}

export default function WorkerList({ workers = [], walletAddress = '' }) {
  if (!Array.isArray(workers) || workers.length === 0) {
    return <div className="text-xs text-gray-400">No workers found.</div>;
  }
  // Load per-wallet custom names from localStorage
  const storageKey = walletAddress ? `customWorkerNames_${walletAddress}` : 'customWorkerNames_global';
  let customNames = {};
  try { customNames = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch (e) { customNames = {}; }
  return (
    <div className="mt-3">
      {/* Desktop/table header (md+) */}
      <div className="hidden md:grid md:grid-cols-6 md:gap-3 px-3 py-2 text-xs text-secondary-text border-b border-slate-700">
        <div className="col-span-2 font-medium">Name</div>
        <div className="font-medium text-right">Hashrate</div>
        <div className="font-medium text-right">Valid Shares</div>
        <div className="font-medium text-right">Best Diff</div>
        <div className="font-medium text-right">Uptime</div>
        <div className="font-medium text-right">Last seen</div>
      </div>

      {/* Rows */}
      <div className="space-y-2 mt-2">
        {workers.map((w) => {
          // Use same ordering as WalletConnectPanel: prefer workerId, then name, then sessionId
          const key = w.workerId || w.name || w.sessionId || Math.random();
          const status = (w.hashRate && w.hashRate > 0) ? 'active' : ((w.lastSeen && (Date.now() - new Date(w.lastSeen)) < 3*60*1000) ? 'idle' : 'no-data');
          const validShares = w.validShares || w.sharesValid || w.acceptedShares || w.valid || w.valid_share || w.shares || 0;
          const bestDiff = w.bestDifficulty || w.bestDiff || w.best || null;
          const customName = customNames[key] || null;

          return (
            <div key={key} className="bg-slate-800/40 rounded p-2">
              {/* Desktop row */}
              <div className="hidden md:grid md:grid-cols-5 md:gap-3 items-center px-3 py-2">
                  <div className="col-span-2 flex items-center gap-2">
                    <StatusDot status={status} />
                    <div>
                      <InlineEditableName
                        value={customName || w.name || w.sessionId || 'worker'}
                        onSave={(newVal) => {
                          try {
                            const m = JSON.parse(localStorage.getItem(storageKey) || '{}');
                            m[key] = newVal;
                            localStorage.setItem(storageKey, JSON.stringify(m));
                          } catch (e) {}
                          customNames[key] = newVal;
                        }}
                      />
                      <div className="text-[11px] text-secondary-text">{w.label || ''}</div>
                    </div>
                  </div>
                <div className="text-right small-mono font-semibold text-accent-gold text-sm">{w.hashRate ? formatHashrate(w.hashRate) : 'N/A'}</div>

                <div className="text-right text-green-400 font-semibold text-sm">{validShares ? formatNumber(validShares) : '0'}</div>

                <div className="text-right text-accent-gold font-semibold text-sm">{bestDiff ? formatDifficulty(parseFloat(bestDiff)) : 'N/A'}</div>

                {/* Uptime shown as time since last share when startTime is not reliable */}
                <div className="text-right text-secondary-text text-sm">{w.lastSeen ? formatUptime(null, w.lastSeen) : formatUptime(w.startTime, w.lastSeen)}</div>
                <div className="text-right text-secondary-text text-sm">{w.lastSeen ? new Date(w.lastSeen).toLocaleString() : '—'}</div>
              </div>

              {/* Mobile stacked row */}
              <div className="md:hidden px-2 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <StatusDot status={status} />
                    <div>
                      <InlineEditableName
                        value={customName || w.name || w.sessionId || 'worker'}
                        onSave={(newVal) => {
                          try {
                            const m = JSON.parse(localStorage.getItem(storageKey) || '{}');
                            m[key] = newVal;
                            localStorage.setItem(storageKey, JSON.stringify(m));
                          } catch (e) {}
                          customNames[key] = newVal;
                        }}
                      />
                      <div className="text-xs text-secondary-text">{w.label || ''}</div>
                    </div>
                  </div>
                  <div className="small-mono font-semibold text-accent-gold">{w.hashRate ? formatHashrate(w.hashRate) : 'N/A'}</div>
                </div>

                <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-secondary-text">
                  <div>
                    <div className="text-[11px] text-secondary-text">Shares</div>
                    <div className="text-sm font-semibold text-green-400">{validShares ? formatNumber(validShares) : '0'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-secondary-text">Best</div>
                    <div className="text-sm font-semibold text-accent-gold">{bestDiff ? formatDifficulty(parseFloat(bestDiff)) : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-secondary-text">Uptime</div>
                    <div className="text-sm font-semibold text-secondary-text">{w.lastSeen ? formatUptime(null, w.lastSeen) : formatUptime(w.startTime, w.lastSeen)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-secondary-text">Last</div>
                    <div className="text-sm font-semibold text-secondary-text">{w.lastSeen ? new Date(w.lastSeen).toLocaleString() : '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
