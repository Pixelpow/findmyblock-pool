import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatXAxis = (tickItem) => {
    // Format timestamp to HH:MM
    return new Date(tickItem).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

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

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 p-3 rounded-lg shadow-lg">
                <p className="text-sm text-gray-300">{`${new Date(label).toLocaleString('en-US')}`}</p>
                <p className="text-lg font-bold text-amber-400">{`Hashrate: ${formatHashrate(payload[0].value)}`}</p>
            </div>
        );
    }
    return null;
};

const CustomXAxisTick = (props) => {
    const { x, y, payload } = props;
    const date = new Date(payload.value);
    const minutes = date.getMinutes();

    // Only show label for every 15 minutes, and a dot for all 15-minute marks
    const showLabel = minutes % 15 === 0;

    return (
        <g transform={`translate(${x},${y})`}>
            {showLabel && (
                <text x={0} y={10} dy={16} textAnchor="middle" fill="#94A3B8" fontSize="12px">
                    {formatXAxis(payload.value)}
                </text>
            )}
            {minutes % 15 === 0 && (
                <circle cx={0} cy={0} r={3} fill="#FBBF24" />
            )}
        </g>
    );
};

const HashrateChart = ({ data }) => {
    const ticks = useMemo(() => {
        if (!data || data.length === 0) return [];

        const startTimestamp = data[0].timestamp;
        const endTimestamp = data[data.length - 1].timestamp;
        const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
        const generatedTicks = [];

        // Start from the first 15-minute mark after the startTimestamp
        let currentTick = Math.ceil(startTimestamp / fifteenMinutes) * fifteenMinutes;

        while (currentTick <= endTimestamp) {
            generatedTicks.push(currentTick);
            currentTick += fifteenMinutes;
        }
        return generatedTicks;
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <div className="text-center text-gray-500 py-10">
                Not enough data to display the chart. Tracking starts now.
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart
                data={data}
                margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                }}
            >
                <defs>
                    <linearGradient id="colorHashrate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#FBBF24" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatXAxis} 
                    stroke="#94A3B8" 
                    minTickGap={80} 
                    ticks={ticks}
                    tick={<CustomXAxisTick />}
                />
                <YAxis tickFormatter={(val) => formatHashrate(val)} stroke="#94A3B8" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="hashrate" stroke="#FBBF24" fillOpacity={1} fill="url(#colorHashrate)" />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default HashrateChart;
