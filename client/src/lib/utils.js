import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount, currency = 'INR') {
  if (amount == null || isNaN(amount)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(n) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US').format(n);
}

export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function formatDateTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function truncate(str, n = 40) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

export function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function statusColor(status) {
  const map = {
    // general
    active: 'green', inactive: 'gray',
    // procurement
    draft: 'gray', submitted: 'blue', approved: 'green', rejected: 'red',
    ordered: 'purple', partially_received: 'yellow', received: 'green', cancelled: 'gray',
    // production
    planned: 'blue', released: 'purple', in_progress: 'yellow', completed: 'green', closed: 'gray',
    // quality
    pending: 'yellow', passed: 'green', failed: 'red', conditional: 'orange',
    // sales / dispatch
    pending_approval: 'yellow', processing: 'blue', shipped: 'purple', delivered: 'green',
    // invoice / payment
    open: 'blue', partially_paid: 'yellow', paid: 'green', overdue: 'red', void: 'gray',
    recorded: 'green',
  };
  return map[status] || 'gray';
}

export const COLOR_MAP = {
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  gray: 'bg-gray-100 text-gray-600',
};
