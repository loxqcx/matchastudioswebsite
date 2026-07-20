# Matcha Studio — website

A game-studio website (like the Atlantic Interactive site) with **real, live
stats pulled from Roblox** — active players and total visits are never typed
in by hand, they're fetched automatically.

## What's in here

```
index.html          → Home page
experiences.html     → Full "Our Games" page
css/style.css        → All the styling
js/games-config.js   → ⭐ EDIT THIS to add/remove/change your games
js/main.js           → Fetches live stats and builds the game cards (no need to edit)
api/stats.js         → Server-side function that talks to Roblox's API
images/              → Put your game thumbnail images here
```

## Step 1: Customize your games (the only file you need to edit)

Open `js/games-config.js`. Each game looks like this:

```js
{
  name: "Traitor VS Sheriff DUELS",
  description: "A competitive duel experience...",
  image: "images/game-placeholder-1.png",
  placeId: 119068914321553,
  link: "https://www.roblox.com/games/119068914321553/Traitor-VS-Sheriff-DUELS",
  ctaText: "Enter the Duel"
}
```

- **placeId**: the number in your game's Roblox URL. If your link is
  `roblox.com/games/119068914321553/My-Game`, the placeId is `119068914321553`.
- **image**: drop a thumbnail (PNG/JPG) into the `images` folder and point to it here.
- Copy/paste a whole `{ ... }` block to add a game, or delete one to remove it.

Also rename "Matcha Studio" in `index.html`, `experiences.html`, and the
`<title>` tags to your actual studio name.

## Step 2: How the "live" stats actually work

Roblox blocks websites from calling its API directly from the browser
(a security rule called CORS). To get around that correctly (not with a
sketchy third-party proxy), `api/stats.js` runs **on the server** and:

1. Turns each `placeId` into a `universeId` (Roblox's internal game ID)
2. Asks Roblox for that universe's current player count (`playing`) and
   `visits`
3. Adds them all up and sends the totals + per-game numbers back to your page

Your page then refreshes these numbers every 60 seconds automatically.
This only works once the site is deployed to Vercel (see below) — it won't
fetch real numbers if you just double-click `index.html` on your computer,
since there's no server to run `api/stats.js`.

## Step 3: Deploy it for free (Vercel — recommended)

Vercel is a good fit here because it runs `api/stats.js` for you automatically,
for free, with no configuration.

1. Go to **vercel.com** and sign up (you can sign up with GitHub, which makes step 2 easier).
2. Put this project in its own GitHub repository:
   - Easiest way if you don't know Git: go to **github.com/new**, create a repo,
     then use the "uploading an existing file" link on the new repo's page and
     drag in all the files/folders from this project.
   - If you're comfortable with a terminal:
     ```
     cd studio-site
     git init
     git add .
     git commit -m "first version"
     git branch -M main
     git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
     git push -u origin main
     ```
3. In Vercel, click **Add New → Project**, pick your GitHub repo, and click
   **Deploy**. Leave the framework preset as "Other" — no build settings needed.
4. After ~30 seconds you'll get a live URL like `your-project.vercel.app`.

Any time you push new changes to GitHub, Vercel automatically redeploys.

### Updating your games later

Edit `js/games-config.js`, save, and either:
- push the change to GitHub (if you deployed via GitHub — Vercel redeploys automatically), or
- if you uploaded manually, go back to your GitHub repo, edit the file directly
  in the browser (pencil icon), and commit — Vercel will pick it up.

## Updating your site later (no new repo needed)

You never need to create a new repository again. To change anything —
games, logo, colors, wording — just replace the file inside your
**existing** GitHub repo, and Vercel redeploys automatically:

1. Go to your repo on GitHub (e.g. `github.com/YOUR-USERNAME/matchastudioswebsite`).
2. Click into the file you want to change (e.g. `js/games-config.js`).
3. Click the **pencil icon** (top right of the file view) to edit it in the browser.
4. Select all the text (Ctrl/Cmd+A) and delete it, then paste in the new version.
5. Scroll down, type a short commit message, click **Commit changes**.
6. That's it — no re-importing, no new project. Vercel watches this repo
   and automatically redeploys within about a minute. Refresh your site
   after a minute to see the change live.

For files GitHub can't edit as text (like an image), instead: open the
folder it belongs in (e.g. `images`), click **Add file → Upload files**,
drag in the new image **with the exact same filename** as the one you're
replacing, and commit — GitHub will ask to confirm you're replacing it.

## Clean URLs (no .html in the address bar)

`vercel.json` in this project tells Vercel to serve `experiences.html` at
`/experiences` and `index.html` at `/` — so links and the address bar never
show `.html`. This only takes effect once deployed on Vercel (it won't do
anything if you just open the files locally). Nothing else to configure —
just make sure `vercel.json` is uploaded to the repo root alongside
`index.html`.

## Alternative: Netlify (also free)

Netlify's free tier also supports serverless functions, but the folder needs
to be named `netlify/functions` instead of `api`, and the fetch path becomes
`/.netlify/functions/stats` instead of `/api/stats`. If you'd rather use
Netlify, ask and I'll give you the Netlify-specific version of these two files.

## Alternative: GitHub Pages (static only — no live stats)

GitHub Pages is free and simple but **cannot run `api/stats.js`** (it only
hosts static files, no server code). If you use GitHub Pages, the site will
work but the stats will show "—" instead of real numbers, since there's
nowhere for the API calls to run. Vercel is the better choice for this project.

## Contact form setup (sends to your Discord server)

The form on the home page posts to `/api/contact`, which forwards it to a
Discord webhook — pinging two specific people and leaving a note to reply
by email. **The webhook URL is not stored in this code**, since this repo
is public and anyone could see and abuse it. Instead, it lives in a
Vercel Environment Variable:

1. Go to your project on **vercel.com** → click into it → **Settings** → **Environment Variables**.
2. Add a new variable:
   - **Key:** `DISCORD_WEBHOOK_URL`
   - **Value:** your actual Discord webhook URL (starts with `https://discord.com/api/webhooks/...`)
   - **Environment:** select all (Production, Preview, Development)
3. Click **Save**.
4. Go to the **Deployments** tab and redeploy the latest deployment (click the "..." menu on it → **Redeploy**) so the new variable takes effect — environment variables only apply to deployments made *after* you add them.

To change who gets pinged, open `api/contact.js` and edit the two IDs in
the `PINGED_USER_IDS` list near the top of the file.

If you ever want to rotate the webhook (e.g. it leaked or you want a new
channel), just create a new webhook in Discord's channel settings and
update the Environment Variable's value the same way — no code changes
needed.
