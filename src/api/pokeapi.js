// Fetches the Pokemon obtainable in a given game by merging the pokedexes
// of its PokeAPI version group(s). Regional variants (Alolan, Galarian,
// Hisuian, Paldean) are treated as separate Pokemon with their own entries.
// Results are cached in localStorage.
import { GAME_EXTRAS, VARIANT_SUFFIXES } from '../data/availability'

const API = 'https://pokeapi.co/api/v2'
const CACHE_KEY = 'sht-dex-cache-v4'

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}
  } catch {
    return {}
  }
}

function writeCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    /* storage full — skip caching */
  }
}

function idFromUrl(url) {
  const m = url.match(/\/(\d+)\/?$/)
  return m ? Number(m[1]) : null
}

export function spriteUrl(id, shiny = false) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${shiny ? 'shiny/' : ''}${id}.png`
}

export function titleCase(name) {
  return name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// Sort helper: variants sit right after their base species.
function bySpecies(a, b) {
  return (a.speciesId ?? a.id) - (b.speciesId ?? b.id) || a.id - b.id
}

// Base species list (no variants): [{ id, name, displayName }].
async function getBaseSpecies() {
  const cache = readCache()
  if (cache.species) return cache.species
  const res = await fetch(`${API}/pokemon-species?limit=2000`).then((r) => r.json())
  const list = res.results
    .map((s) => {
      const id = idFromUrl(s.url)
      return { id, name: s.name, displayName: titleCase(s.name) }
    })
    .filter((p) => p.id)
    .sort((a, b) => a.id - b.id)
  cache.species = list
  writeCache(cache)
  return list
}

const SUFFIX_LABELS = { alola: 'Alolan', galar: 'Galarian', hisui: 'Hisuian', paldea: 'Paldean' }
const VARIANT_EXCLUDE = ['totem', 'cap', 'zen', 'gmax', 'mega']

// Regional variant forms as separate Pokemon:
// [{ id, name, displayName, speciesId, suffix }]. Cached.
export async function getVariantList() {
  const cache = readCache()
  if (cache.variants) return cache.variants
  const base = await getBaseSpecies()
  const byName = new Map(base.map((p) => [p.name, p]))
  // Variant forms have ids >= 10000; the API paginates by row, so fetch all
  // pokemon rows and filter by id.
  const res = await fetch(`${API}/pokemon?limit=3000`).then((r) => r.json())
  const variants = []
  for (const entry of res.results) {
    const entryId = idFromUrl(entry.url)
    if (!entryId || entryId < 10000) continue
    const tokens = entry.name.split('-')
    if (tokens.some((t) => VARIANT_EXCLUDE.includes(t))) continue
    const idx = tokens.findIndex((t) => SUFFIX_LABELS[t])
    if (idx < 1) continue
    const baseName = tokens.slice(0, idx).join('-')
    const species = byName.get(baseName)
    if (!species) continue
    const suffix = tokens[idx]
    const extra = tokens.slice(idx + 1).filter((t) => t !== 'standard' && t !== 'breed')
    const extraLabel = extra.length ? ' ' + extra.map((t) => t[0].toUpperCase() + t.slice(1)).join(' ') : ''
    variants.push({
      id: idFromUrl(entry.url),
      name: entry.name,
      displayName: `${species.displayName} (${SUFFIX_LABELS[suffix]}${extraLabel})`,
      speciesId: species.id,
      suffix,
    })
  }
  cache.variants = variants
  writeCache(cache)
  return variants
}

// Full national dex including regional variants, sorted by dex number.
export async function getNationalDex() {
  const cache = readCache()
  if (cache.national) return cache.national
  const [base, variants] = await Promise.all([getBaseSpecies(), getVariantList()])
  const list = [...base, ...variants].sort(bySpecies)
  cache.national = list
  writeCache(cache)
  return list
}

// Direct next evolutions of a Pokemon (variant-aware): evolving a regional
// variant returns the matching variant evolution when one exists.
// Accepts a species id or a variant pokemon id.
export async function getNextEvolutions(pokemonId) {
  const variants = await getVariantList()
  const variant = variants.find((v) => v.id === pokemonId)
  const speciesId = variant ? variant.speciesId : pokemonId
  const suffix = variant ? variant.suffix : null

  const sp = await fetch(`${API}/pokemon-species/${speciesId}`).then((r) => r.json())
  if (!sp.evolution_chain) return []
  const chain = await fetch(sp.evolution_chain.url).then((r) => r.json())
  function find(node) {
    if (idFromUrl(node.species.url) === speciesId) return node
    for (const c of node.evolves_to) {
      const f = find(c)
      if (f) return f
    }
    return null
  }
  const node = find(chain.chain)
  if (!node) return []
  return node.evolves_to.map((e) => {
    const id = idFromUrl(e.species.url)
    if (suffix) {
      const ev = variants.find((v) => v.speciesId === id && v.suffix === suffix)
      if (ev) return { id: ev.id, name: ev.name, displayName: ev.displayName }
    }
    return { id, name: e.species.name, displayName: titleCase(e.species.name) }
  })
}

// Returns the Pokemon obtainable in a game (regional dex + post-game extras
// + that game's native regional variants), sorted by national dex number.
export async function getPokemonForGame(game) {
  const cache = readCache()
  if (cache[game.id]) return cache[game.id]

  const seen = new Map()
  for (const vgName of game.versionGroups) {
    const vg = await fetch(`${API}/version-group/${vgName}`).then((r) => r.json())
    for (const dexRef of vg.pokedexes) {
      const dex = await fetch(dexRef.url).then((r) => r.json())
      for (const entry of dex.pokemon_entries) {
        const id = idFromUrl(entry.pokemon_species.url)
        if (id && !seen.has(id)) {
          seen.set(id, {
            id,
            name: entry.pokemon_species.name,
            displayName: titleCase(entry.pokemon_species.name),
          })
        }
      }
    }
  }

  // Merge post-game extras (Ultra Wormholes, Dynamax Adventures, Mirage Spots...)
  const extras = GAME_EXTRAS[game.id] || []
  if (extras.length) {
    const base = await getBaseSpecies()
    const byId = new Map(base.map((p) => [p.id, p]))
    for (const id of extras) {
      if (!seen.has(id) && byId.has(id)) seen.set(id, byId.get(id))
    }
  }

  // Add this game's native regional variants (when the base species is present)
  const suffixes = VARIANT_SUFFIXES[game.id] || []
  if (suffixes.length) {
    const variants = await getVariantList()
    for (const v of variants) {
      if (suffixes.includes(v.suffix) && seen.has(v.speciesId) && !seen.has(v.id)) {
        seen.set(v.id, v)
      }
    }
  }

  const list = [...seen.values()].sort(bySpecies)
  if (list.length > 0) {
    cache[game.id] = list
    writeCache(cache)
  }
  return list
}
