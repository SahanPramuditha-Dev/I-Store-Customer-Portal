// Supabase Edge Function: verify-staff-pin
// Deployed at: https://bibwrndmbugtlyuvpmzi.supabase.co/functions/v1/verify-staff-pin
//
// Called by the Customer Portal Admin Panel login gate.
// Accepts {username, pin}, fetches the bcrypt hash from staff_pins table,
// and returns {ok: true, role} or {ok: false, error}.
//
// The plain PIN is NEVER stored — only bcrypt hashes synced from the POS software.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://i-store-customer-portal-one.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { username?: string; pin?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { username, pin } = body;

  if (!username || !pin) {
    return new Response(JSON.stringify({ ok: false, error: "Username and PIN are required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Use service role key — this bypasses RLS to query the protected staff_pins table
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase
    .from("staff_pins")
    .select("username, role, pin_hash")
    .eq("username", username.trim().toLowerCase())
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ ok: false, error: "Staff account not found" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify the entered PIN against the bcrypt hash from the POS software
  const isValid = await bcrypt.compare(pin, data.pin_hash);

  if (!isValid) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid PIN" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ ok: true, username: data.username, role: data.role }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
