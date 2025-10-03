import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { formatHashrate } from '../App'; // Assuming formatHashrate is exported from App.js or a utility file

const timeframes = [
    { label: '30m', value: 30 * 60 * 1000 },
    { label: '1h', value: 60 * 60 * 1000 },
    { label: '3h', value: 3 * 60 * 60 * 1000 },
    { label: '6h', value: 6 * 60 * 60 * 1000 },
    { label: '12h', value: 12 * 60 * 60 * 1000 },
    { label: '24h', value: 24 * 60 * 60 * 1000 },
    { label: '7d', value: 7 * 24 * 60 * 60 * 1000, disabled: true }, // Disabled for now
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 p-2 rounded-md shadow-lg">
                <p className="text-sm text-secondary-text">{`${new Date(label).toLocaleTimeString()}`}</p>
                <p className="text-base font-semibold text-accent-gold">{`Hashrate: ${formatHashrate(payload[0].value)}`}</p>
            </div>
        );
    }
    return null;
};

const UserHashrateChart = ({ history, selectedTimeframe, setSelectedTimeframe }) => {
    const data = history.map(item => ({
        ...item,
        hashrate: parseFloat(item.hashrate) || 0,
    }));

    const tickFormatter = (timestamp) => {
        const date = new Date(timestamp);
        if (selectedTimeframe <= 60 * 60 * 1000) { // 1h or less
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        if (selectedTimeframe <= 24 * 60 * 60 * 1000) { // 24h or less
            return date.toLocaleTimeString([], { hour: 'numeric' });
        }
        return date.toLocaleDateString();
    };

    return (
        <div className="mt-6 p-4 bg-dark-blue-card/70 backdrop-blur-md border border-dark-blue-border/50 shadow-lg rounded-lg">
            <div className="flex justify-end mb-4">
                <div className="inline-flex rounded-md shadow-sm bg-slate-800/50 p-1">
                    {timeframes.map(tf => (
                        <button
                            key={tf.label}
                            onClick={() => !tf.disabled && setSelectedTimeframe(tf.value)}
                            disabled={tf.disabled}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                selectedTimeframe === tf.value
                                    ? 'text-black bg-amber-400'
                                    : 'text-secondary-text hover:bg-slate-700'
                            } ${tf.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {tf.label}
                        </button>
                    ))}
                </div>
            </div>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <LineChart
                        data={data}
                        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                        <XAxis 
                            dataKey="timestamp" 
                            tickFormatter={tickFormatter} 
                            stroke="#9ca3af"
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                            tickFormatter={(value) => formatHashrate(value).replace(' H/s', '')} 
                            stroke="#9ca3af"
                            tick={{ fontSize: 12 }}
                            domain={['dataMin', 'dataMax']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <defs>
                            <linearGradient id="colorHashrate" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#FBBF24" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="hashrate" stroke="#FBBF24" fillOpacity={1} fill="url(#colorHashrate)" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default UserHashrateChart;