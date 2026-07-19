/*
  ============================================================
  EDIT THIS FILE TO CUSTOMIZE YOUR EXPERIENCES (GAMES)
  ============================================================

  This is the only file you need to touch to add, remove, or
  change a game on your site. Everything else updates itself.

  For each game, fill in:

    name        -> The display name of the game
    description -> A short one/two sentence description
    image       -> Path to a thumbnail image (put the image file
                   inside the /images folder and reference it
                   here, e.g. "images/my-game.png")
    placeId     -> The number in your Roblox game's URL.
                   Example: https://www.roblox.com/games/119068914321553/My-Game
                                                          ^^^^^^^^^^^^^^
                   That number is the placeId.
    link        -> The full URL to your game on Roblox
    ctaText     -> The text on the button (e.g. "Play Now")

  Live stats (Active Players + Total Visits) are fetched
  automatically from Roblox using the placeId — you never
  type numbers in by hand, and they can't go out of date.

  To ADD a game: copy one of the blocks below (from the { to
  the matching },) and fill in your own details.

  To REMOVE a game: delete its whole block.
*/

const GAMES = [
  {
    name: "Traitor VS Sheriff DUELS",
    description: "A competitive duel experience built around fast rounds and reasons to come back.",
    image: "images/game-placeholder-1.png",
    placeId: 119068914321553,
    link: "https://www.roblox.com/games/119068914321553/Traitor-VS-Sheriff-DUELS",
    ctaText: "Enter the Duel"
  },
  {
    name: "Catch A Fade 2",
    description: "A live experience shaped around memorable sessions and competitive energy.",
    image: "images/game-placeholder-2.png",
    placeId: 103820982596314,
    link: "https://www.roblox.com/games/103820982596314/Catch-A-Fade-2-SHOES",
    ctaText: "Jump Into the Fight"
  },
  {
    name: "Cut Grass for Anime Characters",
    description: "A relaxed, repeat-play experience with a steady stream of updates.",
    image: "images/game-placeholder-3.png",
    placeId: 137422980844414,
    link: "https://www.roblox.com/games/137422980844414/Cut-Grass-for-Anime-Characters",
    ctaText: "Start Cutting"
  }
];
