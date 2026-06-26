'use client';

import { useEffect, useState } from 'react';
import {
  Package, Truck, CheckCircle2, AlertCircle, TrendingUp, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import ShipmentCard from '../components/ShipmentCard';
import api from '../lib/api';

const CHART_DATA = [
  { day: 'Sen', pengiriman: 24, terkirim: 20 },
  { day: 'Sel', pengiriman: 31, terkirim: 27 },
  { day: 'Rab', pengiriman: 18, terkirim: 16 },
  { day: 'Kam', pengiriman: 42, terkirim: 38 },
  { day: 'Jum', pengiriman: 37, terkirim: 30 },
  { day: 'Sab', pengiriman: 28, terkirim: 25 },
  { day: 'Min', pengiriman: 15, terkirim: 14 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#FDFAF6', border: '1px solid #EDE0D4',
      borderRadius: '12px', padding: '10px 14px',
      fontSize: '12px', color: '#3D2B1F',
    }}>
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex-1 flex items-center justify-center bg-cream-100">
    <div className="flex flex-col items-center gap-3">
      <RefreshCw size={28} className="text-brown-300 animate-spin" />
      <p className="text-sm text-brown-300">Memuat data dashboard…</p>
    </div>
  </div>
);

const ErrorBanner = ({ message, onRetry }) => (
  <div className="flex-1 flex items-center justify-center bg-cream-100 p-6">
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md w-full text-center">
      <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
      <p className="font-semibold text-red-700 mb-1">Gagal memuat data</p>
      <p className="text-sm text-red-500 mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-brown-500 text-white rounded-xl text-sm font-medium hover:bg-brown-600 transition-colors"
      >
        Coba Lagi
      </button>
    </div>
  </div>
);

const buildStatusDist = (shipments = []) => {
  const STATUS_META = {
    processing:  { name: 'Menunggu',    color: '#C9A87C' },
    picked_up:   { name: 'Dipickup',   color: '#E8834A' },
    in_transit:  { name: 'Perjalanan', color: '#4A6FA5' },
    delivered:   { name: 'Terkirim',   color: '#3A7D44' },
    returned:    { name: 'Retur',      color: '#B03A2E' },
    cancelled:   { name: 'Batal',      color: '#6B7280' },
  };
  const counts = {};
  shipments.forEach(({ status }) => { counts[status] = (counts[status] || 0) + 1; });
  return Object.entries(STATUS_META).map(([key, meta]) => ({
    ...meta, value: counts[key] || 0,
  }));
};

export default function DashboardPage() {
  const [stats, setStats]               = useState(null);
  const [recentShipments, setRecent]    = useState([]);
  const [allShipments, setAllShipments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      // Stats dari GET /api/logistics/stats
      // List dari GET /api/logistics/?limit=...
      const [statsRes, recentRes, allRes] = await Promise.all([
        api.get('/api/logistics/stats'),
        api.get('/api/logistics/?limit=4&sort=createdAt:desc'),
        api.get('/api/logistics/?limit=200'),
      ]);

      // Backend kirim { data: { total, active, delivered, failed } }
      setStats(statsRes.data.data ?? statsRes.data);

      // Backend kirim { data: [...] }
      setRecent(recentRes.data?.data ?? recentRes.data ?? []);
      setAllShipments(allRes.data?.data ?? allRes.data ?? []);
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Terjadi kesalahan';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = () => fetchDashboard();

  if (loading) return <><Navbar title="Dashboard" subtitle="Memuat…" /><LoadingSpinner /></>;
  if (error)   return <><Navbar title="Dashboard" subtitle="Error" /><ErrorBanner message={error} onRetry={handleRetry} /></>;

  const statusDist = buildStatusDist(allShipments);

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <>
      <Navbar title="Dashboard" subtitle={`Selamat datang — ${today}`} />

      <main className="flex-1 p-6 space-y-6 bg-cream-100">

        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-brown-200 mb-3">
            Ringkasan Hari Ini
          </p>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Total Pengiriman"
              value={stats?.total ?? 0}
              icon={Package}
              trend={8}
              trendLabel="vs minggu lalu"
              accent
            />
            <StatCard
              title="Sedang Aktif"
              value={stats?.active ?? 0}
              icon={Truck}
              trend={3}
              trendLabel="pengiriman berjalan"
            />
            <StatCard
              title="Terkirim"
              value={stats?.delivered ?? 0}
              icon={CheckCircle2}
              trend={12}
              trendLabel="berhasil dikirim"
            />
            <StatCard
              title="Gagal / Retur"
              value={stats?.failed ?? 0}
              icon={AlertCircle}
              trend={-2}
              trendLabel="perlu tindakan"
            />
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-cream-50 border border-cream-200 rounded-2xl p-5 shadow-luxury">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brown-200 mb-1">
                  Tren Pengiriman
                </p>
                <p className="font-display font-semibold text-brown-600 text-lg leading-tight">
                  7 Hari Terakhir
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold
                text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                <TrendingUp size={12} />
                +8% minggu ini
              </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={CHART_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPengiriman" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8B5E3C" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#8B5E3C" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradTerkirim" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3A7D44" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#3A7D44" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDE0D4" />
                <XAxis dataKey="day" tick={{ fill: '#B8895A', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#B8895A', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="pengiriman" name="Total Pengiriman"
                  stroke="#8B5E3C" strokeWidth={2} fill="url(#gradPengiriman)"
                  dot={false} activeDot={{ r: 4, fill: '#8B5E3C' }} />
                <Area type="monotone" dataKey="terkirim" name="Terkirim"
                  stroke="#3A7D44" strokeWidth={2} fill="url(#gradTerkirim)"
                  dot={false} activeDot={{ r: 4, fill: '#3A7D44' }} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-5 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-brown-300">
                <span className="w-3 h-2 rounded-sm bg-brown-300 inline-block" />
                Total Pengiriman
              </span>
              <span className="flex items-center gap-1.5 text-xs text-brown-300">
                <span className="w-3 h-2 rounded-sm inline-block" style={{ background: '#3A7D44' }} />
                Terkirim
              </span>
            </div>
          </div>

          <div className="bg-cream-50 border border-cream-200 rounded-2xl p-5 shadow-luxury">
            <p className="text-xs font-semibold uppercase tracking-widest text-brown-200 mb-1">
              Distribusi Status
            </p>
            <p className="font-display font-semibold text-brown-600 text-lg leading-tight mb-4">
              Semua Pengiriman
            </p>
            <div className="space-y-3">
              {statusDist.map((s) => {
                const total = statusDist.reduce((a, b) => a + b.value, 0);
                const pct   = total > 0 ? Math.round((s.value / total) * 100) : 0;
                return (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-xs text-brown-400 w-24 flex-shrink-0 truncate">{s.name}</span>
                    <div className="flex-1 bg-cream-200 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: s.color }} />
                    </div>
                    <span className="text-xs font-semibold text-brown-500 w-6 text-right flex-shrink-0">
                      {s.value}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 pt-4 border-t border-cream-200 flex items-center justify-between">
              <span className="text-xs text-brown-200">Total pengiriman</span>
              <span className="font-display font-semibold text-brown-600 text-lg">
                {statusDist.reduce((a, b) => a + b.value, 0)}
              </span>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-brown-200">
              Pengiriman Terbaru
            </p>
            <a href="/shipments" className="text-xs font-medium text-brown-300 hover:text-brown-500 transition-colors">
              Lihat semua →
            </a>
          </div>
          {recentShipments.length === 0 ? (
            <div className="bg-cream-50 border border-cream-200 rounded-2xl p-8 text-center">
              <Package size={32} className="text-brown-200 mx-auto mb-2" />
              <p className="text-sm text-brown-300">Belum ada data pengiriman</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {recentShipments.map((s) => (
                <ShipmentCard key={s.id} shipment={s} />
              ))}
            </div>
          )}
        </section>

      </main>
    </>
  );
}