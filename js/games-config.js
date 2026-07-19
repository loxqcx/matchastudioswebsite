/*
  ============================================================
  EDIT THIS FILE TO CUSTOMIZE YOUR EXPERIENCES (GAMES)
  ============================================================

  This is the only file you need to touch to add, remove, or
  change a game on your site. Everything else updates itself.

  For each game, fill in:

    name        -> The display name of the game
    description -> A short one/two sentence description
    image       -> A thumbnail image. You can either:
                     a) paste a direct Roblox thumbnail URL, or
                     b) put an image file inside the /images
                        folder and write "images/my-game.png"
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
  the matching },) and paste it inside the [ ] below, then
  fill in your own details. Don't forget the comma between
  game blocks.

  To REMOVE a game: delete its whole block (including the
  comma after it).
*/

const GAMES = [
  {
    name: "+1 Speed Bee Escape",
    description: "A fast-paced escape experience built for quick, repeatable runs.",
    image: "https://tr.rbxcdn.com/180DAY-96af55a25ff1dcf0a5f0334b75a38956/768/432/Image/Webp/noFilter",
    placeId: 105946076556169,
    link: "https://www.roblox.com/games/105946076556169/1-Speed-Bee-Escape",
    ctaText: "Play Now"
  },
  {
    name: "Roll Your NeeDoh",
    description: "A relaxed rolling experience with satisfying physics and a steady stream of updates.",
    image: "https://tr.rbxcdn.com/180DAY-ba64ba2b80de300afccbc3b0ac9cbf2f/768/432/Image/Webp/noFilter",
    placeId: 73669693611732,
    link: "https://www.roblox.com/games/73669693611732/Roll-Your-NeeDoh",
    ctaText: "Start Rolling"
  }
];
