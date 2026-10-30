import { TEAM_MEMBERS } from "./team-config.js";

function defaultAvatarUrl(userId) {
  try {
    const index = Number((BigInt(userId) >> 22n) % 6n);
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  } catch {
    return "https://cdn.discordapp.com/embed/avatars/0.png";
  }
}

function createTeamCard(member, profile) {
  const card = document.createElement("article");
  card.className = "team-card";

  const avatarWrap = document.createElement("div");
  avatarWrap.className = "team-card__avatar-wrap";

  const avatar = document.createElement("img");
  avatar.className = "team-card__avatar";
  avatar.src = profile?.avatarUrl || defaultAvatarUrl(member.discordId);
  avatar.alt = "";
  avatar.loading = "lazy";
  avatar.addEventListener("error", () => {
    avatar.src = defaultAvatarUrl(member.discordId);
  }, { once: true });
  avatarWrap.appendChild(avatar);

  const status = document.createElement("span");
  status.className = "team-card__status";
  status.setAttribute("aria-hidden", "true");
  avatarWrap.appendChild(status);

  const body = document.createElement("div");
  body.className = "team-card__body";

  const role = document.createElement("span");
  role.className = "team-card__role";
  role.textContent = member.role || "Team Member";

  const name = document.createElement("h2");
  name.textContent = profile?.displayName || member.fallbackName || "Team Member";

  const username = document.createElement("p");
  username.className = "team-card__username";
  username.textContent = profile?.username ? `@${profile.username}` : "Discord profile";

  const link = document.createElement("a");
  link.className = "team-card__link";
  link.href = `https://discord.com/users/${member.discordId}`;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "View profile ↗";

  body.append(role, name, username, link);
  card.append(avatarWrap, body);
  return card;
}

function memberRank(member) {
  const rank = Number(member.rank);
  return Number.isFinite(rank) ? rank : Number.MAX_SAFE_INTEGER;
}

async function renderTeam() {
  const grid = document.querySelector("[data-team-grid]");
  const note = document.querySelector("[data-team-note]");
  if (!grid) return;

  if (!TEAM_MEMBERS.length) {
    if (note) note.textContent = "Team profiles are being added.";
    return;
  }

  let profilesById = new Map();
  try {
    const response = await fetch("/api/team");
    if (!response.ok) throw new Error("Team request failed");
    const data = await response.json();
    profilesById = new Map(
      (data.members || []).map((profile) => [String(profile.id), profile])
    );
  } catch (err) {
    console.warn("Live Discord profiles are unavailable:", err);
    if (note) note.textContent = "Discord profile details will appear when the team integration is connected.";
  }

  const fragment = document.createDocumentFragment();
  const membersByRank = TEAM_MEMBERS
    .map((member, originalIndex) => ({ member, originalIndex }))
    .sort((a, b) => memberRank(a.member) - memberRank(b.member) || a.originalIndex - b.originalIndex)
    .map(({ member }) => member);

  membersByRank.forEach((member) => {
    fragment.appendChild(
      createTeamCard(member, profilesById.get(String(member.discordId)))
    );
  });
  grid.replaceChildren(fragment);
}

renderTeam();

