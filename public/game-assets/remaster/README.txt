Place override textures in this folder and register them in manifest.json.

Each entry uses the runtime texture key as-is.
Example:
{
  "version": 1,
  "textures": [
    {
      "key": "anim_player_guardian_idle_s_0",
      "src": "/game-assets/remaster/guardian/idle_s_0.png"
    }
  ],
  "spritesheets": [],
  "atlases": []
}

If a key is not provided in the manifest, the procedural remaster renderer
generates it automatically as fallback.

Spritesheets are also supported. The entries array must match the frame order
inside the sheet.
Example:
{
  "version": 1,
  "textures": [],
  "spritesheets": [
    {
      "key": "anim_player_guardian_sheet",
      "src": "/game-assets/remaster/anim_player_guardian/sheet.png",
      "frameWidth": 128,
      "frameHeight": 128,
      "entries": [
        "anim_player_guardian_idle_n_0",
        "anim_player_guardian_idle_n_1"
      ]
    }
  ],
  "atlases": []
}

Use manifest.template.json as the full frame key reference.

Texture atlases are also supported.
Example:
{
  "version": 1,
  "textures": [],
  "spritesheets": [],
  "atlases": [
    {
      "key": "anim_player_guardian_atlas",
      "textureSrc": "/game-assets/remaster/anim_player_guardian/atlas.png",
      "atlasSrc": "/game-assets/remaster/anim_player_guardian/atlas.json",
      "entries": [
        {
          "key": "anim_player_guardian_idle_n_0",
          "frame": "anim_player_guardian_idle_n_0"
        },
        {
          "key": "anim_player_guardian_idle_n_1",
          "frame": "guardian_idle_n_1_custom"
        }
      ]
    }
  ]
}

`key` is the runtime texture key used by the game.
`frame` is the frame name inside atlas.json.

Sample atlas spec files can be generated with:
`npm run generate:remaster-atlas-sample`

Atlas placeholder PNG files can be generated with:
`npm run generate:remaster-atlas-placeholder`

An actual showcase atlas PNG for the guardian base can be generated with:
`npm run generate:remaster-showcase-guardian`

Player showcase atlas PNG files can be generated together with:
`npm run generate:remaster-showcase-players`

NPC showcase atlas PNG files can be generated together with:
`npm run generate:remaster-showcase-npcs`

Monster showcase atlas PNG files can be generated together with:
`npm run generate:remaster-showcase-monsters`

To wire that generated guardian atlas into the live runtime manifest, run:
`npm run generate:remaster-runtime-manifest`

This creates one folder per unit base under `public/game-assets/remaster/examples/`
and also writes `public/game-assets/remaster/examples/index.json`.
Each folder now also includes `atlas.mock.svg` for quick visual layout review.
