// Fetches the Pokemon obtainable in a given game by merging the pokedexes
// of its PokeAPI version group(s). Results are cached in localStorage.
const API = 'https://pokeapi.co/api/v2'
const CACHE_KEY = 'sht-dex-cache-v1'

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

  const list = [...seen.values()].sort((a, b) => a.id - b.id)
  if (list.length > 0) {
    cache[game.id] = list
    writeCache(cache)
  }
  return list
}
