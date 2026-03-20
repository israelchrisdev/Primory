export type EventType = 'wedding' | 'birthday' | 'anniversary' | 'graduation' | 'other';

export interface EventRecord {
  id: string;
  title: string;
  type: EventType;
  date: string;
  description: string | null;
  cover_image_url: string | null;
  event_code: string;
  host_id: string | null;
}

export interface GuestRecord {
  id: string;
  event_id: string;
  name: string;
  joined_at: string;
}

export interface MessageRecord {
  id: string;
  event_id: string;
  guest_name: string;
  content: string;
  created_at: string;
}

export interface MediaRecord {
  id: string;
  event_id: string;
  guest_name: string;
  file_url: string;
  type: 'image' | 'video';
  created_at: string;
}

export interface DonationRecord {
  id: string;
  event_id: string;
  donor_name: string;
  amount: number;
  message: string | null;
  visibility: 'public' | 'anonymous';
  created_at: string;
}

export interface LivestreamRecord {
  id: string;
  event_id: string;
  embed_url: string;
  platform: 'youtube' | 'zoom';
  created_at: string;
}

export interface EventMetrics {
  guests: number;
  messages: number;
  media: number;
  donationsTotal: number;
}

export type FeedItem =
  | { kind: 'message'; id: string; createdAt: string; actor: string; text: string }
  | { kind: 'media'; id: string; createdAt: string; actor: string; mediaType: 'image' | 'video'; url: string }
  | { kind: 'donation'; id: string; createdAt: string; actor: string; amount: number; message: string | null; anonymous: boolean };
