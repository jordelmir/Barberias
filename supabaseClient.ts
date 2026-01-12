import { createClient } from '@supabase/supabase-js';

// Environment variables provided by Vite/Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Safely initialize or return a dummy to prevent total crash
const dummySupabase = {
   auth: {
      getUser: async () => ({ data: { user: null }, error: new Error('Supabase URL/Key missing') }),
      signInWithPassword: async () => ({ error: new Error('Supabase URL/Key missing') }),
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
   rpc: () => ({ data: null, error: new Error('Supabase URL/Key missing') }),
   channel: () => ({
      on: () => ({
         subscribe: () => ({})
      })
   }),
   removeChannel: () => { }
} as any;

export const supabase = (supabaseUrl && supabaseAnonKey)
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
