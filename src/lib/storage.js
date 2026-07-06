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

export function getStore(user) {
  return user && supabase ? supabaseStore(user.id) : localStore
}

export function newHuntId() {
  return crypto.randomUUID()
}
