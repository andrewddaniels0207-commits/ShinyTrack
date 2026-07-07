// Pokemon that are FULLY shiny-locked per game — no legitimate way to obtain
// them shiny in that game by any method (locked gift/static AND not breedable
// or otherwise huntable in the same game).
//
// NOT listed here (still huntable, so still selectable):
// - Starters: locked as gifts but shiny-huntable via breeding (or MMOs in PLA)
// - Gift/trade Pokemon whose species is also found in the wild
// - Dynamax Adventure / Ultra Wormhole legendaries (those CAN be shiny)
//
// Curated from Bulbapedia/Serebii community documentation — edit freely if a
// lock changes or you spot an error. IDs are national dex numbers.

const LOCKS = {
  // Gen 5: first games with shiny locks
  'black-white': [494, 643, 644], // Victini, Reshiram, Zekrom
  'black-2-white-2': [494, 643, 644],
  // Gen 6
  'x-y': [716, 717, 718], // Xerneas, Yveltal, Zygarde
  'omega-ruby-alpha-sapphire': [382, 383, 384, 386], // Kyogre, Groudon, Rayquaza, Deoxys
  // Gen 7
  'sun-moon': [718, 785, 786, 787, 788, 789, 790, 791, 792, 800], // Zygarde, Tapus, Cosmog line, Necrozma
  'ultra-sun-ultra-moon': [718, 785, 786, 787, 788, 789, 790, 791, 792, 800],
  'lets-go': [151, 808, 809], // Mew, Meltan, Melmetal
  // Gen 8
  'sword-shield': [
    772, 773, // Type: Null, Silvally (gifts)
    789, 790, // Cosmog, Cosmoem (gift; Solgaleo/Lunala huntable in Dynamax Adventures)
    803, // Poipole (gift; Naganadel huntable in Dynamax Adventures)
    647, // Keldeo
    888, 889, 890, // Zacian, Zamazenta, Eternatus
    891, 892, 893, // Kubfu, Urshifu, Zarude
    896, 897, 898, // Glastrier, Spectrier, Calyrex
  ],
  bdsp: [151, 385, 490, 491, 492], // Mew, Jirachi, Manaphy, Darkrai, Shaymin (Arceus is NOT locked)
  'legends-arceus': [
    480, 481, 482, // lake trio
    483, 484, 485, 486, 487, 488, // Dialga, Palkia, Heatran, Regigigas, Giratina, Cresselia
    489, 490, 491, 492, 493, // Phione, Manaphy, Darkrai, Shaymin, Arceus
    641, 642, 645, 905, // Tornadus, Thundurus, Landorus, Enamorus
  ],
  // Gen 9
  'scarlet-violet': [
    1001, 1002, 1003, 1004, // Treasures of Ruin
    1007, 1008, // Koraidon, Miraidon
    1014, 1015, 1016, 1017, // Loyal Three, Ogerpon
    1024, 1025, // Terapagos, Pecharunt
    // Snacksworth BB Epilogue... actually DLC legendary gifts are shiny-locked:
    144, 145, 146, 243, 244, 245, 249, 250, 380, 381, 382, 383, 384,
    638, 639, 640, 643, 644, 646, 791, 792, 800, 891, 892, 896, 897,
  ],
  // 'legends-za': locks not yet curated — add IDs here once documented.
}

const SETS = Object.fromEntries(Object.entries(LOCKS).map(([k, v]) => [k, new Set(v)]))

export function isShinyLocked(gameId, pokemonId) {
  return SETS[gameId]?.has(pokemonId) || false
}
