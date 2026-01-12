import { createClient } from '@supabase/supabase-js';

// Environment variables provided by Vite/Vercel
// Professional Lookups: Check multiple prefixes just in case of environment mismatch
const supabaseUrl =
   import.meta.env.VITE_SUPABASE_URL ||
   process.env.NEXT_PUBLIC_SUPABASE_URL ||
   'https://zsshirgqlwgmlwafbncs.supabase.co'; // Hardcoded fallback for the current project

const supabaseAnonKey =
   import.meta.env.VITE_SUPABASE_ANON_KEY ||
   process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
   '';

// Diagnostic Logging (Safe, doesn't leak full key)
if (!supabaseUrl || !supabaseAnonKey) {
   console.warn('⚠️ Supabase Initialization Warning:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      context: import.meta.env.MODE
   });
}

// Safely initialize or return a dummy to prevent total crash
const dummySupabase = {
   auth: {
      getUser: async () => ({ data: { user: null }, error: new Error('Auth Error: Supabase URL/Key missing. Please check Vercel environment variables.') }),
      signInWithPassword: async () => ({ error: new Error('Auth Error: Supabase URL/Key missing. Please check Vercel environment variables.') }),
      signOut: async () => { },
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
      getSession: async () => ({ data: { session: null }, error: null })
   },
   from: () => ({
      select: () => ({
         eq: () => ({
            single: () => ({ data: null, error: new Error('Supabase URL/Key missing') }),
            order: () => ({ data: [], error: new Error('Supabase URL/Key missing') })
         }),
         order: () => ({ data: [], error: new Error('Supabase URL/Key missing') })
      }),
      insert: () => ({ error: new Error('Supabase URL/Key missing') }),
      update: () => ({ eq: () => ({ error: new Error('Supabase URL/Key missing') }) }),
      delete: () => ({ eq: () => ({ error: new Error('Supabase URL/Key missing') }) })
   }),
   rpc: () => ({ data: null, error: new Error('Supabase RPC Error: Supabase URL/Key missing') }),
   channel: () => ({
      on: () => ({
         subscribe: () => ({})
      })
   }),
   removeChannel: () => { }
} as any;

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseAnonKey !== 'undefined')
   ? createClient(supabaseUrl, supabaseAnonKey)
   : dummySupabase;

/**
 * Helper to get the current tenant/organization ID.
 */
export const getTenantId = async (): Promise<string | null> => {
   if (!supabaseUrl || !supabaseAnonKey) return null;

   try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
         .from('profiles')
         .select('organization_id')
         .eq('id', user.id)
         .single();

      if (error || !data) return null;
      return data.organization_id;
   } catch (e) {
      console.error("getTenantId error:", e);
      return null;
   }
};
