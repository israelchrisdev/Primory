import { useEffect, useMemo, useState } from 'react';
import { CreateEventForm } from './components/CreateEventForm';
import { EventSpace } from './components/EventSpace';
import { HostDashboard } from './components/HostDashboard';
import { LandingHero } from './components/LandingHero';
import { useMobile } from './hooks/useMobile';
import type { EventRecord } from './types/models';

type View = 'landing' | 'create' | 'join' | 'host' | 'event';

const readParams = () => new URLSearchParams(window.location.search);

function App() {
  const isMobile = useMobile();
  const [joinCode, setJoinCode] = useState('');
  const [currentView, setCurrentView] = useState<View>('landing');
  const [created, setCreated] = useState<{ event: EventRecord; shareLink: string; qrCode: string } | null>(null);

  useEffect(() => {
    const params = readParams();
    const eventCode = params.get('event');

    if (eventCode) {
      setJoinCode(eventCode);
      setCurrentView('event');
      return;
    }

    if (isMobile) {
      setCurrentView('join');
    }
  }, [isMobile]);

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

  if (currentView === 'event' && joinCode) {
    return <EventSpace eventCode={joinCode} />;
  }

  if (currentView === 'host' && created) {
    return <HostDashboard event={created.event} shareLink={created.shareLink} qrCode={created.qrCode} />;
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      {currentView === 'landing' ? (
        <LandingHero onCreate={() => setCurrentView('create')} onJoin={() => setCurrentView('join')} />
      ) : null}

      {currentView === 'create' ? (
        <CreateEventForm
          onCreated={(payload) => {
            setCreated(payload);
            setCurrentView('host');
          }}
        />
      ) : null}

      {currentView === 'join' ? (
        <section className="mx-auto max-w-lg px-4 py-10">
          <div className="glass-card p-6">
            <h2 className="text-2xl font-bold">Join with Event Code</h2>
            <p className="mt-1 text-sm text-slate-500">No downloads. No accounts. Just memories.</p>
            <input
              className="mt-4 w-full rounded-xl border px-4 py-3 uppercase"
              placeholder="Enter code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            <button
              className="mt-4 w-full rounded-full bg-brand-violet px-4 py-3 font-semibold text-white"
              onClick={() => setCurrentView('event')}
              disabled={!joinCode.trim()}
            >
              Enter event
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default App;
