// Shiny hunting methods available per game.
const UNIVERSAL = ['Random Encounter', 'Soft Reset']
const MASUDA = 'Masuda Method (Breeding)'

const METHODS_BY_GAME = {
  'gold-silver': [...UNIVERSAL, 'Shiny Ditto Breeding', 'Odd Egg'],
  crystal: [...UNIVERSAL, 'Shiny Ditto Breeding', 'Odd Egg'],
  'ruby-sapphire': [...UNIVERSAL, 'Breeding'],
  emerald: [...UNIVERSAL, 'Breeding'],
  'firered-leafgreen': [...UNIVERSAL, 'Breeding'],
  'diamond-pearl': [...UNIVERSAL, MASUDA, 'PokeRadar Chaining'],
  platinum: [...UNIVERSAL, MASUDA, 'PokeRadar Chaining'],
  'heartgold-soulsilver': [...UNIVERSAL, MASUDA],
  'black-white': [...UNIVERSAL, MASUDA],
  'black-2-white-2': [...UNIVERSAL, MASUDA, 'Hidden Grotto'],
  'x-y': [...UNIVERSAL, MASUDA, 'PokeRadar Chaining', 'Chain Fishing', 'Friend Safari', 'Horde Encounters'],
  'omega-ruby-alpha-sapphire': [...UNIVERSAL, MASUDA, 'DexNav Chaining', 'Chain Fishing', 'Horde Encounters', 'Mirage Spots'],
  'sun-moon': [...UNIVERSAL, MASUDA, 'SOS Chaining'],
  'ultra-sun-ultra-moon': [...UNIVERSAL, MASUDA, 'SOS Chaining', 'Ultra Wormholes'],
  'lets-go': [...UNIVERSAL, 'Catch Combo'],
  'sword-shield': [...UNIVERSAL, MASUDA, 'Dynamax Adventures', 'Max Raid Battles', 'KO Method (Brilliant Aura)'],
  bdsp: [...UNIVERSAL, MASUDA, 'PokeRadar Chaining', 'Grand Underground'],
  'legends-arceus': [...UNIVERSAL, 'Mass Outbreak', 'Massive Mass Outbreak', 'Space-Time Distortion'],
  'scarlet-violet': [...UNIVERSAL, MASUDA, 'Mass Outbreak', 'Sandwich (Sparkling Power)', 'Tera Raid Battles'],
  'legends-za': [...UNIVERSAL, 'Hyperspace Encounters'],
}

export function getMethods(gameId) {
  const list = METHODS_BY_GAME[gameId] || [...UNIVERSAL]
  return [...list, 'Other']
}
