// Sends a phone alert to the golfers who played, when a league admin publishes results.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const asCaller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { leagueId, golferIds, title, body, url: link } = await req.json();
    const { data: isOwner } = await asCaller.rpc("is_owner", { lid: leagueId });
    if (!isOwner) return json({ error: "not allowed" }, 403);

    webpush.setVapidDetails(
      Deno.env.get("VAPID_SUBJECT")!,
      Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!,
    );
    const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: subs, error } = await db.from("push_subs").select("endpoint, sub")
      .eq("league_id", leagueId).in("golfer_id", golferIds ?? []);
    if (error) throw error;

    let sent = 0, failed = 0;
    const gone: string[] = [];
    await Promise.all((subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(s.sub, JSON.stringify({ title, body, url: link }), { TTL: 86400 });
        sent++;
      } catch (e) {
        failed++;
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone.push(s.endpoint); // phone turned alerts off
      }
    }));
    if (gone.length) await db.from("push_subs").delete().in("endpoint", gone); // all leagues: the phone is gone
    return json({ sent, failed, removed: gone.length });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
