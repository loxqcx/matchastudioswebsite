// This runs on Vercel's servers, NOT in the browser.
// That matters because Roblox's API blocks direct requests from
// random websites (CORS), but it's happy to answer server-to-server
// requests. This function is the bridge: your site calls
// "/api/stats", and this code fetches the real numbers from Roblox
// and hands them back.
//
// Peak CCU (all-time high) is stored in a free Upstash Redis database
// so it's remembered across every visitor, forever — not just during
// one person's browser session. See README.md → "Peak CCU setup" for
// the one-time setup step. If it isn't configured yet, this falls back
// to just showing the current player count as the peak, so the site
// never breaks either way.

const PEAK_KEY = "matcha_studio_peak_ccu";

async function getStoredPeak() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const r = await fetch(`${url}/get/${PEAK_KEY}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  const data = await r.json();
  const value = Number(data.result);
  return Number.isFinite(value) ? value : null;
}

async function setStoredPeak(value) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;

  await fetch(`${url}/set/${PEAK_KEY}/${value}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export default async function handler(req, res) {
  try {
    const placeIdsParam = req.query.placeIds;

    if (!placeIdsParam) {
      res.status(400).json({ error: "Missing placeIds query parameter" });
      return;
    }

    const placeIds = placeIdsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (placeIds.length === 0) {
      res.status(400).json({ error: "No valid placeIds provided" });
      return;
    }

    // Step 1: convert each placeId -> universeId.
    // Roblox game stats are stored per "universe", not per place,
    // so we need this translation step first.
    const universeLookups = await Promise.all(
      placeIds.map(async (placeId) => {
        try {
          const r = await fetch(
            `https://apis.roblox.com/universes/v1/places/${placeId}/universe`
          );
          if (!r.ok) return { placeId, universeId: null };
          const data = await r.json();
          return { placeId, universeId: data.universeId ?? null };
        } catch {
          return { placeId, universeId: null };
        }
      })
    );

    const validUniverseIds = universeLookups
      .map((u) => u.universeId)
      .filter((id) => id !== null);

    if (validUniverseIds.length === 0) {
      res.status(502).json({ error: "Could not resolve any universe IDs from Roblox" });
      return;
    }

    // Step 2: fetch live game data (current players + total visits)
    // for all universes in a single request.
    const gamesRes = await fetch(
      `https://games.roblox.com/v1/games?universeIds=${validUniverseIds.join(",")}`
    );

    if (!gamesRes.ok) {
      res.status(502).json({ error: "Roblox games API request failed" });
      return;
    }

    const gamesJson = await gamesRes.json();
    const gamesById = new Map((gamesJson.data || []).map((g) => [g.id, g]));

    // Fetch every published thumbnail for each universe. Thumbnail failures
    // are non-fatal so live stats still work if Roblox's image API is down.
    const thumbnailsByUniverseId = new Map();
    try {
      const thumbnailsRes = await fetch(
        `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${validUniverseIds.join(",")}&countPerUniverse=10&defaults=true&size=768x432&format=Webp&isCircular=false`
      );

      if (thumbnailsRes.ok) {
        const thumbnailsJson = await thumbnailsRes.json();
        (thumbnailsJson.data || []).forEach((entry) => {
          const urls = (entry.thumbnails || [])
            .filter((thumbnail) => thumbnail.state === "Completed" && thumbnail.imageUrl)
            .map((thumbnail) => thumbnail.imageUrl);
          thumbnailsByUniverseId.set(String(entry.universeId), [...new Set(urls)]);
        });
      }
    } catch (err) {
      console.error("Roblox thumbnail request failed:", err);
    }

    // Step 3: merge everything back together, keyed by placeId so
    // the frontend can match stats and thumbnails to the right game card.
    const games = universeLookups.map(({ placeId, universeId }) => {
      const g = universeId ? gamesById.get(universeId) : null;
      return {
        placeId,
        universeId,
        name: g ? g.name : null,
        playing: g ? g.playing : 0,
        visits: g ? g.visits : 0,
        thumbnails: universeId
          ? thumbnailsByUniverseId.get(String(universeId)) || []
          : [],
      };
    });

    const totals = games.reduce(
      (acc, g) => {
        acc.players += g.playing;
        acc.visits += g.visits;
        return acc;
      },
      { players: 0, visits: 0 }
    );
    totals.projects = games.length;

    // Compare the current player count against the stored all-time
    // peak, and update it if we've got a new high. Falls back to just
    // using the current count if Upstash isn't set up yet.
    let peak = totals.players;
    try {
      const storedPeak = await getStoredPeak();
      if (storedPeak === null || totals.players > storedPeak) {
        await setStoredPeak(totals.players);
        peak = totals.players;
      } else {
        peak = storedPeak;
      }
    } catch (err) {
      console.error("Peak CCU tracking failed, falling back to current count:", err);
    }
    totals.peak = peak;

    // Cache for 30s at the edge so a burst of visitors doesn't
    // hammer Roblox's API, but numbers still stay close to live.
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=59");
    res.status(200).json({ games, totals });
  } catch (err) {
    res.status(500).json({ error: err.message || "Unknown server error" });
  }
}
