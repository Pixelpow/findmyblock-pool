import React from 'react';
import './LatestBlocksList.css';

const formatAge = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp * 1000);
    const seconds = Math.floor((now - past) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
};

const LatestBlocksList = ({ stats }) => {
    const latestBlock = stats.latestBlocks[0];
    const otherBlocks = stats.latestBlocks.slice(1, 11);

    return (
        <div className="latest-blocks-container">
            <h3 className="text-xl font-semibold text-primary-text font-title mb-4">Latest Blocks</h3>
            {latestBlock && (
                <div className="latest-block-highlight">
                    <a href={`https://mempool.space/block/${latestBlock.id}`} target="_blank" rel="noopener noreferrer" className="block-height">
                        #{latestBlock.height.toLocaleString()}
                    </a>
                    <span className="block-age">{formatAge(latestBlock.timestamp)}</span>
                    <span className="block-finder">{latestBlock.finder}</span>
                </div>
            )}
            <div className="other-blocks-list">
                {otherBlocks.map(block => (
                    <div key={block.id} className="block-row">
                        <a href={`https://mempool.space/block/${block.id}`} target="_blank" rel="noopener noreferrer" className="block-height-small">
                            #{block.height.toLocaleString()}
                        </a>
                        <span className="block-age-small">{formatAge(block.timestamp)}</span>
                        <span className="block-finder-small">{block.finder}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LatestBlocksList;
