import React from 'react';
import { cn } from '../../lib/utils';

export default function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  color = 'blue',
  className,
}) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className={cn('card p-5 transition-shadow hover:shadow-md', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={cn('p-2.5 rounded-xl', colorStyles[color] || colorStyles.blue)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
        {(subtext || trend) && (
          <div className="flex items-center gap-1.5 mt-1">
            {trend && (
              <span
                className={cn(
                  'text-xs font-semibold',
                  trend > 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend > 0 ? `+${trend}%` : `${trend}%`}
              </span>
            )}
            {subtext && <span className="text-xs text-gray-500">{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
