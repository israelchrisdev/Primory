import { supabase } from '../utils/supabase';
import type {
  DonationRecord,
  EventMetrics,
  EventRecord,
  EventType,
  FeedItem,
  LivestreamRecord,
  MediaRecord,
  MessageRecord,
} from '../types/models';

interface CreateEventInput {
  title: string;
  type: EventType;
  date: string;
  description: string;
  coverFile: File | null;
}

interface CreateEventResult {
  event: EventRecord;
  shareLink: string;
  qrCode: string;
}

const STORAGE_BUCKET = 'media';

const generateEventCode = (): string => {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
};

const getPublicFileUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export const createEvent = async ({
  title,
  type,
  date,
  description,
  coverFile,
}: CreateEventInput): Promise<CreateEventResult> => {
  let coverImageUrl: string | null = null;

  if (coverFile) {
    const fileExt = coverFile.name.split('.').pop() || 'jpg';
    const filePath = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, coverFile, { upsert: false });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    coverImageUrl = getPublicFileUrl(STORAGE_BUCKET, filePath);
  }

  for (let i = 0; i < 5; i += 1) {
    const eventCode = generateEventCode();

    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          title,
          type,
          date,
          description: description || null,
          cover_image_url: coverImageUrl,
          event_code: eventCode,
        },
      ])
      .select('*')
      .single();

    if (!error && data) {
      const event = data as EventRecord;
      const shareLink = `${window.location.origin}?event=${event.event_code}`;
      const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        shareLink,
      )}`;

      return {
        event,
        shareLink,
        qrCode,
      };
    }

    if (error?.code === '23505') {
      continue;
    }

    throw new Error(error?.message || 'Failed to create event');
  }

  throw new Error('Unable to generate a unique event code. Please try again.');
};

export const getEventByCode = async (eventCode: string): Promise<EventRecord> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_code', eventCode)
    .single();

  if (error || !data) {
    throw new Error('Event not found');
  }

  return data as EventRecord;
};

export const addGuest = async (eventId: string, name: string): Promise<void> => {
  const { error } = await supabase.from('guests').insert([
    {
      event_id: eventId,
      name,
    },
  ]);

  if (error) {
    throw new Error(error.message);
  }
};

export const postMessage = async (
  eventId: string,
  guestName: string,
  content: string,
): Promise<void> => {
  const { error } = await supabase.from('messages').insert([
    {
      event_id: eventId,
      guest_name: guestName || 'Guest',
      content,
    },
  ]);

  if (error) {
    throw new Error(error.message);
  }
};

export const uploadMedia = async (
  eventId: string,
  guestName: string,
  file: File,
  mediaType: 'image' | 'video',
): Promise<void> => {
  const fileExt = file.name.split('.').pop() || 'bin';
  const filePath = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, { upsert: false });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const fileUrl = getPublicFileUrl(STORAGE_BUCKET, filePath);

  const { error } = await supabase.from('media').insert([
    {
      event_id: eventId,
      guest_name: guestName || 'Guest',
      file_url: fileUrl,
      type: mediaType,
    },
  ]);

  if (error) {
    throw new Error(error.message);
  }
};

export const addDonation = async (
  eventId: string,
  donorName: string,
  amount: number,
  visibility: 'public' | 'anonymous',
  message: string,
): Promise<void> => {
  const { error } = await supabase.from('donations').insert([
    {
      event_id: eventId,
      donor_name: donorName || 'Guest',
      amount,
      visibility,
      message: message || null,
    },
  ]);

  if (error) {
    throw new Error(error.message);
  }
};

export const listLivestreams = async (eventId: string): Promise<LivestreamRecord[]> => {
  const { data, error } = await supabase
    .from('livestreams')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as LivestreamRecord[];
};

export const getFeed = async (eventId: string): Promise<FeedItem[]> => {
  const [messagesResult, mediaResult, donationsResult] = await Promise.all([
    supabase.from('messages').select('*').eq('event_id', eventId).order('created_at', { ascending: false }),
    supabase.from('media').select('*').eq('event_id', eventId).order('created_at', { ascending: false }),
    supabase.from('donations').select('*').eq('event_id', eventId).order('created_at', { ascending: false }),
  ]);

  if (messagesResult.error) {
    throw new Error(messagesResult.error.message);
  }

  if (mediaResult.error) {
    throw new Error(mediaResult.error.message);
  }

  if (donationsResult.error) {
    throw new Error(donationsResult.error.message);
  }

  const messageItems: FeedItem[] = ((messagesResult.data || []) as MessageRecord[]).map((item) => ({
    kind: 'message',
    id: item.id,
    createdAt: item.created_at,
    actor: item.guest_name,
    text: item.content,
  }));

  const mediaItems: FeedItem[] = ((mediaResult.data || []) as MediaRecord[]).map((item) => ({
    kind: 'media',
    id: item.id,
    createdAt: item.created_at,
    actor: item.guest_name,
    mediaType: item.type,
    url: item.file_url,
  }));

  const donationItems: FeedItem[] = ((donationsResult.data || []) as DonationRecord[]).map((item) => ({
    kind: 'donation',
    id: item.id,
    createdAt: item.created_at,
    actor: item.visibility === 'anonymous' ? 'Anonymous' : item.donor_name,
    amount: Number(item.amount),
    message: item.message,
    anonymous: item.visibility === 'anonymous',
  }));

  return [...messageItems, ...mediaItems, ...donationItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

export const getMetrics = async (eventId: string): Promise<EventMetrics> => {
  const [guestsResult, messagesResult, mediaResult, donationsResult] = await Promise.all([
    supabase.from('guests').select('id', { count: 'exact', head: true }).eq('event_id', eventId),
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('event_id', eventId),
    supabase.from('media').select('id', { count: 'exact', head: true }).eq('event_id', eventId),
    supabase.from('donations').select('amount').eq('event_id', eventId),
  ]);

  if (guestsResult.error) {
    throw new Error(guestsResult.error.message);
  }

  if (messagesResult.error) {
    throw new Error(messagesResult.error.message);
  }

  if (mediaResult.error) {
    throw new Error(mediaResult.error.message);
  }

  if (donationsResult.error) {
    throw new Error(donationsResult.error.message);
  }

  const donationsTotal = ((donationsResult.data || []) as Pick<DonationRecord, 'amount'>[]).reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );

  return {
    guests: guestsResult.count || 0,
    messages: messagesResult.count || 0,
    media: mediaResult.count || 0,
    donationsTotal,
  };
};