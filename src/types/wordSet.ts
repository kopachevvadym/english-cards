export type WordSetId = string

export interface WordSet {
  /** Unique id. The main set is represented by `null` selection (not stored as a set). */
  id: WordSetId
  /** Human-readable name shown in the UI (e.g. "Travel", "Food"). */
  name: string
  createdAt: Date
}

export interface WordSetState {
  /** All custom sets. The implicit main set is not included here. */
  sets: WordSet[]
  /** Currently selected set. `null` means "main set". */
  selectedSetId: WordSetId | null
}

export const MAIN_SET_ID: null = null

export const normalizeSetName = (name: string): string => name.trim()
