import { supabase } from './supabase'

// Hunt shape used throughout the app:
// { id, pokemonId, pokemonName, gameId, gameName, method,
//   count, increment, status: 'active'|'completed', startDate, endDate }

const LOCAL_KEY = 'sht-hunts-v1'

const localStore = {
  async list() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []
    } catch {
      return []
    }
  },
  async upsert(hunt) {
    const hunts = await this.list()
    const i = hunts.findIndex((h) => h.id === hunt.id)
    if (i >= 0) hunts[i] = hunt
    else hunts.push(hunt)
    localStorage.setItem(LOCAL_KEY, JSON.stringify(hunts))
    return hunt
  },
  async remove(id) {
    const hunts = (await this.list()).filter((h) => h.id !== id)
    localStorage.setItem(LOCAL_KEY, JSON.stringify(hunts))
  },
}

function toRow(hunt, userId) {
  return {
    id: hunt.id,
    user_id: userId,
    pokemon_id: hunt.pokemonId,
    pokemon_name: hunt.pokemonName,
    game_id: hunt.gameId,
    game_name: hunt.gameName,
    method: hunt.method,
    count: hunt.count,
    increment: hunt.increment,
    status: hunt.status,
    start_date: hunt.startDate,
    end_date: hunt.endDate,
    charm: hunt.charm || false,
    time_seconds: hunt.timeSeconds || 0,
    phases: hunt.phases || [],
    proof_url: hunt.proofUrl || null,
    manual: hunt.manual || false,
    modifiers: hunt.modifiers || {},
    combo: hunt.combo || 0,
    dex_ids: hunt.dexIds || [],
    evolved_ids: hunt.evolvedIds || [],
    evolved_name: hunt.evolvedName || null,
  }
}

function fromRow(row) {
  return {
    id: row.id,
    pokemonId: row.pokemon_id,
    pokemonName: row.pokemon_name,
    gameId: row.game_id,
    gameName: row.game_name,
    method: row.method,
    count: row.count,
    increment: row.increment,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    charm: row.charm || false,
    timeSeconds: row.time_seconds || 0,
    phases: row.phases || [],
    proofUrl: row.proof_url || null,
    manual: row.manual || false,
    modifiers: row.modifiers || {},
    combo: row.combo || 0,
    dexIds: row.dex_ids || [],
    evolvedIds: row.evolved_ids || [],
    evolvedName: row.evolved_name || null,
  }
}

function supabaseStore(userId) {
  return {
    async list() {
      const { data, error } = await supabase
        .from('hunts')
        .select('*')
        .order('start_date', { ascending: false })
      if (error) throw error
      return data.map(fromRow)
    },
    async upsert(hunt) {
      const { error } = await supabase.from('hunts').upsert(toRow(hunt, userId))
      if (error) throw error
      return hunt
    },
    async remove(id) {
      const { error } = await supabase.from('hunts').delete().eq('id', id)
      if (error) throw error
    },
  }
}

const LOCAL_DEX_KEY = 'sht-dexes-v1'

const localDexStore = {
  async list() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_DEX_KEY)) || []
    } catch {
      return []
    }
  },
  async insert(dex) {
    const dexes = await this.list()
    dexes.push(dex)
    localStorage.setItem(LOCAL_DEX_KEY, JSON.stringify(dexes))
    return dex
  },
  async remove(id) {
    const dexes = (await this.list()).filter((d) => d.id !== id)
    localStorage.setItem(LOCAL_DEX_KEY, JSON.stringify(dexes))
  },
}

function supabaseDexStore(userId) {
  return {
    async list() {
      const { data, error } = await supabase.from('dexes').select('*').order('created_at')
      if (error) throw error
      return data.map((d) => ({ id: d.id, name: d.name, gameId: d.game_id }))
    },
    async insert(dex) {
      const { error } = await supabase
        .from('dexes')
        .insert({ id: dex.id, user_id: userId, name: dex.name, game_id: dex.gameId || null })
      if (error) throw error
      return dex
    },
    async remove(id) {
      const { error } = await supabase.from('dexes').delete().eq('id', id)
      if (error) throw error
    },
  }
}

export function getStore(user) {
  return user && supabase ? supabaseStore(user.id) : localStore
}

export function getDexStore(user) {
  return user && supabase ? supabaseDexStore(user.id) : localDexStore
}

export function newHuntId() {
  return crypto.randomUUID()
}
