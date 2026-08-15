import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isLiveSupabase = Boolean(
  rawUrl &&
  !rawUrl.includes('bibwrndmbugtlyuvpmzi') &&
  rawUrl.startsWith('https://')
);

export const supabase: any = isLiveSupabase
  ? createClient(rawUrl, rawKey)
  : {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
            single: async () => ({ data: null, error: null }),
          }),
          ilike: () => ({
            limit: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
          order: () => ({
            limit: async () => ({ data: [], error: null }),
          }),
          gte: async () => ({ count: 0, data: [], error: null }),
          neq: async () => ({ count: 0, data: [], error: null }),
        }),
        insert: async () => ({ data: null, error: null }),
      }),
    };
