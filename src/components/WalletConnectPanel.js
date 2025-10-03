import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from './Icon';
import HashrateSummary from './HashrateSummary';
import WorkerList from './WorkerList';

const useUserStats = (walletAddress, networkDifficulty) => {
  const [userStats, setUserStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [rawApiResponse, setRawApiResponse] = useState(null);

    const fetchUserStats = useCallback(async (isBackground = false) => {
        if (!walletAddress) {
            setUserStats(null);
            return;
        }
        if (!isBackground) {
            setIsLoading(true);
        }
    try {
      // First, try our local pool API which should reflect immediate pool-side activity
      let response = null;
      let text = '';
      let data = {};
      try {
        const localUrl = `/api/client/${walletAddress}`;
        response = await fetch(localUrl);
        if (response && response.ok) {
          text = await response.text();
          setRawApiResponse(text);
          try { data = JSON.parse(text); } catch (e) { data = {}; }
        }
      } catch (localErr) {
        // ignore local API errors and fall back to external service
        response = null;
      }

      // If local API didn't produce usable data, fall back to findmyblock.xyz
      const hasWorkers = data && (Array.isArray(data.workers) ? data.workers.length > 0 : !!data.workersCount);
      if (!response || !response.ok || !hasWorkers) {
        try {
          const externalUrl = `https://findmyblock.xyz/api/client/${walletAddress}`;
          const extRes = await fetch(externalUrl);
          if (extRes && extRes.ok) {
            text = await extRes.text();
            setRawApiResponse(text);
            try { data = JSON.parse(text); } catch (e) { data = {}; }
          } else {
            // capture body for debugging
            let body = '';
            try { body = await extRes.text(); } catch (e) { body = ''; }
            const msg = `HTTP ${extRes ? extRes.status : 'ERR'}${body ? `: ${body}` : ''}`;
            setLastError(msg);
            setUserStats(null);
            throw new Error(msg);
          }
        } catch (extErr) {
          // If external failed and we had no local data, rethrow to be handled below
          if (!data || (((!Array.isArray(data.workers) || data.workers.length === 0)) && !data.workersCount)) {
            throw extErr;
          }
        }
      } else {
        // clear previous error if local succeeded
        setLastError(null);
      }

            // Handle localStorage for best difficulty
            const storageKey = `bestDifficulty_${walletAddress}`;
            const storedBestDifficulty = parseFloat(localStorage.getItem(storageKey)) || 0;
            const apiBestDifficulty = parseFloat(data.bestDifficulty) || 0;

            if (apiBestDifficulty > storedBestDifficulty) {
                localStorage.setItem(storageKey, apiBestDifficulty.toString());
                data.bestDifficulty = apiBestDifficulty;
            } else {
                data.bestDifficulty = storedBestDifficulty;
            }
            
      // Compute additional fields expected by the UI
      const totalHashrate = Array.isArray(data.workers)
        ? data.workers.reduce((sum, w) => sum + (w.hashRate || 0), 0)
        : 0;
      const workersActive = data.workersCount || (Array.isArray(data.workers) ? data.workers.length : 0);

      const estimatedTimeSecondsUser = (networkDifficulty && totalHashrate > 0)
        ? (networkDifficulty * Math.pow(2, 32)) / totalHashrate
        : 0;
      const estTimeToBlock = formatTimeToBlock(estimatedTimeSecondsUser);

      const distanceToNetwork = (networkDifficulty && apiBestDifficulty > 0)
        ? `1 in ${formatDifficulty(networkDifficulty / apiBestDifficulty)}`
        : 'N/A';
      const hashrate = totalHashrate > 0 ? formatHashrate(totalHashrate) : 'N/A';

      // Persist per-worker metadata (bestDifficulty, startTime) so values survive reloads
      let processedWorkers = data.workers;
      try {
        if (Array.isArray(data.workers)) {
          processedWorkers = data.workers.map((w, idx) => {
            // Prefer an API-provided stable workerId when available, then name, then sessionId
            const workerId = w.workerId || w.name || w.sessionId || `worker_${idx}`;
            const metaKey = `workerMeta_${walletAddress}_${workerId}`;
            let storedMeta = {};
            try { storedMeta = JSON.parse(localStorage.getItem(metaKey) || '{}'); } catch (e) { storedMeta = {}; }

            // Persist best difficulty per worker — keep the max of API and stored
            const apiBest = parseFloat(w.bestDifficulty || w.bestDiff || w.best);
            const storedBest = parseFloat(storedMeta.bestDifficulty);
            const apiBestNum = isNaN(apiBest) ? 0 : apiBest;
            const storedBestNum = isNaN(storedBest) ? 0 : storedBest;
            const bestToStore = apiBestNum > storedBestNum ? apiBestNum : storedBestNum;
            // Always store the best known value (0 won't be stored)
            if (bestToStore && bestToStore > 0) storedMeta.bestDifficulty = bestToStore;

            // Preserve or infer startTime so uptime doesn't reset on refresh
            // Prefer the first-seen startTime: do not overwrite storedMeta.startTime once set
            if (storedMeta.startTime) {
              // restore previously saved startTime
              w.startTime = storedMeta.startTime;
            } else if (w.startTime) {
              // persist API-provided startTime only if we don't already have one
              storedMeta.startTime = w.startTime;
            } else if (w.lastSeen && (Date.now() - new Date(w.lastSeen).getTime()) < 3 * 60 * 1000) {
              // If worker is currently active but no startTime provided, set an inferred start now
              storedMeta.startTime = new Date().toISOString();
              w.startTime = storedMeta.startTime;
            }

            // Ensure we persist the meta back (this also stores inferred startTime)
            try { localStorage.setItem(metaKey, JSON.stringify(storedMeta)); } catch (e) { /* ignore storage errors */ }

            // Ensure worker object contains persisted bestDifficulty (prefer stored if it's greater)
            const finalBest = (parseFloat(w.bestDifficulty) || 0) < (parseFloat(storedMeta.bestDifficulty) || 0)
              ? storedMeta.bestDifficulty
              : (w.bestDifficulty || storedMeta.bestDifficulty);
            if (finalBest) w.bestDifficulty = finalBest;
            return { ...w };
          });
        }
      } catch (err) {
        console.warn('Worker metadata processing failed', err);
        processedWorkers = data.workers;
      }

      // If the API returned a payload but workers is empty, preserve rawApiResponse for diagnostics
      setUserStats({
                ...data,
                workers: processedWorkers,
                hashrate,
                rawHashrate: totalHashrate,
                estTimeToBlock,
                distanceToNetwork,
                workersActive,
                walletAddress,
            });
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
      if (!lastError) setLastError(error && error.message ? error.message : String(error));
      setUserStats(null); // Ensure stats are cleared on any error
        } finally {
            if (!isBackground) {
                setIsLoading(false);
            }
        }
  }, [walletAddress, networkDifficulty, lastError]);

    useEffect(() => {
        if (walletAddress) {
            fetchUserStats(false); // Initial fetch
            const interval = setInterval(() => fetchUserStats(true), 10000);
            return () => clearInterval(interval);
        } else {
            setUserStats(null);
        }
    }, [walletAddress, fetchUserStats, networkDifficulty]);

  return { userStats, isLoading, lastError, rawApiResponse };
};

const WalletConnectPanel = ({ t, onWalletSubmit, walletAddress }) => {
  const [walletInput, setWalletInput] = useState('');
  const { userStats, isLoading, lastError, rawApiResponse } = useUserStats(walletAddress);
  const handleSubmit = (e) => { 
    e.preventDefault(); 
    if (walletInput.trim()) onWalletSubmit(walletInput.trim()); 
  };

  return (
    <CardBase>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white font-title mb-4">Connect your wallet</h3>
        <form onSubmit={handleSubmit} className="flex group">
          <input type="text" value={walletInput} onChange={(e) => setWalletInput(e.target.value)} placeholder={t('walletPlaceholder')} className="w-full bg-slate-800/70 border-slate-700 text-white placeholder-gray-500 rounded-l-md shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition px-4 py-2" />
          <button type="submit" disabled={isLoading} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-black bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500 disabled:bg-slate-600 disabled:cursor-not-allowed">
            {isLoading ? <Icon path="M16.023 9.348h4.992v-.001a7.5 7.5 0 00-1.544-4.397l-3.448 3.448z M19.5 10.5v-1.5a7.5 7.5 0 00-4.397-1.544l3.448 3.448zM12 21a9 9 0 100-18 9 9 0 000 18z" className="animate-spin w-5 h-5"/> : <Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />}
          </button>
        </form>
      </div>
      {userStats && (
        <div className="p-4 border-t border-slate-700">
          <h3 className="text-lg font-semibold text-white font-title mb-4">My Stats</h3>
          <HashrateSummary
            totalHashrate={userStats.hashrate}
            workersActive={userStats.workersActive}
            bestDifficulty={formatDifficulty(userStats.bestDifficulty)}
            estTimeToBlock={userStats.estTimeToBlock}
            distanceToNetwork={userStats.distanceToNetwork}
            compact={true}
            sparklineData={(() => {
              try {
                const key = 'hashrateHistory_' + userStats.walletAddress;
                const raw = localStorage.getItem(key);
                if (!raw) return [];
                const arr = JSON.parse(raw || '[]');
                // Normalize shape if needed and map to hashrate
                return arr.slice(-24).map(r => r.hashrate || r.value || 0);
              } catch (e) { return []; }
            })()}
            status={(userStats.rawHashrate && userStats.rawHashrate > 0) ? 'active' : 'no-data'}
          />

          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-secondary-text">Workers</div>
            </div>
            <WorkerList workers={userStats.workers || []} walletAddress={userStats.walletAddress} />
          </div>
        </div>
      )}
      {/* Dev-only debug tools: append ?dev=true to the URL to see these */}
      {new URLSearchParams(window.location.search).get('dev') === 'true' && (
        <div className="p-4 border-t border-dashed border-slate-700 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <button className="px-2 py-1 bg-slate-800 rounded text-xs" onClick={async () => {
              try {
                const l = await fetch(`/api/client/${walletAddress}`);
                const localText = await l.text();
                const e = await fetch(`https://findmyblock.xyz/api/client/${walletAddress}`);
                const extText = await e.text();
                // show in alert for quick debugging
                alert(`LOCAL:\n${localText}\n\nEXTERNAL:\n${extText}`);
              } catch (err) {
                alert('Debug fetch failed: ' + (err && err.message));
              }
            }}>Debug fetch raw APIs</button>
            <div className="text-xs text-gray-400">(dev only)</div>
          </div>
        </div>
      )}
      {!userStats && lastError && (
        <div className="p-4 border-t border-slate-700 text-sm text-gray-300">
          <h4 className="text-lg font-semibold text-amber-400 font-title">Miner Not Found</h4>
          <p className="mt-2">No active or past workers found for this address.</p>
              <div className="mt-3 flex items-start gap-3">
                <pre className="flex-1 p-2 bg-slate-800 rounded text-xs overflow-auto">{`Address: ${walletAddress}\nAPI: https://findmyblock.xyz/api/client/${walletAddress}\nResponse: ${lastError}`}</pre>
                <div className="flex flex-col gap-2">
                  <button
                    title="Clear saved address"
                    onClick={() => {
                      try { localStorage.removeItem('solo_pool_wallet'); } catch (e) {}
                      // dispatch event the App listens for to clear state
                      const ev = new CustomEvent('walletClear');
                      window.dispatchEvent(ev);
                      setWalletInput('');
                    }}
                    className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-gray-200"
                  >
                    {/* simple X icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                  <div className="text-xs text-gray-400">Clear</div>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-400">Please ensure your miner is configured to use this pool and has submitted shares. You can also open the API URL in a browser to inspect the response.</p>
        </div>
      )}
      {!userStats && !lastError && rawApiResponse && (
        <div className="p-4 border-t border-slate-700 text-sm text-gray-300">
          <h4 className="text-lg font-semibold text-amber-400 font-title">No workers returned</h4>
          <p className="mt-2">The API returned a payload but no workers were found for this address. Raw API response shown below for debugging.</p>
          <pre className="mt-3 p-2 bg-slate-800 rounded text-xs overflow-auto">{rawApiResponse}</pre>
          <p className="mt-2 text-xs text-gray-400">If you believe this is incorrect, open the API URL in a browser to inspect the JSON manually.</p>
        </div>
      )}
    </CardBase>
  );
};

const CardBase = ({ children, className }) => (
    <div className={`bg-slate-900/70 backdrop-blur-md border border-slate-700/50 shadow-lg shadow-black/20 transition-all duration-300 hover:bg-slate-900/80 hover:shadow-2xl hover:shadow-amber-500/10 hover:border-amber-500/50 rounded-lg ${className}`}>
        {children}
    </div>
);

// ...existing code...

const formatDifficulty = (diff) => {
        if (typeof diff !== 'number' || isNaN(diff)) return 'N/A';
        const units = ['', 'K', 'M', 'G', 'T', 'P', 'E'];
        let i = 0;
        while (diff >= 1000 && i < units.length - 1) {
                diff /= 1000;
                i++;
        }
        return `${diff.toFixed(2)}${units[i]}`;
}

const formatHashrate = (hashrate) => {
    if (hashrate === null || isNaN(hashrate)) return 'N/A';
    const units = ['H/s', 'kH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s'];
    let i = 0;
    while (hashrate >= 1000 && i < units.length - 1) {
        hashrate /= 1000;
        i++;
    }
    return `${hashrate.toFixed(2)} ${units[i]}`;
};

const formatTimeToBlock = (seconds) => {
    if (isNaN(seconds) || seconds <= 0) return 'N/A';

    const minutes = seconds / 60;
    const hours = minutes / 60;
    const days = hours / 24;
    const years = days / 365.25; // Account for leap years

    if (years >= 1) {
        return `${years.toFixed(1)} years`;
    } else if (days >= 1) {
        return `${days.toFixed(1)} days`;
    } else if (hours >= 1) {
        return `${hours.toFixed(1)} hours`;
    } else if (minutes >= 1) {
        return `${minutes.toFixed(1)} minutes`;
    } else {
        return `${seconds.toFixed(0)} seconds`;
    }
};

export default WalletConnectPanel;