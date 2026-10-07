import { useCallback, useEffect, useState } from 'react';
import { Activity, AlertCircle, Clock, RefreshCw, User, CreditCard, Filter, Search } from 'lucide-react';
import { apiJson, authHeaders } from '@lib/api';
import { formatWIB as formatWIBShared } from '@lib/date';
import { layout, typography, surfaces, controls } from '@lib/styles';

const formatWIB = (isoStr) => {
  if (!isoStr) return '-';
  const formatted = formatWIBShared(isoStr, { withTime: true, withSeconds: true });

  return formatted === '-' || formatted === String(isoStr) ? formatted : `${formatted} WIB`;
};

export const LogsTab = ({ sessionToken }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const headers = authHeaders(sessionToken);

  const loadLogs = useCallback(async () => {
    try {
      const res = await apiJson('/api/admin/logs?limit=100', { headers });
      setLogs(res.logs || []);
      setError('');
    } catch (err) {
      setError(err?.message || 'Gagal memuat log aktivitas.');
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = logs.filter((log) => {
    if (filterType !== 'all' && log.type !== filterType) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action?.toLowerCase().includes(term) ||
      log.detail?.toLowerCase().includes(term)
    );
  });

  return (
    <section className="space-y-5 animate-in fade-in duration-200">

      <div className={layout.toolbarRow}>
        <div>
          <h2 className={typography.sectionTitle}>Log Aktivitas Pengguna</h2>
          <p className={typography.helper}>
            Riwayat pendaftaran akun baru, pembayaran langganan, dan perubahan status pengguna secara kronologis.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setLoading(true); loadLogs(); }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-cream-300 bg-cream-50 px-3.5 py-2 text-xs font-bold text-ink-700 hover:bg-cream-100 transition shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-ink-400 ${loading ? 'animate-spin' : ''}`} />
          Segarkan Log
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-cream-50 rounded-2xl border border-cream-300 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-ink-300 ml-1" />
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'all'
                  ? 'bg-ink-800 text-white shadow-xs'
                  : 'bg-cream-200 text-ink-500 hover:bg-cream-300'
              }`}
            >
              Semua ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('subscription')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'subscription'
                  ? 'bg-brand-700 text-white shadow-xs'
                  : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
              }`}
            >
              Pembayaran ({logs.filter(l => l.type === 'subscription').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('user')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'user'
                  ? 'bg-ink-700 text-white shadow-xs'
                  : 'bg-cream-100 text-ink-700 hover:bg-cream-200'
              }`}
            >
              Pendaftaran ({logs.filter(l => l.type === 'user').length})
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="h-3.5 w-3.5 text-ink-300 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari aktivitas atau nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-cream-300 focus:outline-none focus:ring-2 focus:ring-cream-300"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-rose-800">Gagal memuat log aktivitas</p>
            <p className="mt-0.5 text-xs text-rose-600">{error}</p>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-cream-300 bg-cream-50 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-cream-200 bg-cream-100 flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink-500 flex items-center gap-2">
            <Activity className="h-4 w-4 text-ink-400" />
            Aktivitas Terkini (Menampilkan {filteredLogs.length})
          </h3>
          <span className="text-caption text-ink-300">Zona Waktu: WIB (UTC+7)</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className={controls.emptyIcon} />
            <p className="mt-3 font-bold text-ink-700 text-sm">Tidak ada aktivitas yang sesuai</p>
            <p className="mt-1 text-xs text-ink-300">Coba ubah filter atau kata kunci pencarian Anda.</p>
          </div>
        ) : (
          <div className="divide-y divide-cream-200 max-h-[550px] overflow-y-auto">
            {filteredLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-3.5 px-5 py-3.5 hover:bg-cream-100/70 transition">
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${
                  log.type === 'subscription'
                    ? 'bg-brand-50 text-brand-700 border-brand-200 shadow-xs'
                    : 'bg-cream-100 text-ink-700 border-cream-300 shadow-xs'
                }`}>
                  {log.type === 'subscription' ? <CreditCard className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-ink-800">{log.action}</p>
                    <span className={`text-micro font-bold px-1.5 py-0.2 rounded ${
                      log.type === 'subscription' ? 'bg-brand-100 text-brand-800' : 'bg-cream-200 text-ink-700'
                    }`}>
                      {log.type === 'subscription' ? 'Keuangan' : 'Akun'}
                    </span>
                  </div>
                  <p className="text-xs text-ink-400 mt-0.5 font-medium">{log.detail}</p>
                </div>
                <span className="shrink-0 text-caption font-medium text-ink-300 whitespace-nowrap bg-cream-200 px-2 py-0.5 rounded-lg">
                  {formatWIB(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </section>
  );
};
