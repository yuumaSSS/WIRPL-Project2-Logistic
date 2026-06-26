'use client';

import Link from 'next/link';
import { Package, MapPin, User, ChevronRight, Calendar } from 'lucide-react';
import StatusBadge from './StatusBadge';

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

const STATUS_BORDER = {
  WAITING_PICKUP: 'border-l-amber-400',
  PICKED_UP:      'border-l-orange-400',
  IN_TRANSIT:     'border-l-blue-400',
  DELIVERED:      'border-l-green-500',
  FAILED:         'border-l-red-400',
};

export default function ShipmentCard({ shipment }) {
  const {
    id, resi, orderId, sender, receiver,
    weight, serviceType, status, createdAt, courierName,
  } = shipment;

  const borderColor = STATUS_BORDER[status] || 'border-l-cream-300';

  return (
    <Link href={`/shipments/${id}`} className="block group">
      <div
        className={`bg-cream-50 border border-cream-200 border-l-4 ${borderColor}
          rounded-2xl p-5 shadow-luxury
          transition-all duration-300 hover:shadow-luxury-hover hover:-translate-y-0.5`}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left: resi + order */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-semibold text-brown-600 text-base tracking-tight">
                {resi}
              </span>
              <StatusBadge status={status} size="sm" />
            </div>
            <p className="text-xs text-brown-200 mt-0.5">Order #{orderId}</p>
          </div>

          {/* Right arrow */}
          <ChevronRight
            size={18}
            className="flex-shrink-0 text-brown-100 mt-0.5
              group-hover:text-brown-300 group-hover:translate-x-0.5
              transition-all duration-200"
          />
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-cream-200" />

        {/* Route info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-brown-200 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-brown-100 mb-0.5">Pengirim</p>
              <p className="font-medium text-brown-500 truncate">{sender}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-brown-300 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-brown-100 mb-0.5">Penerima</p>
              <p className="font-medium text-brown-500 truncate">{receiver}</p>
            </div>
          </div>
        </div>

        {/* Footer meta */}
        <div className="mt-3 pt-3 border-t border-cream-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 text-xs text-brown-200">
            <span className="flex items-center gap-1">
              <Package size={12} />
              {weight} kg · {serviceType}
            </span>
            {courierName && (
              <span className="flex items-center gap-1">
                <User size={12} />
                {courierName}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 text-xs text-brown-100">
            <Calendar size={12} />
            {formatDate(createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}