'use client';

const STATUS_CONFIG = {
  WAITING_PICKUP: {
    label: 'Menunggu Pickup',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
    border: 'border-amber-200',
  },
  PICKED_UP: {
    label: 'Dipickup',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    dot: 'bg-orange-400',
    border: 'border-orange-200',
  },
  IN_TRANSIT: {
    label: 'Dalam Perjalanan',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-400',
    border: 'border-blue-200',
  },
  DELIVERED: {
    label: 'Terkirim',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-400',
    border: 'border-green-200',
  },
  FAILED: {
    label: 'Gagal',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-400',
    border: 'border-red-200',
  },
};

export default function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
    border: 'border-gray-200',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium
        ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      <span className={`rounded-full ${config.dot} ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
      {config.label}
    </span>
  );
}