
import { createClient } from '@supabase/supabase-js';

// These environment variables will be provided by Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper to get the current tenant/organization ID.
 * In a real app, this comes from the user's profile or metadata.
 */
export const getTenantId = async (): Promise<string | null> => {
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) return null;
   
   // Fetch profile to get org_id
   const { data, error } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
        
   if (error || !data) return null;
   return data.organization_id;
};
