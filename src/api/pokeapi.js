// Fetches the Pokemon obtainable in a given game by merging the pokedexes
// of its PokeAPI version group(s). Results are cached in localStorage.
import { GAME_EXTRAS } from '../data/availability'

const API = 'https://pokeapi.co/api/v2'
const CACHE_KEY = 'sht-dex-cache-v2'

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

// Full national dex: [{ id, name, displayName }] sorted by id. Cached.
export async function getNationalDex() {
  const cache = readCache()
  if (cache.national) return cache.national
  const res = await fetch(`${API}/pokemon-species?limit=2000`).then((r) => r.json())
  const list = res.results
    .map((s) => {
      const id = idFromUrl(s.url)
      return { id, name: s.name, displayName: titleCase(s.name) }
    })
    .filter((p) => p.id)
    .sort((a, b) => a.id - b.id)
  cache.national = list
  writeCache(cache)
  return list
}

// Direct next evolutions of a species: [{ id, name, displayName }].
export async function getNextEvolutions(speciesId) {
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
    return { id, name: e.species.name, displayName: titleCase(e.species.name) }
  })
}

// Returns [{ id, name, displayName }] sorted by national dex number.
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
    const national = await getNationalDex()
    const byId = new Map(national.map((p) => [p.id, p]))
    for (const id of extras) {
      if (!seen.has(id) && byId.has(id)) seen.set(id, byId.get(id))
    }
  }

  const list = [...seen.values()].sort((a, b) => a.id - b.id)
  if (list.length > 0) {
    cache[game.id] = list
    writeCache(cache)
  }
  return list
}
