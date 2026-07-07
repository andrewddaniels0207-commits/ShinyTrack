// Extra Pokemon obtainable in each game BEYOND its regional pokedex entries —
// post-game areas like Ultra Wormholes, Dynamax Adventures, Mirage Spots, and
// DLC legendary gifts. These are merged into the per-game Pokemon lists.
// IDs are national dex numbers. Edit freely to refine availability.

// Which regional variant families are native to each game. Variants are only
// added when the base species is already in that game's list.
export const VARIANT_SUFFIXES = {
  'sun-moon': ['alola'],
  'ultra-sun-ultra-moon': ['alola'],
  'lets-go': ['alola'],
  'sword-shield': ['galar'],
  'legends-arceus': ['hisui'],
  'scarlet-violet': ['paldea'],
}

// Box/roaming legendaries Gen 1-6 (shared by several post-game rosters)
const LEGENDS_1_TO_6 = [
  144, 145, 146, 150, // birds, Mewtwo
  243, 244, 245, 249, 250, // beasts, Lugia, Ho-Oh
  377, 378, 379, 380, 381, 382, 383, 384, // regis, latis, weather trio
  480, 481, 482, 483, 484, 485, 486, 487, 488, // lake trio, creation trio, Heatran, Regigigas, Cresselia
  638, 639, 640, 641, 642, 643, 644, 645, 646, // swords, kami trio, tao trio
  716, 717, 718, // Xerneas, Yveltal, Zygarde
]

export const GAME_EXTRAS = {
  // ORAS: Mirage Spots + soaring legendaries (nearly every legend through Gen 5)
  'omega-ruby-alpha-sapphire': [
    243, 244, 245, 249, 250, 380, 381,
    480, 481, 482, 483, 484, 485, 486, 487, 488,
    638, 639, 640, 641, 642, 643, 644, 645, 646,
    386, // Deoxys (locked, but obtainable)
    114, 132, 191, 420, 531, // common Mirage Spot species (Tangela, Ditto, Sunkern, Cherubi, Audino)
  ],
  // USUM: Ultra Wormholes (all box legendaries Gen 1-6 + Ultra Beasts)
  'ultra-sun-ultra-moon': [
    ...LEGENDS_1_TO_6,
    793, 794, 795, 796, 797, 798, 799, 805, 806, // Ultra Beasts
  ],
  // SwSh: Dynamax Adventures (Crown Tundra)
  'sword-shield': [
    ...LEGENDS_1_TO_6,
    785, 786, 787, 788, 791, 792, 800, // tapus, Solgaleo, Lunala, Necrozma
    793, 794, 795, 796, 797, 798, 799, 804, 805, 806, // Ultra Beasts + Naganadel
  ],
  // SV: Snacksworth legendary gifts (Indigo Disk epilogue) — note: shiny-locked
  'scarlet-violet': [
    144, 145, 146, 243, 244, 245, 249, 250, 380, 381, 382, 383, 384,
    638, 639, 640, 643, 644, 646, 791, 792, 800, 891, 892, 896, 897,
  ],
}
