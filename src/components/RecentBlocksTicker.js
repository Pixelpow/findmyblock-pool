import React, { useEffect, useRef } from 'react';

const RecentBlocksTicker = ({ latest, compact = false, showLabel = true }) => {
    const viewportRef = useRef(null);
    const trackRef = useRef(null);

    useEffect(() => {
        const track = trackRef.current;
        const viewport = viewportRef.current;
        if (!track) return;

        // Determine available viewport width: prefer explicit viewport, fallback to parent or window
        const viewportWidth = (viewport && viewport.clientWidth) || (track.parentElement && track.parentElement.clientWidth) || window.innerWidth || 600;

        // ensure items are duplicated in DOM; duration proportional to content width relative to viewport
        const totalWidth = track.scrollWidth || 0;
        // scale duration so wider content scrolls longer; keep it smooth and not too fast
        const proportional = Math.floor((totalWidth / Math.max(1, viewportWidth)) * 12);
        const duration = Math.max(10, proportional); // seconds
        track.style.animationDuration = `${duration}s`;
    }, [latest]);

    if (!latest || latest.length === 0) {
        return <span className="text-xs text-secondary-text">N/A</span>;
    }

    const items = latest.slice(0, compact ? 4 : 6); // fewer items in compact mode
    const duplicated = [...items, ...items];

    // When the parent already renders the label inline (showLabel=false), return only the track so the parent
    // can place it inside its own viewport. Otherwise return the full row with label + viewport.
    const track = (
        <div className="recent-inline-track" ref={trackRef}>
            {duplicated.map((b, i) => {
                const minutesAgo = Math.floor((Date.now() - (b.timestamp * 1000)) / 60000);
                return (
                    <a key={i} href={`https://mempool.space/block/${b.id}`} className="recent-inline-item" target="_blank" rel="noreferrer">
                        <span className="recent-inline-pool small-gold-stat truncate">{b.finder || 'unknown'}</span>
                        <span className="recent-inline-minutes text-white font-mono">{minutesAgo}m</span>
                    </a>
                );
            })}
        </div>
    );

    if (!showLabel) {
        return track;
    }

    return (
        <div className="recent-inline-row">
            <div className="recent-inline-label">Recent blocks:</div>
            <div className="recent-inline-viewport" ref={viewportRef}>
                {track}
            </div>
        </div>
    );
};

export default RecentBlocksTicker;
