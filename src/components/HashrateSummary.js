import React from 'react';

// Compact Hashrate Summary
// Props:
// - totalHashrate (string)
// - workersActive (number|string)
// - bestDifficulty (string)
// - estTimeToBlock (string)
// - sparklineData (array of numbers) optional
// - status ('active'|'idle'|'no-data') optional

const Sparkline = ({ data = [] }) => {
  // Very small inline sparkline using SVG. If no data, show placeholder.
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="w-24 h-6 bg-slate-800 rounded" />;
  }
  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = max === min ? 50 : 100 - ((v - min) / (max - min)) * 100;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-24 h-6">
      <polyline fill="none" stroke="#F59E0B" strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const statusConfig = {
  active: { text: 'Active', color: 'bg-green-600' },
  idle: { text: 'Idle', color: 'bg-yellow-500' },
  'no-data': { text: 'No data', color: 'bg-gray-600' },
};

export default function HashrateSummary({ totalHashrate = 'N/A', workersActive = 'N/A', bestDifficulty = 'N/A', estTimeToBlock = 'N/A', sparklineData = [], status = 'no-data', compact = false, distanceToNetwork = 'N/A' }) {
  const s = statusConfig[status] || statusConfig['no-data'];

  // Compact mode: render a tight, stacked layout suitable for the wallet panel.
    if (compact) {
    return (
      <div className="wallet-hashpanel flex items-center justify-between">
        <div className="flex-shrink-0">
          <div className="kpi-compact-total font-extrabold text-accent-gold">{totalHashrate}</div>
        </div>

        <div className="ml-2 w-full">
          <div className="grid grid-cols-2 gap-0.5 items-center">
            <div className="text-[9px] text-secondary-text">Est</div>
            <div className="text-right"><span className="kpi-compact">{estTimeToBlock}</span></div>

            <div className="text-[9px] text-secondary-text">Best</div>
            <div className="text-right"><span className="kpi-compact">{bestDifficulty}</span></div>

            <div className="text-[9px] text-secondary-text">Workers</div>
            <div className="text-right"><span className="kpi-compact">{workersActive}</span></div>

            <div className="text-[9px] text-secondary-text">Distance</div>
            <div className="text-right"><span className="kpi-compact">{distanceToNetwork}</span></div>
          </div>
        </div>

        <div className="ml-2 flex items-center gap-1">
          <div className="w-16 h-8">
            <Sparkline data={sparklineData} />
          </div>
          <div className={`px-2 py-0.5 text-[10px] rounded ${s.color} text-black`}>{s.text}</div>
        </div>
      </div>
    );
  }

  // Default (non-compact) rendering — larger, more spaced presentation
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-baseline gap-4">
              <div className="text-lg md:text-xl font-mono font-extrabold text-accent-gold">{totalHashrate}</div>
              <div className="text-xs md:text-sm text-secondary-text">Total</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Sparkline data={sparklineData} />
        <div className={`px-2 py-1 text-xs rounded ${s.color} text-black`}>{s.text}</div>
      </div>
    </div>
  );
}
