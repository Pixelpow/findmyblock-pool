import React, { useState, useEffect, useRef } from 'react';
import './HolographicDisplay.css';

const HolographicDisplay = ({ stats, t }) => {
    const [timeSinceLastBlock, setTimeSinceLastBlock] = useState(0);
    const [isNewBlock, setIsNewBlock] = useState(false);
    const prevBlockHeightRef = useRef(stats.latestBlocks[0]?.height);
    const AVERAGE_BLOCK_TIME = 600; // 10 minutes

    useEffect(() => {
        const currentBlockHeight = stats.latestBlocks[0]?.height;
        if (prevBlockHeightRef.current && currentBlockHeight > prevBlockHeightRef.current) {
            setIsNewBlock(true);
            setTimeout(() => setIsNewBlock(false), 3000); // Glow for 3s
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

    const minutes = Math.floor(timeSinceLastBlock / 60);
    const seconds = timeSinceLastBlock % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return (
        <div className="holographic-container bg-space-black">
            <div className="scan-lines"></div>
            <div className="perspective-container">
                <div className="hologram-content">
                    <div className={`bitcoin-logo-container ${isNewBlock ? 'glow-pulse' : ''}`}>
                        <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg" 
                            alt="Bitcoin" 
                            className="bitcoin-logo"
                        />
                    </div>
                    <div className="ring-container">
                        <div className="ring ring-1"></div>
                        {/* Data particles can be added here */}
                    </div>
                    <div className="time-since-block">
                        <p className="text-hologram-cyan font-title">
                            {t('timeSinceLastBlock')}
                        </p>
                        <p className="text-bitcoin-orange text-2xl font-body">
                            {formattedTime}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HolographicDisplay;
