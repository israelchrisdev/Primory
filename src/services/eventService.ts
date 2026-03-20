import QRCode from 'qrcode';
import supabase from '../utils/supabase';
import type {
  DonationRecord,
  EventMetrics,
  EventRecord,
  FeedItem,
  GuestRecord,
  LivestreamRecord,
  MediaRecord,
  MessageRecord,
} from '../types/models';

const EVENT_BUCKET = 'event-media';

const randomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export interface CreateEventPayload {
  title: string;
  type: EventRecord['type'];
  date: string;
  description?: string;
  coverFile?: File | null;
  hostId?: string | null;
}

export const createEvent = async (payload: CreateEventPayload) => {
  let coverImageUrl: string | null = null;

  if (payload.coverFile) {
    const filePath = `covers/${Date.now()}-${payload.coverFile.name}`;
    const { error: uploadError } = await supabase.storage.from(EVENT_BUCKET).upload(filePath, payload.coverFile, {
      cacheControl: '3600',
      upsert: false,
    });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(EVENT_BUCKET).getPublicUrl(filePath);
    coverImageUrl = data.publicUrl;
  }

  const eventCode = randomCode();

  const { data, error } = await supabase
    .from('events')
    .insert({
      title: payload.title,
      type: payload.type,
      date: payload.date,
      description: payload.description ?? null,
      cover_image_url: coverImageUrl,
      event_code: eventCode,
      host_id: payload.hostId ?? null,
    })
    .select()
    .single<EventRecord>();

  if (error) throw error;

  const shareLink = `${window.location.origin}/?event=${data.event_code}`;
  const qrCode = await QRCode.toDataURL(shareLink);

  return { event: data, shareLink, qrCode };
};

export const getEventByCode = async (eventCode: string) => {
  const { data, error } = await supabase.from('events').select('*').eq('event_code', eventCode).single<EventRecord>();
  if (error) throw error;
  return data;
};

export const addGuest = async (eventId: string, name: string) => {
  const { data, error } = await supabase
    .from('guests')
    .insert({ event_id: eventId, name })
    .select()
    .single<GuestRecord>();
  if (error) throw error;
  return data;
};

export const listMessages = async (eventId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .returns<MessageRecord[]>();
  if (error) throw error;
  return data;
};

export const postMessage = async (eventId: string, guestName: string, content: string) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({ event_id: eventId, guest_name: guestName, content })
    .select()
    .single<MessageRecord>();
  if (error) throw error;
  return data;
};

export const listMedia = async (eventId: string) => {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .returns<MediaRecord[]>();
  if (error) throw error;
  return data;
};

export const uploadMedia = async (eventId: string, guestName: string, file: File, type: 'image' | 'video') => {
  const filePath = `uploads/${eventId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from(EVENT_BUCKET).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data: publicData } = supabase.storage.from(EVENT_BUCKET).getPublicUrl(filePath);

  const { data, error } = await supabase
    .from('media')
    .insert({
      event_id: eventId,
      guest_name: guestName,
      file_url: publicData.publicUrl,
      type,
    })
    .select()
    .single<MediaRecord>();

  if (error) throw error;
  return data;
};

export const listDonations = async (eventId: string) => {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .returns<DonationRecord[]>();
  if (error) throw error;
  return data;
};

export const addDonation = async (
  eventId: string,
  donorName: string,
  amount: number,
  visibility: 'public' | 'anonymous',
  message?: string,
) => {
  const { data, error } = await supabase
    .from('donations')
    .insert({
      event_id: eventId,
      donor_name: donorName,
      amount,
      visibility,
      message: message ?? null,
    })
    .select()
    .single<DonationRecord>();
  if (error) throw error;
  return data;
};

export const listLivestreams = async (eventId: string) => {
  const { data, error } = await supabase
    .from('livestreams')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .returns<LivestreamRecord[]>();
  if (error) throw error;
  return data;
};

export const getMetrics = async (eventId: string): Promise<EventMetrics> => {
  const [{ count: guests }, { count: messages }, { count: media }, donationResult] = await Promise.all([
    supabase.from('guests').select('*', { count: 'exact', head: true }).eq('event_id', eventId),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('event_id', eventId),
    supabase.from('media').select('*', { count: 'exact', head: true }).eq('event_id', eventId),
    supabase.from('donations').select('amount').eq('event_id', eventId),
  ]);

  if (donationResult.error) throw donationResult.error;

  return {
    guests: guests ?? 0,
    messages: messages ?? 0,
    media: media ?? 0,
    donationsTotal: (donationResult.data ?? []).reduce((sum, row) => sum + (row.amount ?? 0), 0),
  };
};

export const getFeed = async (eventId: string): Promise<FeedItem[]> => {
  const [messages, media, donations] = await Promise.all([listMessages(eventId), listMedia(eventId), listDonations(eventId)]);

  return [
    ...messages.map((item): FeedItem => ({
      kind: 'message',
      id: item.id,
      createdAt: item.created_at,
      actor: item.guest_name,
      text: item.content,
    })),
    ...media.map((item): FeedItem => ({
      kind: 'media',
      id: item.id,
      createdAt: item.created_at,
      actor: item.guest_name,
      mediaType: item.type,
      url: item.file_url,
    })),
    ...donations.map((item): FeedItem => ({
      kind: 'donation',
      id: item.id,
      createdAt: item.created_at,
      actor: item.visibility === 'anonymous' ? 'Anonymous' : item.donor_name,
      amount: item.amount,
      message: item.message,
      anonymous: item.visibility === 'anonymous',
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
