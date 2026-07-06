// Dynamic shiny odds engine.
// Odds are computed from the game, method, and per-hunt modifiers
// (Shiny Charm, sandwich level, chain length, dex research, KO counts...).
// Model: probability = rolls / base (8192 for Gen 2-5, 4096 for Gen 6+).
// Values are approximations of community-documented odds.

import { getGame } from './games'
import { getMethods } from './methods'

// Games where the Shiny Charm exists (introduced in Black 2 / White 2).
const CHARM_GAMES = new Set([
  'black-2-white-2', 'x-y', 'omega-ruby-alpha-sapphire', 'sun-moon',
  'ultra-sun-ultra-moon', 'lets-go', 'sword-shield', 'bdsp',
  'legends-arceus', 'scarlet-violet', 'legends-za',
])

export function charmAvailable(gameId) {
  return CHARM_GAMES.has(gameId)
}

const CHARM = { key: 'charm', label: 'Shiny Charm', type: 'toggle' }
const sel = (key, label, options) => ({ key, label, type: 'select', options })

// Modifiers available for a given game + method. Selected at hunt start
// and adjustable at any time during the hunt.
export function getModifierDefs(gameId, method) {
  const game = getGame(gameId)
  if (!game) return []
  const defs = []
  const addCharm = () => charmAvailable(gameId) && defs.push(CHARM)

  switch (method) {
    case 'PokeRadar Chaining':
      defs.push(sel('radarChain', 'Radar chain', [
        { value: 0, label: '0-9' }, { value: 1, label: '10-19' },
        { value: 2, label: '20-29' }, { value: 3, label: '30-39' },
        { value: 4, label: '40+' },
      ]))
      return defs
    case 'Chain Fishing':
      defs.push(sel('fishChain', 'Fishing streak', [
        { value: 0, label: '0-9' }, { value: 20, label: '10-19' }, { value: 40, label: '20+' },
      ]))
      addCharm()
      return defs
    case 'SOS Chaining':
      defs.push(sel('sosChain', 'SOS chain', [
        { value: 0, label: '0-10' }, { value: 4, label: '11-20' },
        { value: 8, label: '21-30' }, { value: 12, label: '31+' },
      ]))
      addCharm()
      return defs
    case 'KO Method (Brilliant Aura)':
      defs.push(sel('kos', 'Species KOs/catches', [
        { value: 0, label: '<50' }, { value: 1, label: '50+' }, { value: 2, label: '100+' },
        { value: 3, label: '200+' }, { value: 4, label: '300+' }, { value: 5, label: '500+' },
      ]))
      addCharm()
      return defs
    case 'Odd Egg':
    case 'Shiny Ditto Breeding':
    case 'Tera Raid Battles':
      return defs
    case 'Masuda Method (Breeding)':
      if (charmAvailable(gameId) && game.gen >= 5) defs.push(CHARM)
      return defs
    default:
      break
  }

  if (gameId === 'legends-arceus') {
    defs.push(sel('research', 'Dex research', [
      { value: 0, label: 'Below level 10' }, { value: 1, label: 'Level 10' }, { value: 3, label: 'Perfect' },
    ]))
    addCharm()
    return defs
  }
  if (gameId === 'scarlet-violet') {
    defs.push(sel('sandwich', 'Sparkling Power', [
      { value: 0, label: 'No sandwich' }, { value: 1, label: 'Level 1' },
      { value: 2, label: 'Level 2' }, { value: 3, label: 'Level 3' },
    ]))
    if (method === 'Mass Outbreak') {
      defs.push(sel('outbreakKos', 'Outbreak KOs', [
        { value: 0, label: '<30' }, { value: 1, label: '30+' }, { value: 2, label: '60+' },
      ]))
    }
    addCharm()
    return defs
  }
  if (gameId === 'lets-go') {
    defs.push({ key: 'lure', label: 'Lure active', type: 'toggle' })
    addCharm()
    return defs
  }

  addCharm()
  return defs
}

// combo: live catch combo count (Let's Go games).
// Returns { denominator, note } | { varies } | null (unknown/custom method).
export function getOdds(gameId, method, modifiers = {}, combo = 0) {
  const game = getGame(gameId)
  if (!game) return null
  const known = getMethods(gameId).includes(method) && method !== 'Other'
  if (!known) return null

  const base = game.gen >= 6 ? 4096 : 8192
  const charm = modifiers.charm && charmAvailable(gameId)

  switch (method) {
    case 'Odd Egg':
      return { denominator: 7 }
    case 'Shiny Ditto Breeding':
      return { denominator: 64 }
    case 'Dynamax Adventures':
      return { denominator: charm ? 100 : 300 }
    case 'PokeRadar Chaining': {
      const table = game.gen === 4 ? [8192, 4000, 2200, 1100, 200] : [4096, 2000, 1000, 500, 99]
      return { denominator: table[modifiers.radarChain ?? 0] }
    }
    case 'Ultra Wormholes':
      return { varies: 'up to ~1/3 for legendaries at max wormhole distance' }
    case 'DexNav Chaining':
      return { varies: 'improves with search level (roughly 1/512 or better at high levels)' }
    case 'Wild Encounter Chaining':
      return { varies: 'depends on chain length' }
    default:
      break
  }

  let rolls = 1
  if (method === 'Masuda Method (Breeding)') rolls = game.gen === 4 ? 5 : 6
  if (method === 'Mass Outbreak' && gameId === 'legends-arceus') rolls += 25
  if (method === 'Massive Mass Outbreak') rolls += 12

  rolls += modifiers.sosChain || 0
  rolls += modifiers.fishChain || 0
  rolls += modifiers.kos || 0
  rolls += modifiers.research || 0
  rolls += modifiers.sandwich || 0
  rolls += modifiers.outbreakKos || 0
  if (modifiers.lure) rolls += 1
  if (gameId === 'lets-go') {
    rolls += combo >= 31 ? 11 : combo >= 21 ? 7 : combo >= 11 ? 3 : 0
  }
  if (charm) rolls += gameId === 'legends-arceus' ? 3 : 2

  return { denominator: Math.round(base / rolls) }
}

// Cumulative chance (%) of at least one shiny in `count` encounters.
export function cumulativeChance(denominator, count) {
  if (!denominator || count <= 0) return 0
  return (1 - Math.pow(1 - 1 / denominator, count)) * 100
}
