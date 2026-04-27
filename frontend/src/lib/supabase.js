import { createClient } from '@supabase/supabase-js';

// Debug logging (temporary)
console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Automatically remove incorrect suffixes if present
if (supabaseUrl) {
  supabaseUrl = supabaseUrl
    .replace('/rest/v1', '')
    .replace('/auth/v1', '')
    .replace(/\/$/, ''); // Also remove trailing slash if any
}

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables are missing or invalid');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
