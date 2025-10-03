
import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../App'; // Assuming Icon and CardBase are exported from App.js or moved to a common file
import CardBase from './CardBase';
import { formatTimeToBlock } from '../App'; // Assuming formatTimeToBlock is exported from App.js

const NetworkAndMinerOverview = ({ t, stats, walletAddress, setWalletAddress, userStats, isUserStatsLoading, onWalletSubmit }) => {
    const [timeSinceLastBlock, setTimeSinceLastBlock] = useState(0);
    const [isNewBlock, setIsNewBlock] = useState(false);
    const prevBlockHeightRef = useRef(stats.latestBlocks[0]?.height);
    const AVERAGE_BLOCK_TIME = 600; // 10 minutes in seconds

    const [walletInput, setWalletInput] = useState(walletAddress);

    useEffect(() => {
        setWalletInput(walletAddress);
    }, [walletAddress]);

    useEffect(() => {
        const currentBlockHeight = stats.latestBlocks[0]?.height;
        if (prevBlockHeightRef.current && currentBlockHeight > prevBlockHeightRef.current) {
            setIsNewBlock(true);
            setTimeout(() => setIsNewBlock(false), 1500);
        }
        prevBlockHeightRef.current = currentBlockHeight;
    }, [stats.latestBlocks]);

    useEffect(() => {
        if (!stats.latestBlocks || stats.latestBlocks.length === 0) return;
        const lastBlockTimestamp = stats.latestBlocks[0].timestamp;
        const interval = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            const elapsed = now - lastBlockTimestamp;
            setTimeSinceLastBlock(elapsed > 0 ? elapsed : 0);
        }, 1000);
        return () => clearInterval(interval);
    }, [stats.latestBlocks]);

    const progress = Math.min((timeSinceLastBlock / AVERAGE_BLOCK_TIME) * 100, 100);
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    const minutes = Math.floor(timeSinceLastBlock / 60);
    const seconds = timeSinceLastBlock % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const blockSize = stats.blockTemplate ? stats.blockTemplate.size : 'N/A';
    const blockTransactions = stats.blockTemplate ? stats.blockTemplate.transactions : 'N/A';
    const blockReward = stats.blockTemplate ? stats.blockTemplate.totalReward : 'N/A';

    const SparkleBurst = () => {
        const sparks = Array.from({ length: 20 }).map((_, index) => {
            const angle = (index / 20) * 360;
            const distance = 50 + Math.random() * 50;
            const tx = Math.cos(angle * (Math.PI / 180)) * distance;
            const ty = Math.sin(angle * (Math.PI / 180)) * distance;
            return <div key={index} className="spark" style={{ '--tx': `${tx}px`, '--ty': `${ty}px`, animationDelay: `${Math.random() * 0.2}s` }} />;
        });
        return <div className="spark-burst-container">{sparks}</div>;
    };

    const MAX_BLOCK_SIZE_MB = 4; // Bitcoin block size limit is 4MB (witness data included)

    const Gauge = ({ label, value, maxValue, unit }) => {
        const percentage = Math.min((value / maxValue) * 100, 100);
        const displayValue = value === 'N/A' ? 'N/A' : `${value.toFixed(2)}${unit}`;
        return (
            <div className="w-full">
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <div className="w-full bg-slate-800 rounded-full h-2.5">
                    <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                </div>
                <p className="text-xs text-gray-300 mt-0.5 text-right">{displayValue}</p>
            </div>
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (walletInput.trim()) {
            onWalletSubmit(walletInput.trim());
        }
    };

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

    return (
        <div className="my-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                {/* Left Column: Animation & Block Details */}
                <CardBase className={`p-4 text-center h-full flex flex-col justify-center items-center relative overflow-hidden animated-radial-gradient ${isNewBlock ? 'new-block-flash' : ''}`}>
                    <h2 className="text-xl font-semibold text-white font-title mb-3 z-10">Mining Block</h2>
                    <div className="relative w-32 h-32 mx-auto z-10">
                        {isNewBlock && <SparkleBurst />}
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r={radius} className="stroke-slate-800" strokeWidth="5" fill="transparent" />
                            <circle cx="50" cy="50" r={radius} className="stroke-amber-400 transition-all duration-1000" strokeWidth="5" fill="transparent" strokeLinecap="round" transform="rotate(-90 50 50)" style={{ strokeDasharray: circumference, strokeDashoffset: isNewBlock ? circumference : offset }} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg" alt="Bitcoin Logo" className={`h-12 w-12 ${!isNewBlock ? 'pulsing-logo' : ''}`} />
                        </div>
                    </div>
                    <p className="text-gray-400 text-xs mt-1 z-10">{t('timeSinceLastBlock')}</p>
                    <p className="text-2xl font-semibold text-white font-mono tracking-wider mb-3 z-10">{isNewBlock ? '00:00' : formattedTime}</p>

                    {/* Block Details integrated below animation */}
                    <div className="mt-4 w-full">
                        <h3 className="text-lg font-semibold text-white font-title mb-3">Block Details</h3>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <p className="text-gray-500 text-xs">{t('blockSize')}</p>
                                <p className="font-semibold text-gray-200 text-base">{blockSize} MB</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">{t('transactions')}</p>
                                <p className="font-semibold text-gray-200 text-base">{blockTransactions}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">{t('blockReward')}</p>
                                <p className="font-semibold text-gray-200 text-base">{blockReward} BTC</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">{t('networkDifficulty')}</p>
                                <p className="font-semibold text-gray-200 text-base">{stats.network.difficulty}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">{t('halvingIn')}</p>
                                <p className="font-semibold text-gray-200 text-base">{stats.network.halvingIn}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">{t('adjustmentIn')}</p>
                                <p className="font-semibold text-gray-200 text-base">{stats.network.adjustmentIn}</p>
                            </div>
                        </div>
                        <div className="mt-4 space-y-3">
                            <Gauge
                                label="Time to next block"
                                value={timeSinceLastBlock / 60}
                                maxValue={AVERAGE_BLOCK_TIME / 60}
                                unit="min"
                            />
                            <Gauge
                                label="Block Size Progress"
                                value={parseFloat(blockSize)}
                                maxValue={MAX_BLOCK_SIZE_MB}
                                unit="MB"
                            />
                        </div>
                    </div>
                </CardBase>

                {/* Right Column: Wallet Input / Miner Profile Summary */}
                <CardBase className="p-4 h-full flex flex-col justify-between">
                    {!walletAddress ? (
                        <form onSubmit={handleSubmit} className="w-full flex flex-col h-full justify-center items-center p-4">
                            <h3 className="text-xl font-semibold text-white font-title mb-4">
                                {t('enterWalletPrompt')}
                            </h3>
                            <input
                                type="text"
                                value={walletInput}
                                onChange={(e) => setWalletInput(e.target.value)}
                                placeholder={t('walletPlaceholder')}
                                className="w-full bg-slate-800/70 border-slate-700 text-white placeholder-gray-500 rounded-md shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition px-4 py-2 mb-4"
                            />
                            <button
                                type="submit"
                                disabled={isUserStatsLoading}
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-black bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
                            >
                                {isUserStatsLoading ? (
                                    <Icon path="M16.023 9.348h4.992v-.001a7.5 7.5 0 00-1.544-4.397l-3.448 3.448z M19.5 10.5v-1.5a7.5 7.5 0 00-4.397-1.544l3.448 3.448zM12 21a9 9 0 100-18 9 9 0 000 18z" className="animate-spin w-5 h-5 mr-2"/>
                                ) : (
                                    <Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" className="w-5 h-5 mr-2" />
                                )}
                                {t('view')}
                            </button>
                        </form>
                    ) : (
                        <div className="flex flex-col h-full justify-center items-center p-4">
                            <h3 className="text-xl font-semibold text-white font-title mb-4">
                                {t('myMiningStats')}
                            </h3>
                            {isUserStatsLoading ? (
                                <div className="space-y-4 w-full">
                                    <div className="h-8 bg-slate-800 rounded-md animate-pulse w-3/4 mx-auto"></div>
                                    <div className="h-6 bg-slate-800 rounded-md animate-pulse w-1/2 mx-auto"></div>
                                    <div className="h-6 bg-slate-800 rounded-md animate-pulse w-2/3 mx-auto"></div>
                                </div>
                            ) : userStats ? (
                                <div className="text-center space-y-4">
                                    <p className="text-4xl font-bold font-title text-amber-400 text-glow-amber tracking-wider">{userStats.hashrate}</p>
                                    <p className="text-lg text-gray-400">{t('workersActive')}: <span className="font-bold text-white">{userStats.workersActive}</span></p>
                                    <p className="text-lg text-gray-400">{t('bestDifficulty')}: <span className="font-bold text-white">{formatDifficulty(userStats.bestDifficulty)}</span></p>
                                    <button
                                        onClick={() => setWalletAddress('')}
                                        className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-gray-500"
                                    >
                                        {t('changeWallet')}
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <h3 className="text-xl font-semibold text-amber-400 font-title">Miner Not Found</h3>
                                    <p className="text-gray-400 mt-2">
                                        No active or past workers found for this address.
                                    </p>
                                    <button
                                        onClick={() => setWalletAddress('')}
                                        className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-gray-500"
                                    >
                                        {t('tryAnotherAddress')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </CardBase>
            </div>
        </div>
    );
};

export default NetworkAndMinerOverview;
