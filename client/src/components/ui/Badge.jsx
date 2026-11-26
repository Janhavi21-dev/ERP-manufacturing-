import React from 'react';
import { cn, statusColor, COLOR_MAP } from '../../lib/utils';

export default function Badge({ children, status, color, className }) {
  const resolvedColor = color || (status ? statusColor(status) : 'gray');
  const colorClass = COLOR_MAP[resolvedColor] || COLOR_MAP.gray;

  return (
    <span className={cn('badge uppercase text-[10px] tracking-wider font-semibold', colorClass, className)}>
      {children || status?.replace('_', ' ')}
    </span>
  );
}
