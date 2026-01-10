
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "npm:resend"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend('re_Xn8x1xDm_56f2m6bKy5akv1TytPqbJ1H5');


serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      client_id, 
      barber_id, 
      service_id, 
      start_time, 
      duration_minutes, 
      organization_id,
      price 
    } = await req.json()

    // 1. Validate Input
    if (!client_id || !barber_id || !start_time || !organization_id) {
      throw new Error("Missing required fields")
    }

    const startDate = new Date(start_time)
    const endDate = new Date(startDate.getTime() + duration_minutes * 60000)

    // 2. Check for Conflicts (Double Booking)
    const { data: conflicts, error: conflictError } = await supabase
      .from('appointments')
      .select('id')
      .eq('barber_id', barber_id)
      .eq('organization_id', organization_id)
      .neq('status', 'CANCELLED')
      .or(`and(start_time.lte.${startDate.toISOString()},expected_end_time.gt.${startDate.toISOString()}),and(start_time.lt.${endDate.toISOString()},expected_end_time.gte.${endDate.toISOString()})`)

    if (conflictError) throw conflictError

    if (conflicts && conflicts.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Time slot is already booked', conflict: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      )
    }


    // 3. Create Appointment
    const { data: newAppointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        client_id,
        barber_id,
        service_id,
        start_time: startDate.toISOString(),
        expected_end_time: endDate.toISOString(),
        organization_id,
        price,
        duration_minutes,
        status: 'CONFIRMED'
      })
      .select('*, clients(*), barbers(*), services(*)') // Fetch related data for email
      .single()

    if (insertError) throw insertError

    // 4. Send Confirmation Email (Resend SDK)
    if (newAppointment.clients?.email) {
      console.log(`📧 Sending email to ${newAppointment.clients.email}`);
      
      try {
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'Chronos Barber <onboarding@resend.dev>',
          to: [newAppointment.clients.email],
          subject: 'Confirmación de Reserva',
          html: `
            <h1>✅ Tu Cita está Confirmada</h1>
            <p>Hola <strong>${newAppointment.clients.name}</strong>,</p>
            <p>Tu reserva ha sido agendada con éxito:</p>
            <ul>
              <li><strong>Barbero:</strong> ${newAppointment.barbers.name}</li>
              <li><strong>Servicio:</strong> ${newAppointment.services.name}</li>
              <li><strong>Fecha:</strong> ${new Date(newAppointment.start_time).toLocaleString()}</li>
              <li><strong>Precio:</strong> $${newAppointment.price}</li>
            </ul>
            <p>¡Te esperamos!</p>
          `
        });

        if (emailError) {
          console.error('Resend Error:', emailError);
        } else {
          console.log('Email sent details:', emailData);
        }
      } catch (err) {
        console.error('Email sending exception:', err);
      }
    }

    return new Response(
      JSON.stringify({ data: newAppointment, message: 'Booking confirmed and email sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
