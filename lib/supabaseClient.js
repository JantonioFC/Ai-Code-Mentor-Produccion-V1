// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Para testing con Node.js - configuración directa
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://roplclxuerplxrnsnfra.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvcGxjbHh1ZXJwbHhybnNuZnJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4OTA2NDgsImV4cCI6MjA3MjQ2NjY0OH0.DIcEeOhkuLkWIRWff8ytgkoEwdeRSSV8nVL9mkmouKg';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
