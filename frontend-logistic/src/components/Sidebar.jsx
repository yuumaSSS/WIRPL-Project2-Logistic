'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Users, Truck,
  MapPin, History, Webhook, LogOut, ChevronRight,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Utama',
    items: [
      { href: '/',           label: 'Dashboard',   icon: LayoutDashboard },
      { href: '/shipments',  label: 'Pengiriman',  icon: Package },
    ],
  },
  {
    label: 'SDM & Armada',
    items: [
      { href: '/couriers',   label: 'Kurir',        icon: Users },
      { href: '/fleet',      label: 'Armada',       icon: Truck },
    ],
  },
  {
    label: 'Tracking & Mitra',
    items: [
      { href: '/tracking',   label: 'Cek Resi',     icon: MapPin },
      { href: '/history',    label: 'Riwayat Status', icon: History },
      { href: '/partners',   label: 'Mitra Webhook', icon: Webhook },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-64 flex flex-col bg-brown-600 z-30 select-none">
      {/* Logo area */}
      <div className="px-6 py-6 border-b border-brown-500">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brown-100 flex items-center justify-center flex-shrink-0">
            <Package size={18} className="text-brown-600" />
          </div>
          <div>
            <p className="font-display font-semibold text-cream-50 text-base leading-tight">
              LogiTrack
            </p>
            <p className="text-xs text-brown-200 leading-tight mt-0.5">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest text-brown-300">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-150 group
                        ${active
                          ? 'bg-brown-100 text-brown-700'
                          : 'text-cream-200 hover:bg-brown-500 hover:text-cream-50'
                        }`}
                    >
                      <Icon
                        size={16}
                        className={`flex-shrink-0 ${active ? 'text-brown-500' : 'text-brown-200 group-hover:text-cream-100'}`}
                      />
                      <span className="flex-1 truncate">{label}</span>
                      {active && (
                        <ChevronRight size={14} className="text-brown-400 flex-shrink-0" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer / logout */}
      <div className="px-3 py-4 border-t border-brown-500">
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            text-sm font-medium text-brown-200
            hover:bg-brown-500 hover:text-cream-50
            transition-all duration-150 group"
          onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/auth/login';
          }}
        >
          <LogOut size={16} className="text-brown-200 group-hover:text-cream-100 flex-shrink-0" />
          Keluar
        </button>
      </div>
    </aside>
  );
}