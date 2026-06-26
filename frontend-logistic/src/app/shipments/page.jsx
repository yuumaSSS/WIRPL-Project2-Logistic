'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, SlidersHorizontal, Package, Download } from 'lucide-react';
import Navbar from '../../components/Navbar';
import ShipmentCard from '../../components/ShipmentCard';
import api from '../../lib/api';

// ─── Status: backend pakai lowercase, frontend label pakai Bahasa Indonesia ───
// Key = nilai status dari backend (logistics service)
const STATUSES = ['', 'processing', 'picked_up', 'in_transit', 'delivered', 'returned', 'cancelled'];
const STATUS_LABELS = {
  '':          'Semua',
  processing:  'Menunggu',
  picked_up:   'Dipickup',
  in_transit:  'Dalam Perjalanan',
  delivered:   'Terkirim',
  returned:    'Retur',
  cancelled:   'Batal',
};

const SUMMARY_META = [
  { label: 'Menunggu',   status: 'processing', color: 'bg-amber-400'  },
  { label: 'Dipickup',   status: 'picked_up',  color: 'bg-orange-400' },
  { label: 'Perjalanan', status: 'in_transit',  color: 'bg-blue-400'   },
  { label: 'Terkirim',   status: 'delivered',  color: 'bg-green-500'  },
  { label: 'Retur',      status: 'returned',   color: 'bg-red-400'    },
  { label: 'Batal',      status: 'cancelled',  color: 'bg-gray-400'   },
];

const PER_PAGE = 6;

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [search,    setSearch]    = useState('');
  const [status,    setStatus]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [summary,   setSummary]   = useState({});

  // ── Fetch list shipments ────────────────────────────────────────────────────
  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // GET /api/logistics/?limit=6&sort=createdAt:desc&status=...
      // Backend getAll support: limit, sort
      // Filter status & search dilakukan client-side karena backend belum support query params tsb
      const res = await api.get('/api/logistics/?limit=200&sort=createdAt:desc');
      const all = res.data?.data ?? [];

      // ── Hitung summary per status dari semua data ──
      const counts = {};
      all.forEach(({ status: s }) => { counts[s] = (counts[s] || 0) + 1; });
      setSummary(counts);
      setTotal(all.length);

      // ── Filter client-side ──
      const filtered = all.filter((s) => {
        const q = search.toLowerCase();
        const matchSearch = !search || [
          s.resi, s.recipientName, s.address, String(s.orderId),
        ].some((v) => v?.toLowerCase().includes(q));
        const matchStatus = !status || s.status === status;
        return matchSearch && matchStatus;
      });

      setTotal(filtered.length);
      const start = (page - 1) * PER_PAGE;
      setShipments(filtered.slice(start, start + PER_PAGE));
    } catch (err) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Gagal memuat data');
      setShipments([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <>
      <Navbar
        title="Pengiriman"
        subtitle={`${total} pengiriman ditemukan`}
      />

      <main className="flex-1 p-6 space-y-5 bg-cream-100">

        {/* ── Error banner ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchShipments} className="text-xs font-medium underline ml-4">Coba lagi</button>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-200 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Cari resi, penerima, alamat, atau order ID…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl
                pl-9 pr-4 py-2.5 text-sm text-brown-600 placeholder-brown-100
                focus:outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-200
                transition-all duration-200"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-cream-50 border border-cream-300
            rounded-xl text-sm font-medium text-brown-400
            hover:bg-cream-200 hover:text-brown-600 transition-all duration-150 flex-shrink-0">
            <Download size={15} />
            Export
          </button>
        </div>

        {/* ── Status Filter Tabs ── */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal size={14} className="text-brown-200 flex-shrink-0 mr-1" />
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 border
                ${status === s
                  ? 'bg-brown-500 text-cream-50 border-brown-500 shadow-luxury'
                  : 'bg-cream-50 text-brown-300 border-cream-200 hover:border-brown-200 hover:text-brown-500'
                }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* ── Summary strip — angka dari data real ── */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          {SUMMARY_META.map((item) => (
            <div
              key={item.status}
              onClick={() => { setStatus(item.status); setPage(1); }}
              className="bg-cream-50 border border-cream-200 rounded-xl px-3 py-2.5 flex items-center gap-2 cursor-pointer
                hover:border-brown-200 transition-all duration-150"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.color}`} />
              <div className="min-w-0">
                <p className="text-xs text-brown-200 truncate">{item.label}</p>
                <p className="text-sm font-semibold text-brown-600 font-display">
                  {summary[item.status] ?? 0}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── List / Empty / Loading ── */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-cream-200 animate-pulse" />
            ))}
          </div>
        ) : shipments.length === 0 ? (
          <div className="bg-cream-50 border border-cream-200 rounded-2xl p-16
            flex flex-col items-center justify-center gap-3 text-center shadow-luxury">
            <div className="w-16 h-16 rounded-2xl bg-cream-200 flex items-center justify-center">
              <Package size={28} className="text-brown-200" />
            </div>
            <p className="font-display font-semibold text-brown-500 text-lg">
              {search || status ? 'Tidak ada pengiriman' : 'Belum ada data pengiriman'}
            </p>
            <p className="text-sm text-brown-200">
              {search || status
                ? 'Coba ubah filter atau kata kunci pencarian.'
                : 'Data akan muncul setelah ada transaksi checkout.'}
            </p>
            {(search || status) && (
              <button
                onClick={() => { setSearch(''); setStatus(''); setPage(1); }}
                className="mt-2 px-4 py-2 bg-brown-500 text-cream-50 rounded-xl text-sm font-medium
                  hover:bg-brown-600 transition-all duration-150"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {shipments.map((s) => (
              <ShipmentCard key={s.id} shipment={s} />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-brown-200">
              Halaman <span className="font-medium text-brown-400">{page}</span> dari{' '}
              <span className="font-medium text-brown-400">{totalPages}</span>
              {' '}({total} pengiriman)
            </p>
            <div className="flex gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs font-medium bg-cream-50 border border-cream-200 rounded-xl
                  text-brown-400 hover:bg-cream-200 disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-150"
              >
                ← Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-xs font-medium rounded-xl border transition-all duration-150
                    ${p === page
                      ? 'bg-brown-500 text-cream-50 border-brown-500'
                      : 'bg-cream-50 text-brown-400 border-cream-200 hover:bg-cream-200'
                    }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs font-medium bg-cream-50 border border-cream-200 rounded-xl
                  text-brown-400 hover:bg-cream-200 disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-150"
              >
                Selanjutnya →
              </button>
            </div>
          </div>
        )}

      </main>
    </>
  );
}