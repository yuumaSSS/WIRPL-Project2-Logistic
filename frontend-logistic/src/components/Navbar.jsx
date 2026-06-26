'use client';

import { useState } from 'react';
import { Bell, Search, User, ChevronDown } from 'lucide-react';

export default function Navbar({ title, subtitle }) {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="h-16 bg-cream-50 border-b border-cream-200 px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left: Page title */}
      <div className="min-w-0">
        <h1 className="font-display font-semibold text-brown-600 text-lg leading-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-brown-200 leading-tight mt-0.5 truncate">{subtitle}</p>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search button */}
        <button className="w-9 h-9 flex items-center justify-center rounded-xl
          text-brown-200 hover:bg-cream-200 hover:text-brown-500
          transition-all duration-150">
          <Search size={16} />
        </button>

        {/* Notification bell */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl
          text-brown-200 hover:bg-cream-200 hover:text-brown-500
          transition-all duration-150">
          <Bell size={16} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brown-300 ring-2 ring-cream-50" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-cream-200 mx-1" />

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile((p) => !p)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl
              hover:bg-cream-200 transition-all duration-150"
          >
            <div className="w-7 h-7 rounded-full bg-brown-500 flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-cream-50" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-brown-600 leading-tight">Admin</p>
              <p className="text-xs text-brown-100 leading-tight">LogiTrack</p>
            </div>
            <ChevronDown size={14} className={`text-brown-200 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-cream-50 border border-cream-200 rounded-2xl shadow-luxury overflow-hidden">
              <div className="px-4 py-3 border-b border-cream-200">
                <p className="text-xs font-semibold text-brown-600">Administrator</p>
                <p className="text-xs text-brown-100 mt-0.5">admin@logitrack.id</p>
              </div>
              <button
                className="w-full text-left px-4 py-2.5 text-sm text-brown-500
                  hover:bg-cream-200 transition-colors duration-150"
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/auth/login';
                }}
              >
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}