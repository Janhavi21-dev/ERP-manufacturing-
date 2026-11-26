import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h2>
      <p className="text-gray-500 max-w-sm mb-6 text-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/dashboard" className="btn-primary">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </Link>
    </div>
  );
}
