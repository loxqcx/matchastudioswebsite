// ============================================================
// You shouldn't need to edit this file. To change which games
// show up, edit js/games-config.js instead.
// ============================================================

const REFRESH_SECONDS = 60;
const SPARKLINE_HISTORY_LIMIT = 20;

let lastUpdatedAt = null;
let secondsUntilRefresh = REFRESH_SECONDS;
let playerHistory = [];
let thumbnailRotationInitialized = false;
const displayImagesByPlaceId = new Map();

function formatNumber(num) {
  if (num === null || num === undefined) return "—";
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B+";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M+";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K+";
  return String(num);
}

let displayedValues = { players: 0, visits: 0, projects: 0, peak: 0 };

function getGameImage(game) {
  return displayImagesByPlaceId.get(String(game.placeId)) || null;
}

function initializeThumbnailRotation(apiGames = []) {
  if (thumbnailRotationInitialized) return false;

  const apiGamesByPlaceId = new Map(
    apiGames.map((game) => [String(game.placeId), game])
  );

  GAMES.forEach((game) => {
    const apiGame = apiGamesByPlaceId.get(String(game.placeId));
    const robloxImages = Array.isArray(apiGame?.thumbnails)
      ? [...new Set(apiGame.thumbnails.filter(Boolean))]
      : [];
    const images = robloxImages;
    const storageKey = `matcha-thumbnail-index-${game.placeId}`;
    let nextIndex = 0;

    if (!images.length) {
      displayImagesByPlaceId.delete(String(game.placeId));
      return;
    }

    try {
      const savedIndex = Number.parseInt(localStorage.getItem(storageKey), 10);
      nextIndex = Number.isFinite(savedIndex) ? (savedIndex + 1) % images.length : 0;
      localStorage.setItem(storageKey, String(nextIndex));
    } catch {
      // Private browsing or strict storage settings can block localStorage.
      // The first thumbnail remains a safe fallback in that case.
    }

    displayImagesByPlaceId.set(String(game.placeId), images[nextIndex]);
  });

  thumbnailRotationInitialized = true;
  return true;
}

async function preloadDisplayImages() {
  const urls = [...new Set(displayImagesByPlaceId.values())].filter(Boolean);
  await Promise.all(urls.map((url) => new Promise((resolve) => {
    const image = new Image();
    const finish = () => resolve();
    image.onload = finish;
    image.onerror = finish;
    image.src = url;
    window.setTimeout(finish, 2200);
  })));
}

function renderHeroMosaic() {
  const mosaic = document.querySelector("[data-hero-mosaic]");
  if (!mosaic || !GAMES.length) return;

  const gamesWithImages = GAMES.filter((game) => getGameImage(game));
  if (!gamesWithImages.length) {
    mosaic.replaceChildren();
    return;
  }

  const rowCount = 5;
  const tilesPerSet = Math.max(gamesWithImages.length, 8);
  const fragment = document.createDocumentFragment();

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = document.createElement("div");
    row.className = "hero-mosaic__row";
    row.style.setProperty("--mosaic-duration", `${54 + rowIndex * 7}s`);

    // Two identical sets make the animation loop without a visible jump.
    for (let copy = 0; copy < 2; copy += 1) {
      for (let tileIndex = 0; tileIndex < tilesPerSet; tileIndex += 1) {
        const gameIndex = (tileIndex + rowIndex * 2) % gamesWithImages.length;
        const game = gamesWithImages[gameIndex];
        const tile = document.createElement("span");
        tile.className = "hero-mosaic__tile";
        tile.style.backgroundImage = `url("${getGameImage(game)}")`;
        row.appendChild(tile);
      }
    }

    fragment.appendChild(row);
  }

  mosaic.replaceChildren(fragment);
}

function animateValue(el, from, to, formatFn, duration = 1400) {
  const startTime = performance.now();
  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const value = from + (to - from) * eased;
    el.textContent = formatFn(value);
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = formatFn(to);
    }
  }
  requestAnimationFrame(tick);
}

async function fetchStats() {
  const placeIds = GAMES.map((g) => g.placeId).join(",");
  const res = await fetch(`/api/stats?placeIds=${placeIds}`);
  if (!res.ok) throw new Error("Stats request failed");
  return res.json();
}

function renderHeroStats(totals) {
  // Multiple elements can share the same data-stat (e.g. "players" shows
  // in both the big live card and the small stat box below).
  document.querySelectorAll("[data-stat='players']").forEach((el) =>
    animateValue(el, displayedValues.players, totals.players, (v) => formatNumber(Math.round(v)))
  );
  document.querySelectorAll("[data-stat='visits']").forEach((el) =>
    animateValue(el, displayedValues.visits, totals.visits, (v) => formatNumber(Math.round(v)))
  );
  document.querySelectorAll("[data-stat='projects']").forEach((el) =>
    animateValue(el, displayedValues.projects, totals.projects, (v) => String(Math.round(v)))
  );
  document.querySelectorAll("[data-stat='peak']").forEach((el) =>
    animateValue(el, displayedValues.peak, totals.peak, (v) => formatNumber(Math.round(v)))
  );

  displayedValues = { players: totals.players, visits: totals.visits, projects: totals.projects, peak: totals.peak };
}

function renderSparkline(history) {
  const group = document.querySelector("[data-sparkline]");
  if (!group || history.length === 0) return;

  const w = 300;
  const h = 90;
  const max = Math.max(...history);
  const min = Math.min(...history);
  const range = max - min || Math.max(max, 1);

  const points = history.map((value, i) => {
    const x = history.length === 1 ? w : (i / (history.length - 1)) * w;
    const y = h - ((value - min) / range) * (h - 14) - 7;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const linePoints = points.join(" ");
  const areaPoints = `0,${h} ${linePoints} ${w},${h}`;

  group.innerHTML = `
    <polygon points="${areaPoints}" fill="url(#sparkFill)"></polygon>
    <polyline points="${linePoints}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>
  `;
}

function renderGameCards(statsByPlaceId, limit) {
  const grid = document.querySelector("[data-games-grid]");
  if (!grid) return;

  const gamesByCcu = GAMES.slice().sort((a, b) => {
    const aPlaying = Number(statsByPlaceId.get(String(a.placeId))?.playing) || 0;
    const bPlaying = Number(statsByPlaceId.get(String(b.placeId))?.playing) || 0;
    return bPlaying - aPlaying;
  });
  const games = limit ? gamesByCcu.slice(0, limit) : gamesByCcu;
  grid.innerHTML = "";

  games.forEach((game, index) => {
    const stats = statsByPlaceId.get(String(game.placeId)) || { playing: null, visits: null };
    const image = getGameImage(game);
    const imageClass = image ? "" : " game-card__image--placeholder";
    const imageStyle = image ? ` style="background-image: url('${image}')"` : "";

    const card = document.createElement("article");
    card.className = "game-card";
    card.innerHTML = `
      <div class="game-card__image${imageClass}"${imageStyle}>
        <div class="game-card__image-overlay"><span>${String(index + 1).padStart(2, "0")} ↗</span></div>
      </div>
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

function updateFooterText() {
  const agoEl = document.querySelector("[data-updated-ago]");
  const inEl = document.querySelector("[data-updating-in]");
  if (!agoEl || !inEl) return;

  if (lastUpdatedAt === null) {
    agoEl.textContent = "Updating…";
  } else {
    const secondsAgo = Math.max(0, Math.round((Date.now() - lastUpdatedAt) / 1000));
    agoEl.textContent = secondsAgo <= 1 ? "Updated just now" : `Updated ${secondsAgo}s ago`;
  }

  inEl.textContent = `Refreshing in ${secondsUntilRefresh}s`;
}

function hidePageLoader() {
  const loader = document.getElementById("page-loader");
  if (!loader) return;
  loader.classList.add("page-loader--hidden");
  setTimeout(() => loader.remove(), 600);
}

async function loadAndRender() {
  const grid = document.querySelector("[data-games-grid]");
  const limit = grid ? Number(grid.dataset.gamesGrid) || null : null;

  try {
    const { games, totals } = await fetchStats();
    const initializedThumbnails = initializeThumbnailRotation(games);
    if (initializedThumbnails) {
      await preloadDisplayImages();
      renderHeroMosaic();
    }
    const statsByPlaceId = new Map(games.map((g) => [String(g.placeId), g]));
    renderHeroStats(totals);
    renderGameCards(statsByPlaceId, limit);

    playerHistory.push(totals.players);
    if (playerHistory.length > SPARKLINE_HISTORY_LIMIT) playerHistory.shift();
    renderSparkline(playerHistory);

    lastUpdatedAt = Date.now();
  } catch (err) {
    console.error("Could not load live stats:", err);
    // Fall back to showing the cards without live numbers so the
    // page still looks complete, e.g. while running locally without
    // a Vercel dev server.
    if (initializeThumbnailRotation()) {
      renderHeroMosaic();
    }
    renderGameCards(new Map(), limit);
  } finally {
    secondsUntilRefresh = REFRESH_SECONDS;
    updateFooterText();
  }
}

function setupContactForm() {
  const form = document.getElementById("contact-form");
  const statusEl = document.querySelector("[data-form-status]");
  if (!form) return;

  const submitBtn = form.querySelector("button[type='submit']");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (statusEl) {
      statusEl.textContent = "";
      statusEl.className = "form-status";
    }
    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      company: form.company.value.trim(),
      projectLink: form.project_link.value.trim(),
      message: form.message.value.trim(),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Request failed");
      }

      form.reset();
      if (statusEl) {
        statusEl.textContent = "Request sent";
        statusEl.classList.add("form-status--success");
      }
    } catch (err) {
      console.error("Contact form error:", err);
      if (statusEl) {
        statusEl.textContent = "Something went wrong — please try again in a moment.";
        statusEl.classList.add("form-status--error");
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
}

function setupScrollReveal() {
  const items = document.querySelectorAll("section, .stats-row, .live-card");
  if (!items.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  items.forEach((item) => item.classList.add("reveal"));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("reveal--visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });

  items.forEach((item) => observer.observe(item));
}

document.addEventListener("DOMContentLoaded", async () => {
  const loaderStartedAt = Date.now();
  setupScrollReveal();
  await loadAndRender();
  const minDisplayMs = 500;
  const remaining = Math.max(0, minDisplayMs - (Date.now() - loaderStartedAt));
  setTimeout(hidePageLoader, remaining);

  // Ticks once a second: counts down to the next refresh and keeps
  // "Updated Ns ago" accurate in between fetches.
  setInterval(() => {
    secondsUntilRefresh = Math.max(0, secondsUntilRefresh - 1);
    updateFooterText();
    if (secondsUntilRefresh === 0) {
      loadAndRender();
    }
  }, 1000);

  // Mobile nav toggle
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("nav-links--open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  setupContactForm();
});
