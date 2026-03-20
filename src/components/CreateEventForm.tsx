import { FormEvent, useState } from 'react';
import { createEvent } from '../services/eventService';
import type { EventRecord } from '../types/models';

interface CreateEventFormProps {
  onCreated: (payload: { event: EventRecord; shareLink: string; qrCode: string }) => void;
}

export const CreateEventForm = ({ onCreated }: CreateEventFormProps) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventRecord['type']>('wedding');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [cover, setCover] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await createEvent({
        title,
        type,
        date,
        description,
        coverFile: cover,
      });
      onCreated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="glass-card mx-auto mt-6 grid max-w-2xl gap-4 p-6 md:p-8">
      <h2 className="text-2xl font-bold text-brand-text">Create your event in minutes</h2>
      <label className="grid gap-1 text-sm font-medium">
        Event name
        <input className="rounded-xl border px-4 py-3" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Event type
          <select className="rounded-xl border px-4 py-3" value={type} onChange={(e) => setType(e.target.value as EventRecord['type'])}>
            <option value="wedding">Wedding</option>
            <option value="birthday">Birthday</option>
            <option value="anniversary">Anniversary</option>
            <option value="graduation">Graduation</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Date
          <input className="rounded-xl border px-4 py-3" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Event description
        <textarea
          className="rounded-xl border px-4 py-3"
          placeholder="Tell guests what this event means to you"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Cover image
        <input
          className="rounded-xl border px-4 py-3"
          type="file"
          accept="image/*"
          onChange={(e) => setCover(e.target.files?.[0] ?? null)}
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        className="rounded-full bg-brand-violet px-6 py-3 font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create event'}
      </button>
    </form>
  );
};
