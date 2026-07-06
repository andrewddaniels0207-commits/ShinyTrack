// Approximate best-case shiny odds per game + method.
// Model: probability = rolls / base, where base is 8192 (Gen 2-5) or 4096 (Gen 6+).
// Some methods use a fixed community-accepted denominator instead.
// These are approximations — exact odds often depend on chain length,
// research level, etc. Displayed values assume best conditions.

import { getGame } from './games'

// Games where the Shiny Charm exists (introduced in Black 2 / White 2).
const CHARM_GAMES = new Set([
  'black-2-white-2', 'x-y', 'omega-ruby-alpha-sapphire', 'sun-moon',
  'ultra-sun-ultra-moon', 'lets-go', 'sword-shield', 'bdsp',
  'legends-arceus', 'scarlet-violet', 'legends-za',
])

export function charmAvailable(gameId) {
  return CHARM_GAMES.has(gameId)
}

function baseFor(gameId) {
  const game = getGame(gameId)
  return game && game.gen >= 6 ? 4096 : 8192
}

// Per-method model. rolls = extra shiny rolls at best conditions.
// charmRolls = extra rolls the charm adds for this method (default 2).
// fixed = use this denominator directly. charmFixed = denominator with charm.
// varies = odds depend heavily on conditions; show a hint instead.
const METHOD_ODDS = {
  'Full Odds (Random Encounter)': { rolls: 1 },
  'Soft Reset': { rolls: 1 },
  Breeding: { rolls: 1 },
  'Shiny Ditto Breeding': { fixed: 64 },
  'Odd Egg': { fixed: 7 },
  'Masuda Method (Breeding)': { masuda: true },
  'PokeRadar Chaining': { fixed: 200, charmFixed: 200, note: 'at chain 40' },
  'Chain Fishing': { fixed: 100, charmFixed: 96, note: 'at streak 20+' },
  'Friend Safari': { rolls: 5 },
  'Horde Encounters': { rolls: 1, note: '5 Pokemon per battle ≈ 5x this per horde' },
  'DexNav Chaining': { varies: 'improves with search level (roughly 1/512 or better at high levels)' },
  'SOS Chaining': { rolls: 5, note: 'at chain 31+' },
  'Ultra Wormholes': { varies: 'up to ~1/3 for legendaries at max distance' },
  'Catch Combo': { rolls: 13, charmRolls: 2, note: 'combo 31+ with lure' },
  'Dynamax Adventures': { fixed: 300, charmFixed: 100 },
  'Max Raid Battles': { rolls: 1 },
  'KO Method (Brilliant Aura)': { rolls: 6, note: 'at 500+ KOs' },
  'Grand Underground': { rolls: 1 },
  'Hidden Grotto': { rolls: 1 },
  'Mirage Spots': { rolls: 1 },
  'Mass Outbreak': null, // resolved per game below
  'Massive Mass Outbreak': { rolls: 13, charmRolls: 3, note: 'with max dex research' },
  'Space-Time Distortion': { rolls: 1, charmRolls: 3 },
  'Sandwich (Sparkling Power)': { rolls: 4, note: 'level 3 sandwich' },
  'Tera Raid Battles': { rolls: 1, charmRolls: 0, note: 'charm does not affect raids' },
  'Wild Encounter Chaining': { varies: 'depends on chain length' },
}

function resolveSpec(gameId, method) {
  if (method === 'Mass Outbreak') {
    // PLA outbreaks are far stronger than SV outbreaks.
    return gameId === 'legends-arceus'
      ? { rolls: 26, charmRolls: 3, note: 'with max dex research' }
      : { rolls: 3, note: 'after 60 KOs' }
  }
  return METHOD_ODDS[method]
}

// Returns { denominator, note } | { varies } | null (unknown/custom method).
export function getOdds(gameId, method, charm) {
  const spec = resolveSpec(gameId, method)
  if (!spec) return null
  if (spec.varies) return { varies: spec.varies }

  const base = baseFor(gameId)
  const useCharm = charm && charmAvailable(gameId)

  if (spec.fixed) {
    return { denominator: useCharm && spec.charmFixed ? spec.charmFixed : spec.fixed, note: spec.note }
  }

  let rolls
  if (spec.masuda) {
    const game = getGame(gameId)
    rolls = game.gen === 4 ? 5 : 6
    if (useCharm && game.gen >= 5) rolls += 2
  } else {
    rolls = spec.rolls
    if (useCharm) rolls += spec.charmRolls ?? 2
  }

  return { denominator: Math.round(base / rolls), note: spec.note }
}

// Cumulative chance (%) of at least one shiny in `count` encounters.
export function cumulativeChance(denominator, count) {
  if (!denominator || count <= 0) return 0
  return (1 - Math.pow(1 - 1 / denominator, count)) * 100
}
