
import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Appointment } from '../types';

export const useRealtimeAppointments = (
  organizationId: string | null,
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>
) => {
  useEffect(() => {
    if (!organizationId) return;

    console.log('🔌 Connecting to Realtime for Org:', organizationId);

    const subscription = supabase
      .channel('public:appointments')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'appointments',
          filter: `organization_id=eq.${organizationId}`, // Filter by tenant!
        },
        (payload) => {
          console.log('⚡ Realtime Update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setAppointments((prev) => [...prev, payload.new as Appointment]);
          } else if (payload.eventType === 'UPDATE') {
            setAppointments((prev) =>
              prev.map((apt) => (apt.id === payload.new.id ? (payload.new as Appointment) : apt))
            );
          } else if (payload.eventType === 'DELETE') {
            setAppointments((prev) => prev.filter((apt) => apt.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime Connected');
        }
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [organizationId, setAppointments]);
};
