import { WordSet, WordSetId, WordSetState, normalizeSetName } from '@/types/wordSet'

const STORAGE_KEY = 'english-cards-word-sets'

type PersistedWordSet = { id?: unknown; name?: unknown; createdAt?: unknown } & Record<string, unknown>

type PersistedState = {
  sets: PersistedWordSet[]
  selectedSetId: unknown
}

const defaultState: WordSetState = {
  sets: [],
  selectedSetId: null,
}

const safeJsonParse = <T>(value: string): T | null => {
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

const safeDate = (value: unknown): Date => {
  if (typeof value === 'string') {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d
  }
  return new Date()
}

export const loadWordSetState = (): WordSetState => {
  if (typeof window === 'undefined') return defaultState

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return defaultState

  const parsedUnknown = safeJsonParse<unknown>(raw)
  if (!parsedUnknown || typeof parsedUnknown !== 'object') return defaultState

  const parsed = parsedUnknown as PersistedState
  if (!Array.isArray(parsed.sets)) return defaultState

  const sets = parsed.sets
    .filter((s): s is PersistedWordSet => !!s && typeof (s as any).id === 'string' && typeof (s as any).name === 'string')
    .map((s) => ({
      ...(s as Record<string, unknown>),
      id: (s as any).id as string,
      name: (s as any).name as string,
      createdAt: safeDate((s as any).createdAt),
    }))

  const selectedSetId = typeof parsed.selectedSetId === 'string' ? parsed.selectedSetId : null

  return {
    sets,
    // If selected id doesn't exist anymore, fall back to main
    selectedSetId: sets.some((s) => s.id === selectedSetId) ? selectedSetId : null,
  }
}

export const saveWordSetState = (state: WordSetState): void => {
  if (typeof window === 'undefined') return

  const payload: PersistedState = {
    sets: state.sets.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
    })),
    selectedSetId: state.selectedSetId,
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export const createWordSet = (state: WordSetState, name: string): WordSetState => {
  const normalized = normalizeSetName(name)
  if (!normalized) return state

  // Prevent duplicates by name (case-insensitive)
  const exists = state.sets.some((s) => s.name.toLowerCase() === normalized.toLowerCase())
  if (exists) return state

  const id = `set-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  const newSet: WordSet = {
    id,
    name: normalized,
    createdAt: new Date(),
  }

  return {
    ...state,
    sets: [...state.sets, newSet],
    selectedSetId: id,
  }
}

export const selectWordSet = (state: WordSetState, setId: WordSetId | null): WordSetState => {
  // null means main set
  if (setId === null) {
    return { ...state, selectedSetId: null }
  }

  const exists = state.sets.some((s) => s.id === setId)
  if (!exists) return state

  return { ...state, selectedSetId: setId }
}
