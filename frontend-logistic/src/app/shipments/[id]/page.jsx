'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Package, MapPin, User, Truck,
  Calendar, Clock, Weight, Hash, RefreshCw,
  CheckCircle2, AlertCircle, ClipboardList,
} from 'lucide-react';
import Navbar from '../../../components/Navbar';
import StatusBadge from '../../../components/StatusBadge';
import api from '../../../lib/api';

// ── Helpers ─────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Sub-components ───────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-cream-200 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-cream-200 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={14} className="text-brown-300" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-brown-100 mb-0.5">{label}</p>
        <p className={`text-sm font-medium text-brown-600 ${mono ? 'font-mono' : ''}`}>
          {value || '—'}
        </p>
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-cream-50 border border-cream-200 rounded-2xl shadow-luxury overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-cream-200">
        <div className="w-8 h-8 rounded-lg bg-cream-200 flex items-center justify-center flex-shrink-0">
          <Icon size={15} className="text-brown-300" />
        </div>
        <p className="font-display font-semibold text-brown-600 text-base">{title}</p>
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

// Warna dot timeline berdasarkan status backend (lowercase)
const TIMELINE_DOT = {
  processing:  'bg-amber-400 ring-amber-100',
  picked_up:   'bg-orange-400 ring-orange-100',
  in_transit:  'bg-blue-400 ring-blue-100',
  delivered:   'bg-green-500 ring-green-100',
  returned:    'bg-red-400 ring-red-100',
  cancelled:   'bg-gray-400 ring-gray-100',
};

// ── Page ─────────────────────────────────────────────────────────────
export default function ShipmentDetailPage() {
  const { id }  = useParams();
  const router  = useRouter();

  const [detail,   setDetail]   = useState(null);
  const [tracking, setTracking] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      // ── 1. Ambil detail shipment by ID ──────────────────────────────
      // Route: GET /api/logistics/:id  (via getAll + filter by PK tidak ada,
      // sehingga kita fetch semua lalu cari by id — atau gunakan endpoint order jika ada)
      // Karena backend tidak punya GET /api/logistics/:id, kita fetch semua
      // dan filter, atau pakai track by resi setelah dapat resinya.
      // Solusi terbaik: fetch list, filter by id (limit tinggi sudah ada).
      const listRes = await api.get('/api/logistics/?limit=200&sort=createdAt:desc');
      const all = listRes.data?.data ?? [];
      const shipment = all.find((s) => String(s.id) === String(id));

      if (!shipment) {
        setError('Pengiriman tidak ditemukan.');
        setLoading(false);
        return;
      }

      setDetail(shipment);

      // ── 2. Ambil tracking history via resi ──────────────────────────
      // Route: GET /api/logistics/track/:resi/history
      const trackRes = await api.get(`/api/logistics/track/${shipment.resi}/history`);
      // Response: { data: { shipment, history: [...] } }
      const logs = trackRes.data?.data?.history ?? [];
      setTracking(logs);

    } catch (err) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Gagal memuat data pengiriman.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <>
        <Navbar title="Detail Pengiriman" />
        <main className="flex-1 p-6 bg-cream-100 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-cream-200 animate-pulse" />
          ))}
        </main>
      </>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <>
        <Navbar title="Detail Pengiriman" />
        <main className="flex-1 p-6 bg-cream-100 flex items-center justify-center">
          <div className="text-center space-y-3">
            <AlertCircle size={40} className="text-red-400 mx-auto" />
            <p className="font-display font-semibold text-brown-600 text-lg">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-brown-500 text-cream-50 rounded-xl text-sm font-medium
                hover:bg-brown-600 transition-all duration-150"
            >
              Kembali
            </button>
          </div>
        </main>
      </>
    );
  }

  const d = detail;

  return (
    <>
      <Navbar
        title="Detail Pengiriman"
        subtitle={d.resi}
      />

      <main className="flex-1 p-6 bg-cream-100 space-y-4">

        {/* ── Back + status header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-brown-300
              hover:text-brown-600 transition-colors duration-150"
          >
            <ArrowLeft size={16} />
            Kembali ke daftar
          </button>
          <StatusBadge status={d.status} size="lg" />
        </div>

        {/* ── Hero resi card ── */}
        <div className="bg-brown-500 rounded-2xl p-5 text-cream-50 relative overflow-hidden shadow-luxury">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-cream-50 opacity-5" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-cream-50 opacity-5" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-widest text-brown-100 mb-1">
              Nomor Resi
            </p>
            <p className="font-display font-semibold text-2xl tracking-tight text-cream-50">
              {d.resi}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-brown-100 mb-0.5">Order ID</p>
                <p className="text-sm font-medium text-cream-100">#{d.orderId}</p>
              </div>
              <div>
                <p className="text-xs text-brown-100 mb-0.5">Layanan</p>
                <p className="text-sm font-medium text-cream-100">{d.service ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-brown-100 mb-0.5">Est. Tiba</p>
                <p className="text-sm font-medium text-cream-100">{formatDate(d.estimasi)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2-column grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* Penerima — field dari model Shipment backend */}
          <SectionCard title="Penerima" icon={User}>
            <InfoRow icon={User}   label="Nama Penerima" value={d.recipientName} />
            <InfoRow icon={MapPin} label="Alamat"        value={d.address} />
            <InfoRow icon={Hash}   label="Telepon"       value={d.phone} mono />
          </SectionCard>

          {/* Info Pengiriman */}
          <SectionCard title="Info Pengiriman" icon={Package}>
            <InfoRow icon={Truck}    label="Kurir"          value={d.courier} />
            <InfoRow icon={Package}  label="Jenis Layanan"  value={d.service} />
            <InfoRow icon={Calendar} label="Dibuat"         value={formatDateTime(d.createdAt)} />
            <InfoRow icon={Clock}    label="Diperbarui"     value={formatDateTime(d.updatedAt)} />
            {d.shippedAt && (
              <InfoRow icon={Truck}  label="Tgl Pickup"     value={formatDateTime(d.shippedAt)} />
            )}
            {d.deliveredAt && (
              <InfoRow icon={CheckCircle2} label="Tgl Terkirim" value={formatDateTime(d.deliveredAt)} />
            )}
            {d.notes && (
              <InfoRow icon={ClipboardList} label="Catatan" value={d.notes} />
            )}
          </SectionCard>
        </div>

        {/* ── Tracking Timeline ── */}
        <SectionCard title="Riwayat Status" icon={Clock}>
          {tracking.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-brown-200">Belum ada riwayat status.</p>
            </div>
          ) : (
            <div className="py-4">
              {/* Urutkan dari terbaru ke terlama */}
              {[...tracking].reverse().map((log, idx, arr) => {
                const dotClass = TIMELINE_DOT[log.status] || 'bg-brown-200 ring-cream-200';
                const isLast = idx === arr.length - 1;
                return (
                  <div key={log.id} className="flex gap-4">
                    {/* Dot + line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ring-4 flex-shrink-0 mt-0.5 ${dotClass}`} />
                      {!isLast && (
                        <div className="w-px flex-1 bg-cream-300 my-1.5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pb-5">
                      <StatusBadge status={log.status} size="sm" />
                      <p className="text-sm text-brown-500 mt-1.5 leading-relaxed">
                        {log.description}
                      </p>
                      <p className="text-xs text-brown-100 mt-1 flex items-center gap-1">
                        <Clock size={11} />
                        {/* TrackingLog pakai changedAt, bukan createdAt */}
                        {formatDateTime(log.changedAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-3 pb-2">
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 bg-cream-50 border border-cream-300 rounded-xl
              text-sm font-medium text-brown-400
              hover:bg-cream-200 hover:text-brown-600 transition-all duration-150"
          >
            Kembali
          </button>
          <button
            onClick={fetchDetail}
            className="flex items-center gap-2 px-5 py-2.5 bg-brown-500 text-cream-50 rounded-xl
              text-sm font-medium hover:bg-brown-600 transition-all duration-150 shadow-luxury"
          >
            <RefreshCw size={14} />
            Refresh Status
          </button>
        </div>

      </main>
    </>
  );
}