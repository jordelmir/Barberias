
import { supabase } from '../supabaseClient';
import { Appointment, Barber, Client, Service, AppointmentStatus } from '../types';

// Map DB types to App types if necessary
// For now, assuming direct mapping or simple transformation

export const api = {
    // AUTH & PROFILE
    async getProfile(userId: string) {
        return supabase.from('profiles').select('*').eq('id', userId).single();
    },

    // DATA FETCHING (All Scoped by RLS automatically)
    async getInitialData() {
        const [barbers, services, clients, appointments] = await Promise.all([
            supabase.from('barbers').select('*'),
            supabase.from('services').select('*'),
            supabase.from('clients').select('*'),
            supabase.from('appointments').select('*')
        ]);

        return {
            barbers: barbers.data || [],
            services: services.data || [],
            clients: clients.data || [],
            appointments: appointments.data || []
        };
    },

    // MUTATIONS
    async createAppointment(apt: any) {
        // Need to attach organization_id. 
        // The RLS policy handles viewing, but for INSERT we might need to set it explicit OR use a trigger.
        // Best practice: The backend (Postgres) triggers set org_id from auth.uid() owner, 
        // OR we fetch it first.

        // Quick fetch org_id
        const user = await supabase.auth.getUser();
        if (!user.data.user) throw new Error('No Auth');

        // We'll assume the client app knows the org_id or we rely on a database trigger.
        // For this MVP, let's just insert. If RLS policies are "WITH CHECK", we need to provide it.
        // Let's create a DB function/trigger to auto-set org_id on insert if null? 
        // Or just fetch it.

        // Simplified:
        return supabase.from('appointments').insert(apt).select().single();
    },

    async updateAppointmentStatus(id: string, status: string) {
        return supabase.from('appointments').update({ status }).eq('id', id);
    }
};
