import React from 'react';
import { PackageOpen } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  description = 'There are no items to display right now.',
  action,
  icon: Icon = PackageOpen,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-dashed border-gray-300 my-4">
      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-gray-700">{title}</h4>
      <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4">{description}</p>
      {action}
    </div>
  );
}
