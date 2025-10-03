import React from 'react';

const CardBase = ({ children, className }) => (
    <div className={`bg-slate-900/70 backdrop-blur-md border border-slate-700/50 shadow-lg shadow-black/20 transition-all duration-300 hover:bg-slate-900/80 hover:shadow-2xl hover:shadow-amber-500/10 hover:border-amber-500/50 rounded-lg ${className}`}>
        {children}
    </div>
);

export default CardBase;