import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bibwrndmbugtlyuvpmzi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpYndybmRtYnVndGx5dXZwbXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NDAwNDEsImV4cCI6MjEwMTUxNjA0MX0.LyGYmfs4ib7m09Hhwhogx37yLBQC4bAx-v_95DFt-v4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
