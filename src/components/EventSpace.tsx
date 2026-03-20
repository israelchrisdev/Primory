import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Gift, Image, MessageCircle, Video, Users } from 'lucide-react';
import {
  addDonation,
  getFeed,
  getEventByCode,
  listLivestreams,
  postMessage,
  uploadMedia,
  addGuest,
} from '../services/eventService';
import type { EventRecord, FeedItem, LivestreamRecord } from '../types/models';

type Tab = 'feed' | 'messages' | 'gallery' | 'live' | 'gifts';

export const EventSpace = ({ eventCode }: { eventCode: string }) => {
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [guestName, setGuestName] = useState('');
  const [joined, setJoined] = useState(false);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [message, setMessage] = useState('');
  const [livestreams, setLivestreams] = useState<LivestreamRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const eventData = await getEventByCode(eventCode.toUpperCase());
        setEvent(eventData);
        const [feedItems, lives] = await Promise.all([getFeed(eventData.id), listLivestreams(eventData.id)]);
        setFeed(feedItems);
        setLivestreams(lives);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load this event');
      }
    };

    void load();
  }, [eventCode]);

  const totalDonations = useMemo(
    () => feed.filter((item) => item.kind === 'donation').reduce((sum, item) => sum + item.amount, 0),
    [feed],
  );

  const join = async () => {
    if (!event || !guestName.trim()) return;
    await addGuest(event.id, guestName.trim());
    setJoined(true);
  };

  const submitMessage = async (eventObj: FormEvent) => {
    eventObj.preventDefault();
    if (!event || !message.trim()) return;
    await postMessage(event.id, guestName, message.trim());
    setMessage('');
    setFeed(await getFeed(event.id));
  };

  const submitDonation = async (eventObj: FormEvent<HTMLFormElement>) => {
    eventObj.preventDefault();
    if (!event) return;
    const form = new FormData(eventObj.currentTarget);
    const amount = Number(form.get('amount'));
    const donationMessage = String(form.get('donationMessage') ?? '');
    const visibility = String(form.get('visibility') ?? 'public') as 'public' | 'anonymous';
    await addDonation(event.id, guestName, amount, visibility, donationMessage);
    setFeed(await getFeed(event.id));
    eventObj.currentTarget.reset();
  };

  const submitMedia = async (eventObj: FormEvent<HTMLFormElement>) => {
    eventObj.preventDefault();
    if (!event) return;
    const form = new FormData(eventObj.currentTarget);
    const file = form.get('file') as File | null;
    if (!file) return;
    await uploadMedia(event.id, guestName, file, file.type.startsWith('video/') ? 'video' : 'image');
    setFeed(await getFeed(event.id));
    eventObj.currentTarget.reset();
  };

  if (error) return <p className="mx-auto mt-16 max-w-lg rounded-xl bg-red-50 p-4 text-red-700">{error}</p>;
  if (!event) return <p className="mt-16 text-center">Loading event...</p>;

  if (!joined) {
    return (
      <section className="mx-auto max-w-lg px-4 py-10">
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold">Join {event.title}</h2>
          <p className="mt-1 text-sm text-slate-500">No sign-up needed. Just enter your name.</p>
          <input
            className="mt-4 w-full rounded-xl border px-4 py-3"
            value={guestName}
            placeholder="Your name"
            onChange={(e) => setGuestName(e.target.value)}
          />
          <button className="mt-4 w-full rounded-full bg-brand-violet px-4 py-3 font-semibold text-white" onClick={() => void join()}>
            Enter event
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-3 pb-12 pt-4 md:px-4">
      <header className="glass-card sticky top-2 z-20 p-4">
        <h2 className="text-xl font-bold">{event.title}</h2>
        <p className="text-xs text-slate-500">{new Date(event.date).toDateString()}</p>
        <nav className="mt-3 grid grid-cols-5 gap-1 text-[11px] md:text-xs">
          <TabButton icon={<Users size={14} />} label="Feed" active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} />
          <TabButton icon={<MessageCircle size={14} />} label="Messages" active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} />
          <TabButton icon={<Image size={14} />} label="Gallery" active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')} />
          <TabButton icon={<Video size={14} />} label="Live" active={activeTab === 'live'} onClick={() => setActiveTab('live')} />
          <TabButton icon={<Gift size={14} />} label="Gifts" active={activeTab === 'gifts'} onClick={() => setActiveTab('gifts')} />
        </nav>
      </header>

      <main className="mt-4 space-y-4">
        {(activeTab === 'feed' || activeTab === 'messages') && (
          <form className="glass-card p-4" onSubmit={(e) => void submitMessage(e)}>
            <label className="text-sm font-medium">Leave a heartfelt message</label>
            <textarea
              className="mt-2 w-full rounded-xl border px-3 py-2"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your love and wishes"
            />
            <button className="mt-2 rounded-full bg-brand-violet px-4 py-2 text-sm font-semibold text-white">Post message</button>
          </form>
        )}

        {(activeTab === 'feed' || activeTab === 'gallery') && (
          <form className="glass-card p-4" onSubmit={(e) => void submitMedia(e)}>
            <label className="text-sm font-medium">Upload photos or short videos</label>
            <input name="file" className="mt-2 w-full rounded-xl border px-3 py-2" type="file" accept="image/*,video/*" required />
            <button className="mt-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Upload</button>
          </form>
        )}

        {(activeTab === 'feed' || activeTab === 'gifts') && (
          <form className="glass-card p-4" onSubmit={(e) => void submitDonation(e)}>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-brand-text">Send Gift</label>
              <p className="text-xs font-semibold text-emerald-700">Total ${totalDonations.toFixed(2)}</p>
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <input name="amount" type="number" min="1" step="1" required className="rounded-xl border px-3 py-2" placeholder="Amount" />
              <select name="visibility" className="rounded-xl border px-3 py-2">
                <option value="public">Public</option>
                <option value="anonymous">Anonymous</option>
              </select>
              <input name="donationMessage" className="rounded-xl border px-3 py-2" placeholder="Optional message" />
            </div>
            <p className="mt-2 text-xs text-slate-500">Integrate Paystack/Flutterwave checkout before calling addDonation in production.</p>
            <button className="mt-2 rounded-full bg-brand-gold px-4 py-2 text-sm font-semibold text-slate-900">Send gift</button>
          </form>
        )}

        {(activeTab === 'feed' || activeTab === 'live') && livestreams[0] ? (
          <div className="glass-card overflow-hidden p-4">
            <p className="mb-2 text-sm font-medium">Live stream</p>
            <iframe title="event livestream" className="h-64 w-full rounded-2xl" src={livestreams[0].embed_url} allowFullScreen />
          </div>
        ) : null}

        <div className="space-y-2">
          {feed.map((item) => (
            <article className="glass-card p-4" key={`${item.kind}-${item.id}`}>
              {item.kind === 'message' ? (
                <>
                  <p className="text-xs text-slate-500">{item.actor} · {new Date(item.createdAt).toLocaleString()}</p>
                  <p className="mt-1 text-sm">{item.text}</p>
                </>
              ) : null}
              {item.kind === 'media' ? (
                <>
                  <p className="text-xs text-slate-500">{item.actor} shared a {item.mediaType}</p>
                  {item.mediaType === 'image' ? (
                    <img src={item.url} alt="Guest upload" className="mt-2 max-h-72 w-full rounded-xl object-cover" />
                  ) : (
                    <video src={item.url} controls className="mt-2 max-h-72 w-full rounded-xl object-cover" />
                  )}
                </>
              ) : null}
              {item.kind === 'donation' ? (
                <>
                  <p className="text-xs text-emerald-700">{item.actor} sent a gift · ${item.amount.toFixed(2)}</p>
                  {item.message ? <p className="mt-1 text-sm">“{item.message}”</p> : null}
                </>
              ) : null}
            </article>
          ))}
        </div>
      </main>
    </section>
  );
};

const TabButton = ({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    className={`flex items-center justify-center gap-1 rounded-full px-2 py-2 font-medium transition ${
      active ? 'bg-brand-violet text-white shadow-md' : 'bg-slate-100 text-slate-700'
    }`}
    onClick={onClick}
  >
    {icon}
    <span>{label}</span>
  </button>
);
