export interface Card {
  id: string
  word: string
  translation: string
  isKnown: boolean
  createdAt: Date
  lastReviewed?: Date
  example?: string
  exampleTranslation?: string
}