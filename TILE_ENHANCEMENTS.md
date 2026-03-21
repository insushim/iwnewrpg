# Lineage Classic Style Tile Enhancements

This document summarizes the enhancements made to the tile and terrain graphics in `src/game/scenes/BootScene.ts` to achieve a more authentic Lineage Classic look.

## Enhanced Tile Textures

### 1. Grass Tiles (`createGrassTexture`)
- **Multiple density grass blade layers** with pixel-level detail
- **Brown soil patches** showing through grass for realism
- **Tiny flower dots** in classic RPG colors (white, lavender, pink, yellow)
- **Wind sway effect** using mathematical variation
- **Grass texture lines** for additional detail

### 2. Forest Tiles (`createForestTexture`)
- **Darker, denser grass base** appropriate for forest floor
- **Fallen autumn leaves** in orange/brown colors (D2691E, CD853F, A0522D, 8B4513, FF8C00)
- **Dense vegetation clumps** with detail variations
- **Mushroom spots** (tiny brown dots with light caps)
- **Root and branch patterns** on the ground

### 3. Dirt/Path Tiles (`createDirtTexture`)
- **Footprint and hoof track patterns** for traveled paths
- **Scattered stone details** with 3D shadow effects
- **Wheel ruts and erosion lines** showing wear
- **Cracked earth texture** for dry, weathered appearance
- **Dust particles** for loose dirt effect

### 4. Cobblestone Tiles (`createCobbleTexture`)
- **Individual stone patterns** with varied sizes and shapes
- **Irregular placement** avoiding perfect grid look
- **Isometric lighting** (top/left highlights, bottom/right shadows)
- **Stone texture and weathering** details
- **Cracks in some stones** for aged appearance
- **Worn smooth areas** on frequently stepped stones
- **Moss in mortar joints** classic RPG detail

### 5. Water Tiles (`createWaterTexture`)
- **Deep blue base** with classic RPG water depth
- **Horizontal wave patterns** with varying intensity
- **Vertical shimmer streaks** for reflection effect
- **Edge foam and bubbles** where water meets land
- **Depth variation spots** (darker areas)
- **Caustic light patterns** (underwater light effects)

### 6. Sand Tiles (`createSandTexture`) - NEW
- **Warm golden base** with natural variation
- **Fine sand grain texture** (200 individual pixels)
- **Wave ridge patterns** from wind erosion
- **Scattered pebble dots** in various earth tones
- **Darker border edges** where sand meets other terrain
- **Wind-blown streaks** at 45-degree angles
- **Partially buried stones** for environmental detail

### 7. Meadow Tiles (`createMeadowTexture`)
- **Enhanced flower variety** with pixel-perfect classic style:
  - **Daisies** - white petals with yellow centers
  - **Violets** - purple flowers with dark centers
  - **Buttercups** - bright yellow with sunny centers
  - **Roses** - pink/red with dark centers
  - **Marigolds** - orange with bright centers
- **Green stems** extending from flowers
- **Occasional butterflies** for life and movement

## Enhanced Environment Props

### 8. Trees (`createTreeTexture`)
- **Tree type variation** based on key (pine, oak, dead)
- **Pronounced bark texture** with horizontal ridges and vertical cracks
- **Visible knots and texture details**
- **Visible root systems** above ground
- **Branch structure** before canopy
- **Canopy shapes by type**:
  - **Pine** - Triangular with needle texture
  - **Oak/Regular** - Round layered canopy with sunlight patches
  - **Dead** - Bare gnarled branches only
- **Depth layering** for 3D appearance

### 9. Rocks (`createRockTexture`)
- **3D isometric appearance** with proper lighting
- **Three distinct faces** (top bright, left medium, right dark)
- **Rock surface cracks** and weathering lines
- **Scattered pebbles** around base with highlights
- **Moss patches** for environmental authenticity
- **Mineral highlights** for realistic stone appearance
- **Scale variation support** for different rock sizes

## Key Design Principles Applied

1. **Isometric Depth**: All textures use proper lighting with top/left highlights and bottom/right shadows
2. **Pixel-Level Detail**: Fine details using individual pixel placement for authenticity
3. **Color Variation**: Multiple shades and natural color variation within each texture
4. **Environmental Storytelling**: Details like tracks, wear patterns, moss growth tell a story
5. **Classic RPG Aesthetics**: Bright, distinct colors and clear visual patterns typical of 2D RPGs
6. **Performance Optimization**: All textures generated once at startup using efficient Canvas 2D API calls

## Technical Implementation

- Uses Phaser.js Graphics API for texture generation
- Textures are generated at 96x72 pixels and cached
- Mathematical patterns for natural randomness
- Layered drawing approach for depth and detail
- Deterministic patterns where appropriate (e.g., cobblestone layout)

The enhanced tiles now provide a much more authentic Lineage Classic experience with rich detail, environmental storytelling, and classic 2D RPG visual fidelity.