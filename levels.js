// Brick Breaker Levels Configuration
// Grid values: 
// 0: Empty Space
// 1: Normal Brick (1 hit, Pink, 100 points)
// 2: Reinforced Brick (2 hits, Cyan, 250 points, cracks on hit)
// 3: Golden Brick (3 hits, Gold, 500 points, high power-up drop rate)
// 9: Unbreakable Block (Indestructible obstacle, Silver/Grey)

const GAME_LEVELS = [
  // Level 1: Classic Wall (Introductory)
  {
    name: "Neon Gateway",
    baseSpeed: 4.5,
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  },
  // Level 2: Space Invader (Target Practice)
  {
    name: "Retro Invader",
    baseSpeed: 5.2,
    grid: [
      [0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [0, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 0]
    ]
  },
  // Level 3: The Fortress (Shields & Obstacles)
  {
    name: "Cyber Fortress",
    baseSpeed: 5.8,
    grid: [
      [9, 0, 9, 0, 9, 0, 0, 9, 0, 9, 0, 9],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9],
      [0, 3, 3, 3, 0, 9, 9, 0, 3, 3, 3, 0],
      [0, 2, 1, 2, 0, 9, 9, 0, 2, 1, 2, 0],
      [0, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 0]
    ]
  },
  // Level 4: Double Helix (Complex Angles)
  {
    name: "Double Helix",
    baseSpeed: 6.4,
    grid: [
      [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
      [0, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 0],
      [0, 0, 1, 1, 0, 9, 9, 0, 1, 1, 0, 0],
      [0, 0, 0, 0, 3, 2, 2, 3, 0, 0, 0, 0],
      [0, 0, 0, 0, 3, 2, 2, 3, 0, 0, 0, 0],
      [0, 0, 1, 1, 0, 9, 9, 0, 1, 1, 0, 0],
      [0, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 0],
      [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3]
    ]
  },
  // Level 5: Core Reactor (The Ultimate Challenge)
  {
    name: "Core Reactor",
    baseSpeed: 7.0,
    grid: [
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 3, 3, 3, 3, 0, 0, 3, 3, 3, 3, 9],
      [9, 3, 9, 9, 3, 0, 0, 3, 9, 9, 3, 9],
      [0, 0, 9, 2, 2, 2, 2, 2, 2, 9, 0, 0],
      [0, 0, 0, 2, 1, 1, 1, 1, 2, 0, 0, 0],
      [0, 0, 9, 2, 2, 2, 2, 2, 2, 9, 0, 0],
      [9, 3, 9, 9, 3, 0, 0, 3, 9, 9, 3, 9],
      [9, 3, 3, 3, 3, 0, 0, 3, 3, 3, 3, 9]
    ]
  }
];
