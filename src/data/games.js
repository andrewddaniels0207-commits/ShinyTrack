// Main-series games where shiny Pokemon exist (Gen 2 onward).
// versionGroups: PokeAPI version-group names whose pokedexes are merged
// to build the list of Pokemon obtainable in that game.
export const GAMES = [
  { id: 'gold-silver', name: 'Gold / Silver', gen: 2, versionGroups: ['gold-silver'] },
  { id: 'crystal', name: 'Crystal', gen: 2, versionGroups: ['crystal'] },
  { id: 'ruby-sapphire', name: 'Ruby / Sapphire', gen: 3, versionGroups: ['ruby-sapphire'] },
  { id: 'emerald', name: 'Emerald', gen: 3, versionGroups: ['emerald'] },
  { id: 'firered-leafgreen', name: 'FireRed / LeafGreen', gen: 3, versionGroups: ['firered-leafgreen'] },
  { id: 'diamond-pearl', name: 'Diamond / Pearl', gen: 4, versionGroups: ['diamond-pearl'] },
  { id: 'platinum', name: 'Platinum', gen: 4, versionGroups: ['platinum'] },
  { id: 'heartgold-soulsilver', name: 'HeartGold / SoulSilver', gen: 4, versionGroups: ['heartgold-soulsilver'] },
  { id: 'black-white', name: 'Black / White', gen: 5, versionGroups: ['black-white'] },
  { id: 'black-2-white-2', name: 'Black 2 / White 2', gen: 5, versionGroups: ['black-2-white-2'] },
  { id: 'x-y', name: 'X / Y', gen: 6, versionGroups: ['x-y'] },
  { id: 'omega-ruby-alpha-sapphire', name: 'Omega Ruby / Alpha Sapphire', gen: 6, versionGroups: ['omega-ruby-alpha-sapphire'] },
  { id: 'sun-moon', name: 'Sun / Moon', gen: 7, versionGroups: ['sun-moon'] },
  { id: 'ultra-sun-ultra-moon', name: 'Ultra Sun / Ultra Moon', gen: 7, versionGroups: ['ultra-sun-ultra-moon'] },
  { id: 'lets-go', name: "Let's Go Pikachu / Eevee", gen: 7, versionGroups: ['lets-go-pikachu-lets-go-eevee'] },
  { id: 'sword-shield', name: 'Sword / Shield', gen: 8, versionGroups: ['sword-shield', 'the-isle-of-armor', 'the-crown-tundra'] },
  { id: 'bdsp', name: 'Brilliant Diamond / Shining Pearl', gen: 8, versionGroups: ['brilliant-diamond-shining-pearl'] },
  { id: 'legends-arceus', name: 'Legends: Arceus', gen: 8, versionGroups: ['legends-arceus'] },
  { id: 'scarlet-violet', name: 'Scarlet / Violet', gen: 9, versionGroups: ['scarlet-violet', 'the-teal-mask', 'the-indigo-disk'] },
  { id: 'legends-za', name: 'Legends: Z-A', gen: 9, versionGroups: ['legends-za'] },
]

export function getGame(id) {
  return GAMES.find((g) => g.id === id)
}
