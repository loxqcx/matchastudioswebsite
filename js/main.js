// ============================================================
// You shouldn't need to edit this file. To change which games
// show up, edit js/games-config.js instead.
// ============================================================

function formatNumber(num) {
  if (num === null || num === undefined) return "—";
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B+";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M+";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K+";
  return String(num);
}

function animateCount(el, target) {
  const isPlain = /^\d+$/.test(target.replace(/[^0-9]/g, "")) === false;
  // If it's a formatted string like "72.8M+", just fade it in —
  // animating a count-up through unit changes (K -> M) gets messy.
  el.textContent = "0";
  el.classList.add("stat-fade-in");
  requestAnimationFrame(() => {
    el.textContent = target;
  });
}

async function fetchStats() {
  const placeIds = GAMES.map((g) => g.placeId).join(",");
  const res = await fetch(`/api/stats?placeIds=${placeIds}`);
  if (!res.ok) throw new Error("Stats request failed");
  return res.json();
}

function renderHeroStats(totals) {
  const playersEl = document.querySelector("[data-stat='players']");
  const visitsEl = document.querySelector("[data-stat='visits']");
  const projectsEl = document.querySelector("[data-stat='projects']");

  if (playersEl) animateCount(playersEl, formatNumber(totals.players));
  if (visitsEl) animateCount(visitsEl, formatNumber(totals.visits));
  if (projectsEl) animateCount(projectsEl, String(totals.projects));
}

function renderGameCards(statsByPlaceId, limit) {
  const grid = document.querySelector("[data-games-grid]");
  if (!grid) return;

  const games = limit ? GAMES.slice(0, limit) : GAMES;
  grid.innerHTML = "";

  games.forEach((game) => {
    const stats = statsByPlaceId.get(String(game.placeId)) || { playing: null, visits: null };

    const card = document.createElement("article");
    card.className = "game-card";
    card.innerHTML = `
      <div class="game-card__image" style="background-image: url('${game.image}')"></div>
      <div class="game-card__body">
        <h3>${game.name}</h3>
        <p>${game.description}</p>
        <div class="game-card__stats">
          <div><span class="stat-value">${formatNumber(stats.playing)}</span><span class="stat-label">Active players</span></div>
          <div><span class="stat-value">${formatNumber(stats.visits)}</span><span class="stat-label">Total visits</span></div>
        </div>
        <a class="btn btn--secondary" href="${game.link}" target="_blank" rel="noopener">${game.ctaText} ↗</a>
      </div>
    `;
    grid.appendChild(card);
  });
}

async function loadAndRender() {
  const grid = document.querySelector("[data-games-grid]");
  const limit = grid ? Number(grid.dataset.gamesGrid) || null : null;

  try {
    const { games, totals } = await fetchStats();
    const statsByPlaceId = new Map(games.map((g) => [String(g.placeId), g]));
    renderHeroStats(totals);
    renderGameCards(statsByPlaceId, limit);
  } catch (err) {
    console.error("Could not load live stats:", err);
    // Fall back to showing the cards without live numbers so the
    // page still looks complete, e.g. while running locally without
    // a Vercel dev server.
    renderGameCards(new Map(), limit);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadAndRender();
  // Refresh every 60 seconds so "live" stats actually stay live
  // for anyone leaving the tab open.
  setInterval(loadAndRender, 60_000);

  // Mobile nav toggle
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("nav-links--open");
    });
  }
});
