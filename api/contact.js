// This runs on Vercel's servers, NOT in the browser — that's on purpose.
// The Discord webhook URL is read from an environment variable
// (DISCORD_WEBHOOK_URL) instead of being written here, so it never
// appears in this public repo. Set it once in Vercel:
// Project → Settings → Environment Variables.

const PINGED_USER_IDS = ["1312135134165729394", "1488208544581816462"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error("Missing DISCORD_WEBHOOK_URL environment variable");
      res.status(500).json({ error: "Contact form isn't configured yet" });
      return;
    }

    const body = req.body || {};
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const company = String(body.company || "").trim();
    const projectLink = String(body.projectLink || "").trim();
    const message = String(body.message || "").trim();

    if (!name || !email) {
      res.status(400).json({ error: "Name and email are required" });
      return;
    }

    // A basic length cap so nobody can send a giant payload through the form.
    const clip = (str, max = 1000) => (str.length > max ? str.slice(0, max) + "…" : str);

    const payload = {
      content: PINGED_USER_IDS.map((id) => `<@${id}>`).join(" "),
      allowed_mentions: { users: PINGED_USER_IDS },
      embeds: [
        {
          title: "New contact form submission",
          color: 0x9be05a,
          fields: [
            { name: "Name", value: clip(name), inline: true },
            { name: "Email", value: clip(email), inline: true },
            { name: "Company / Studio", value: company ? clip(company) : "—", inline: true },
            { name: "Project / Game Link", value: projectLink ? clip(projectLink) : "—", inline: false },
            { name: "Message", value: message ? clip(message, 1500) : "—", inline: false },
          ],
          footer: { text: "Please reach back to the user via email (using the brickstudios email), and react to this message with a ✅ if you have responded to the user." },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error("Discord webhook error:", discordRes.status, errText);
      res.status(502).json({ error: "Could not deliver the message to Discord" });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Unknown server error" });
  }
}
