// Shiny hunting resources, grouped by the games they apply to.
// Add/edit entries and push to update the site.
export const RESOURCES = [
  {
    category: 'Scarlet / Violet',
    gameIds: ['scarlet-violet'],
    links: [
      { name: 'Sandwich Simulator (cecilbowen)', url: 'https://cecilbowen.github.io/pokemon-sandwich-simulator/', desc: 'Plan Sparkling Power sandwiches by type' },
      { name: 'Serebii: SV Shiny Hunting', url: 'https://www.serebii.net/scarletviolet/shinypokemon.shtml', desc: 'Odds and mechanics reference' },
    ],
  },
  {
    category: 'Legends: Z-A',
    gameIds: ['legends-za'],
    links: [
      { name: 'Serebii: Legends Z-A', url: 'https://www.serebii.net/legendsza/', desc: 'General reference — add your favorite donut calculator here' },
    ],
  },
  {
    category: 'Legends: Arceus',
    gameIds: ['legends-arceus'],
    links: [
      { name: 'Serebii: PLA Shiny Pokemon', url: 'https://www.serebii.net/legendsarceus/shinypokemon.shtml', desc: 'Outbreak odds and research bonuses' },
    ],
  },
  {
    category: 'Sword / Shield',
    gameIds: ['sword-shield'],
    links: [
      { name: 'Serebii: SwSh Shiny Pokemon', url: 'https://www.serebii.net/swordshield/shinypokemon.shtml', desc: 'KO counts and Dynamax Adventure odds' },
    ],
  },
  {
    category: 'All games',
    gameIds: [],
    links: [
      { name: 'Bulbapedia: Shiny Pokemon', url: 'https://bulbapedia.bulbagarden.net/wiki/Shiny_Pok%C3%A9mon', desc: 'Full odds history across every generation' },
      { name: 'Shiny Odds Calculator (32-bit lookback)', url: 'https://www.serebii.net/games/shiny.shtml', desc: 'How shininess is determined per generation' },
    ],
  },
]
