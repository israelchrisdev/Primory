# Primory

Premium, mobile-first private event spaces for memories, messages, media, livestreams, and gifts.

## Stack
- React + TypeScript + Vite
- Tailwind CSS
- Supabase (database, storage, and auth-ready architecture)

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env file:
   ```bash
   cp .env.example .env
   ```
3. Add Supabase credentials to `.env`.
4. Run SQL in `supabase/schema.sql`.
5. Start dev server:
   ```bash
   npm run dev
   ```

## Architecture
- `src/utils/supabase.ts` exports default configured client.
- `src/services/eventService.ts` holds modular data operations.
- `src/components/*` contains scalable UI building blocks.
- `src/App.tsx` manages the flow between landing/create/join/host/event views.
