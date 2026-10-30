import { TEAM_MEMBERS } from "../js/team-config.js";

function defaultAvatarIndex(userId, discriminator) {
  if (discriminator && discriminator !== "0") {
    return Number(discriminator) % 5;
  }

  try {
    return Number((BigInt(userId) >> 22n) % 6n);
  } catch {
    return 0;
  }
}

function avatarUrl(user) {
  if (user.avatar) {
    const format = user.avatar.startsWith("a_") ? "gif" : "webp";
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${format}?size=256`;
  }

  const index = defaultAvatarIndex(user.id, user.discriminator);
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    res.status(503).json({ error: "Discord team profiles are not configured yet" });
    return;
  }

  try {
    const members = await Promise.all(
      TEAM_MEMBERS.map(async (member) => {
        const response = await fetch(
          `https://discord.com/api/v10/users/${member.discordId}`,
          { headers: { Authorization: `Bot ${token}` } }
        );

        if (!response.ok) {
          return { id: member.discordId, unavailable: true };
        }

        const user = await response.json();
        return {
          id: user.id,
          username: user.username,
          displayName: user.global_name || user.username,
          avatarUrl: avatarUrl(user),
        };
      })
    );

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json({ members });
  } catch (err) {
    res.status(500).json({ error: err.message || "Could not load Discord profiles" });
  }
}

