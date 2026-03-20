import { useEffect, useMemo, useState } from 'react';
import { CreateEventForm } from './components/CreateEventForm';
import { EventSpace } from './components/EventSpace';
import { HostDashboard } from './components/HostDashboard';
import { LandingHero } from './components/LandingHero';
import { getEventByCode } from './services/eventService';
import type { EventRecord } from './types/models';

type View = 'landing' | 'create' | 'join' | 'host' | 'event';

type CreatedPayload = {
  event: EventRecord;
  shareLink: string;
  qrCode: string;
};

const HOST_STORAGE_KEY = 'primory_host_session';

const readParams = () => new URLSearchParams(window.location.search);

const buildHostPayload = (event: EventRecord): CreatedPayload => {
  const shareLink = `${window.location.origin}?event=${event.event_code}`;
  const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    shareLink,
  )}`;

  return {
    event,
    shareLink,
    qrCode,
  };
};

function App() {
  const [joinCode, setJoinCode] = useState('');
  const [currentView, setCurrentView] = useState<View>('landing');
  const [created, setCreated] = useState<CreatedPayload | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const boot = async () => {
      try {
        const params = readParams();
        const eventCodeParam = params.get('event');
        const hostCodeParam = params.get('host');

        if (hostCodeParam) {
          const hostEvent = await getEventByCode(hostCodeParam.toUpperCase());
          const payload = buildHostPayload(hostEvent);
          setCreated(payload);
          localStorage.setItem(HOST_STORAGE_KEY, JSON.stringify(payload));
          setCurrentView('host');
          return;
        }

        if (eventCodeParam) {
          setJoinCode(eventCodeParam.toUpperCase());
          setCurrentView('event');
          return;
        }

        const stored = localStorage.getItem(HOST_STORAGE_KEY);

        if (stored) {
          const parsed = JSON.parse(stored) as CreatedPayload;

          if (parsed?.event?.event_code) {
            setCreated(parsed);
          }
        }

        setCurrentView('landing');
      } catch (error) {
        console.error('Failed to restore app state:', error);
        localStorage.removeItem(HOST_STORAGE_KEY);
        setCurrentView('landing');
      } finally {
        setBooting(false);
      }
    };

    void boot();
  }, []);

  const title = useMemo(() => {
    if (currentView === 'create') return 'Create your Primory space';
    if (currentView === 'join') return 'Join an event';
    if (currentView === 'event') return 'Primory Event';
    if (currentView === 'host') return 'Host Dashboard';
    return 'Primory';
  }, [currentView]);

  useEffect(() => {
    document.title = title;
  }, [title]);

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg text-brand-text">
        <p className="text-sm text-slate-500">Loading Primory...</p>
      </div>
    );
  }

  if (currentView === 'event' && joinCode) {
    return <EventSpace eventCode={joinCode} />;
  }

  if (currentView === 'host' && created) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 pt-4">
          <button
            className="text-sm text-slate-500 underline"
            onClick={() => setCurrentView('landing')}
          >
            Back to home
          </button>

          <button
            className="text-sm text-red-500 underline"
            onClick={() => {
              localStorage.removeItem(HOST_STORAGE_KEY);
              setCreated(null);
              setCurrentView('landing');
              window.history.replaceState({}, '', window.location.pathname);
            }}
          >
            Clear host session
          </button>
        </div>

        <HostDashboard
          event={created.event}
          shareLink={created.shareLink}
          qrCode={created.qrCode}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      {currentView === 'landing' && (
        <>
          <LandingHero
            onCreate={() => setCurrentView('create')}
            onJoin={() => setCurrentView('join')}
          />

          {created && (
            <section className="mx-auto max-w-6xl px-4 pb-8">
              <div className="glass-card flex flex-col items-start justify-between gap-4 p-5 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-semibold text-brand-violet">Recent host session found</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Resume dashboard for <span className="font-semibold">{created.event.title}</span> (
                    {created.event.event_code})
                  </p>
                </div>

                <button
                  className="rounded-full bg-brand-violet px-5 py-3 text-sm font-semibold text-white"
                  onClick={() => setCurrentView('host')}
                >
                  Open host dashboard
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {currentView === 'create' && (
        <div>
          <div className="mx-auto max-w-2xl px-4 pt-6">
            <button
              className="text-sm text-slate-500 underline"
              onClick={() => setCurrentView('landing')}
            >
              Back
            </button>
          </div>

          <CreateEventForm
            onCreated={(payload) => {
              setCreated(payload);
              localStorage.setItem(HOST_STORAGE_KEY, JSON.stringify(payload));
              window.history.replaceState({}, '', `?host=${payload.event.event_code}`);
              setCurrentView('host');
            }}
          />
        </div>
      )}

      {currentView === 'join' && (
        <section className="mx-auto max-w-lg px-4 py-10">
          <div className="glass-card p-6">
            <h2 className="text-2xl font-bold">Join with Event Code</h2>
            <p className="mt-1 text-sm text-slate-500">
              No downloads. No accounts. Just memories.
            </p>

            <input
              className="mt-4 w-full rounded-xl border px-4 py-3 uppercase"
              placeholder="Enter code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            />

            <button
              className="mt-4 w-full rounded-full bg-brand-violet px-4 py-3 font-semibold text-white"
              onClick={() => {
                if (!joinCode.trim()) return;
                window.history.replaceState({}, '', `?event=${joinCode.trim().toUpperCase()}`);
                setCurrentView('event');
              }}
              disabled={!joinCode.trim()}
            >
              Enter event
            </button>

            <button
              className="mt-3 w-full text-sm text-slate-500 underline"
              onClick={() => setCurrentView('landing')}
            >
              Back
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;