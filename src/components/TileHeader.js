import React from "react";

// Premium tile header: title, optional badge, drag handle, actions
export default function TileHeader({
  title,
  badge,
  right,
  className = ""
}) {
  return (
    <div className={`flex items-center justify-between mb-2 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="title-font text-lg font-semibold text-amber-600 drop-shadow-sm">
          {title}
        </span>
        {badge && (
          <span className="ml-2 px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs font-medium">
            {badge}
          </span>
        )}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
