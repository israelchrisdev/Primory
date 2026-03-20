import { Download, Image, MessageCircle, Gift, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getMetrics } from '../services/eventService';
import type { EventRecord, EventMetrics } from '../types/models';

interface HostDashboardProps {
  event: EventRecord;
  shareLink: string;
  qrCode: string;
}

const initialMetrics: EventMetrics = { guests: 0, messages: 0, media: 0, donationsTotal: 0 };

export const HostDashboard = ({ event, shareLink, qrCode }: HostDashboardProps) => {
  const [metrics, setMetrics] = useState<EventMetrics>(initialMetrics);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMetrics(event.id);
        setMetrics(data);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [event.id]);

  const downloadSummary = () => {
    const content = JSON.stringify({ event, metrics, shareLink }, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${event.event_code}-summary.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mx-auto mt-6 max-w-5xl space-y-4 px-4 pb-12">
      <div className="glass-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-violet">Host dashboard</p>
        <h2 className="mt-1 text-3xl font-bold">{event.title}</h2>
        <p className="mt-1 text-sm text-slate-500">Code: {event.event_code}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Stat icon={<Users size={18} />} label="Guests" value={metrics.guests} loading={loading} />
          <Stat icon={<MessageCircle size={18} />} label="Messages" value={metrics.messages} loading={loading} />
          <Stat icon={<Image size={18} />} label="Uploads" value={metrics.media} loading={loading} />
          <Stat icon={<Gift size={18} />} label="Donations" value={`$${metrics.donationsTotal.toFixed(2)}`} loading={loading} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card p-6">
          <h3 className="font-semibold">Share event link</h3>
          <p className="mt-2 rounded-lg bg-slate-100 p-3 text-sm">{shareLink}</p>
          <button className="mt-3 rounded-full bg-brand-violet px-4 py-2 text-sm font-semibold text-white" onClick={() => navigator.clipboard.writeText(shareLink)}>
            Copy link
          </button>
        </div>
        <div className="glass-card p-6">
          <h3 className="font-semibold">Venue QR code</h3>
          <img src={qrCode} alt="Event QR code" className="mt-3 h-36 w-36 rounded-xl border bg-white p-2" />
        </div>
      </div>

      <button className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white" onClick={downloadSummary}>
        <Download size={16} /> Download event snapshot
      </button>
    </section>
  );
};

const Stat = ({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value: string | number; loading: boolean }) => (
  <div className="rounded-2xl border bg-white p-4">
    <div className="flex items-center gap-2 text-brand-violet">
      {icon}
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </div>
    <p className="mt-2 text-2xl font-bold text-brand-text">{loading ? '...' : value}</p>
  </div>
);
