import React from 'react';
import UserHashrateChart from './UserHashrateChart';

// Assuming Icon and other utils are available
export const Icon = ({ path, className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

const formatHashrate = (hashrate) => {
    if (hashrate === null || isNaN(hashrate)) return 'N/A';
    const units = ['H/s', 'kH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s'];
    let i = 0;
    while (hashrate >= 1000 && i < units.length - 1) {
        hashrate /= 1000;
        i++;
    }
    return hashrate.toFixed(2) + ' ' + units[i];
};

const formatDifficulty = (diff) => {
    if (typeof diff !== 'number' || isNaN(diff)) return 'N/A';
    const units = ['', 'K', 'M', 'G', 'T', 'P', 'E'];
    let i = 0;
    while (diff >= 1000 && i < units.length - 1) {
            diff /= 1000;
            i++;
    }
    return diff.toFixed(2) + units[i];
}

const formatUptime = (startTime) => {
    if (!startTime) return 'N/A';
    const now = new Date();
    const start = new Date(startTime);
    let seconds = Math.floor((now - start) / 1000);
    if (seconds < 0) seconds = 0;

    const d = Math.floor(seconds / (3600*24));
    seconds  -= d*3600*24;
    const h = Math.floor(seconds / 3600);
    seconds  -= h*3600;
    const m = Math.floor(seconds / 60);

    let uptimeString = '';
    if (d > 0) uptimeString += d + 'd ';
    if (h > 0) uptimeString += h + 'h ';
    if (m > 0) uptimeString += m + 'm';
    if (uptimeString === '') return '< 1m';

    return uptimeString.trim();
};


const WorkerDetailModal = ({ worker, onClose, t }) => {
    if (!worker) return null;

    const workerHistory = JSON.parse(localStorage.getItem(`hashrateHistory_worker_${worker.sessionId}`)) || [];
    const workerName = localStorage.getItem('workerAlias_' + worker.sessionId) || worker.name || 'worker-' + worker.sessionId.substring(0, 6);

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-dark-blue-card border border-dark-blue-border rounded-lg shadow-2xl w-full max-w-3xl m-4 animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-800">
                    <h2 className="text-xl font-semibold text-primary-text font-title flex items-center">
                        <Icon path="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L12 15.25l5.571-3" className="w-6 h-6 mr-3 text-accent-gold"/>
                        {workerName}
                    </h2>
                    <button onClick={onClose} className="text-secondary-text hover:text-white">
                        <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
                        <div className="bg-slate-900/50 p-3 rounded-lg">
                            <p className="text-sm text-secondary-text font-title">Hashrate Actuel</p>
                            <p className="text-2xl font-bold text-accent-gold text-glow-accent-gold">{formatHashrate(worker.hashRate)}</p>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-lg">
                            <p className="text-sm text-secondary-text font-title">Meilleure Difficulté</p>
                            <p className="text-2xl font-bold text-primary-text">{formatDifficulty(worker.bestDifficulty)}</p>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-lg">
                            <p className="text-sm text-secondary-text font-title">Uptime</p>
                            <p className="text-2xl font-bold text-primary-text">{formatUptime(worker.startTime)}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-primary-text mb-2 font-title">Historique du Hashrate (24h)</h3>
                        <div className="bg-slate-950/50 rounded-lg p-2">
                            <UserHashrateChart data={workerHistory} height={250} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkerDetailModal;
