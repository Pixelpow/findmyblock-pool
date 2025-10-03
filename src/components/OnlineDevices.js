import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '../App';
import CardBase from './CardBase';

const formatDifficulty = (diff) => {
    if (typeof diff !== 'number' || isNaN(diff) || diff === 0) return 'N/A';
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

// Helper functions for localStorage persistence
const getStoredBestDiffs = () => {
    try {
        const stored = localStorage.getItem('onlineDevices_bestDiffs');
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        return {};
    }
};

const setStoredBestDiffs = (bestDiffs) => {
    try {
        localStorage.setItem('onlineDevices_bestDiffs', JSON.stringify(bestDiffs));
    } catch (e) {
        console.warn('Failed to save best difficulties to localStorage:', e);
    }
};

const getDeviceKey = (device) => {
    // Create a unique key based on userAgent (device type)
    const userAgent = (device.userAgent || 'unknown').toLowerCase().replace(/cgminer/gi, 'avalonnano3');
    return `device_${userAgent}`;
};

const OnlineDevices = ({ t }) => {
    const [devices, setDevices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [storedBestDiffs, setStoredBestDiffsState] = useState({});

    useEffect(() => {
        // Load stored best difficulties on component mount
        const stored = getStoredBestDiffs();
        setStoredBestDiffsState(stored);
    }, []);

    const updateBestDifficulties = useCallback((newDevices) => {
        const currentStored = getStoredBestDiffs();
        let updated = false;

        newDevices.forEach(device => {
            const deviceKey = getDeviceKey(device);
            const currentBest = parseFloat(device.bestDifficulty) || 0;
            const storedBest = parseFloat(currentStored[deviceKey]) || 0;

            if (currentBest > storedBest) {
                currentStored[deviceKey] = currentBest;
                updated = true;
            }
        });

        if (updated) {
            setStoredBestDiffs(currentStored);
            setStoredBestDiffsState(currentStored);
        }

        return currentStored;
    }, []);

    const fetchDeviceStats = useCallback(async () => {
        try {
            const response = await fetch('/api/info');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const fetchedDevices = data.userAgents || [];
            
            // Update best difficulties and merge with stored values
            const updatedBestDiffs = updateBestDifficulties(fetchedDevices);
            
            // Enhance devices with persistent best difficulties
            const enhancedDevices = fetchedDevices.map(device => {
                const deviceKey = getDeviceKey(device);
                const currentBest = parseFloat(device.bestDifficulty) || 0;
                const storedBest = parseFloat(updatedBestDiffs[deviceKey]) || 0;
                
                return {
                    ...device,
                    bestDifficulty: Math.max(currentBest, storedBest),
                    isStoredBest: storedBest > currentBest // Flag to indicate if we're showing stored value
                };
            });
            
            setDevices(enhancedDevices);
            setError(null);
        } catch (e) {
            console.error("Failed to fetch device stats:", e);
            setError("Could not load device statistics.");
        } finally {
            setIsLoading(false);
        }
    }, [updateBestDifficulties]);

    useEffect(() => {
        fetchDeviceStats();
        const interval = setInterval(fetchDeviceStats, 60000);
        return () => clearInterval(interval);
    }, [fetchDeviceStats]);

    // Function to clear stored best difficulties (for debugging/reset)
    const clearStoredBestDiffs = useCallback(() => {
        try {
            localStorage.removeItem('onlineDevices_bestDiffs');
            setStoredBestDiffsState({});
            fetchDeviceStats(); // Refresh to show current values only
        } catch (e) {
            console.warn('Failed to clear stored best difficulties:', e);
        }
    }, [fetchDeviceStats]);

    // Add to window for debugging purposes (can be removed in production)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.clearDeviceBestDiffs = clearStoredBestDiffs;
        }
    }, [clearStoredBestDiffs]);

    console.log('Devices with enhanced best difficulties:', devices);


    return (
        <div className="mt-8">
    <CardBase id="online-devices-card" className="p-6 bg-slate-950/60 tile-gold-glow">
                <div className="flex items-center border-b border-slate-700/50 mb-4 pb-4">
                    <h2 className="text-sm font-mono uppercase tracking-wide text-secondary-text flex items-center gap-3">
                        <Icon path="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" className="w-5 h-5 text-accent-gold icon-glow-accent-gold" />
                        <span className="font-semibold text-white">{t('onlineDevicesTitle')}</span>
                    </h2>
                </div>

                {isLoading ? (
                    <div className="text-center text-secondary-text">{t('loadingStatus')}</div>
                ) : error ? (
                    <div className="text-center text-red-500">{t('errorStatus')}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-slate-950/60 border border-slate-800/60 rounded-md divide-y divide-slate-800/60">
                            <thead className="bg-slate-900/60">
                                <tr>
                                    <th className="p-3 text-left text-xs font-semibold text-secondary-text uppercase tracking-wider font-mono">{t('deviceColumn')}</th>
                                    <th className="p-3 text-right text-xs font-semibold text-secondary-text uppercase tracking-wider font-mono">{t('currentlyWorkingColumn')}</th>
                                    <th className="p-3 text-right text-xs font-semibold text-secondary-text uppercase tracking-wider font-mono">{t('totalHashrateColumn')}</th>
                                    <th className="p-3 text-right text-xs font-semibold text-secondary-text uppercase tracking-wider font-mono">{t('bestDifficultyColumn')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {devices.map((device, index) => (
                                    <tr key={index} className="transition-colors duration-150">
                                        <td className="p-3 whitespace-nowrap text-primary-text">
                                            <div className="flex items-center">
                                                <span className="h-[6px] w-[6px] bg-yellow-400/75 rounded-full mr-3 flex-shrink-0 animate-pulse"></span>
                                                {(device.userAgent || t('unknownDevice')).replace(/cgminer/gi, 'AvalonNano3')}
                                            </div>
                                        </td>
                                        <td className="p-3 whitespace-nowrap text-right font-mono text-green-400">{parseInt(device.count, 10).toLocaleString()}</td>
                                        <td className="p-3 whitespace-nowrap text-right font-mono text-accent-gold text-glow-accent-gold-sm">{formatHashrate(parseFloat(device.totalHashRate))}</td>
                                        <td className="p-3 whitespace-nowrap text-right font-mono text-secondary-text">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className={device.isStoredBest ? "text-amber-400" : "text-secondary-text"}>
                                                    {formatDifficulty(parseFloat(device.bestDifficulty))}
                                                </span>
                                                {device.isStoredBest && (
                                                    <span 
                                                        title="Best difficulty from previous sessions (persisted locally)"
                                                        className="text-amber-400 text-xs"
                                                    >
                                                        💾
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardBase>
        </div>
    );
};

export default OnlineDevices;
