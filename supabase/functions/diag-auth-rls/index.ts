// File: supabase/functions/diag-auth-rls/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

Deno.serve(async (req: Request) => {
    // CORS Headers
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Content-Type": "application/json"
    };

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const headers = Object.fromEntries(req.headers.entries());
        const authHeader = headers.authorization || "";
        const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
        const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : body.token;

        // Use provided token for RLS context, or service role for admin bypass
        const client = token
            ? createClient(SUPABASE_URL, token, { auth: { persistSession: false } })
            : createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

        // 1. Get Auth Info
        const { data: { user }, error: authError } = await client.auth.getUser();
        const uid = user?.id || null;

        // 2. Call RLS Helper Function directly
        const { data: org_id, error: rpcError } = await client.rpc("get_current_org_id");

        // 3. Visibility Checks
        const counts = { profiles: 0, clients: 0, appointments: 0 };

        const { data: qProfiles } = await client.from("profiles").select("id").limit(1000);
        if (qProfiles) counts.profiles = qProfiles.length;

        const { data: qClients } = await client.from("clients").select("id").limit(1000);
        if (qClients) counts.clients = qClients.length;

        const { data: qAppointments } = await client.from("appointments").select("id").limit(1000);
        if (qAppointments) counts.appointments = qAppointments.length;

        // 4. Fetch own profile if UID exists
        let profile: any = null;
        if (uid) {
            const { data: profileRes } = await client.from("profiles").select("*").eq("id", uid).maybeSingle();
            profile = profileRes;
        }

        const out = {
            using_token: !!token,
            uid,
            org_id,
            visible_counts: counts,
            sample_profile: profile,
            rpc_error: rpcError?.message || null,
            auth_error: authError?.message || null,
            notes: [
                "If uid is null, the token might be invalid or expired.",
                "If org_id is null, get_current_org_id() is returning NULL (blocked or no profile matching auth.uid()).",
                "Visible counts show what RLS allows this specific user to see."
            ]
        };

        return new Response(JSON.stringify(out), { headers: corsHeaders });
    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
