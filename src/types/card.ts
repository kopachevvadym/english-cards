export interface Example {
  id: string
  text: string
  translation: string
}

export interface Card {
  id: string
  word: string
  translation: string
  isKnown: boolean
  createdAt: Date
  lastReviewed?: Date
  examples: Example[]
}