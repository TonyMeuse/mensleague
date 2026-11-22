// Reads a league's current Golf Canada handicaps from its Golf Genius portal (opened with the league's GGID code).
// Only a league admin can call it. Returns [{ name, index }] where index is the text shown, e.g. "18.7", "+2.4" or "".
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const GG = "https://www.golfgenius.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const decode = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'")
  .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

// Fetch a page, keeping Golf Genius's cookies and following redirects ourselves
async function get(url: string, jar: Map<string, string>, hops = 0): Promise<{ url: string; text: string }> {
  const r = await fetch(url, {
    redirect: "manual",
    headers: { "User-Agent": UA, cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; ") },
  });
  for (const c of r.headers.getSetCookie?.() ?? []) {
    const kv = c.split(";")[0]; const i = kv.indexOf("=");
    if (i > 0) jar.set(kv.slice(0, i).trim(), kv.slice(i + 1));
  }
  const loc = r.headers.get("location");
  if (r.status >= 300 && r.status < 400 && loc && hops < 8) { await r.body?.cancel(); return get(new URL(loc, url).href, jar, hops + 1); }
  if (!r.ok) throw new Error(`Golf Genius answered ${r.status} for ${url}`);
  return { url, text: await r.text() };
}

async function readRoster(ggid: string) {
  const jar = new Map<string, string>();
  const home = await get(`${GG}/ggid/${encodeURIComponent(ggid)}`, jar);
  // The portal menu links to a "Players" page; that page shows the roster in a widget
  const page = home.text.match(/href="(\/pages\/\d+)"[^>]*>\s*Players\s*</i)?.[1];
  if (!page) throw new Error("Could not find the Players page on the Golf Genius portal. Is the GGID right?");
  const playersPage = await get(GG + page, jar);
  const widget = playersPage.text.match(/(\/leagues\/\d+\/widgets\/players[^"'\s<>\\]*)/)?.[1];
  if (!widget) throw new Error("Could not find the player roster on the Players page.");
  const table = await get(new URL(widget.replace(/&amp;/g, "&"), GG).href, jar);
  const players: { name: string; index: string }[] = [];
  for (const row of table.text.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) ?? []) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => decode(m[1]));
    if (cells.length >= 2 && cells[0]) players.push({ name: cells[0], index: cells[1] });
  }
  if (!players.length) throw new Error("The Golf Genius roster was empty or could not be read.");
  const title = decode(home.text.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "").replace(/ :: .*$/, "");
  return { title, players };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { leagueId, ggid } = await req.json();
    const asCaller = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: isOwner } = await asCaller.rpc("is_owner", { lid: leagueId });
    if (!isOwner) return json({ error: "not allowed" }, 403);
    if (!ggid || !/^[A-Za-z0-9]{3,12}$/.test(ggid)) return json({ error: "Please enter the league's Golf Genius GGID code." }, 400);
    return json(await readRoster(ggid));
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
