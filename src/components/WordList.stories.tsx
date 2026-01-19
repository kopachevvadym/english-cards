import type { Meta, StoryObj } from '@storybook/react'

import { WordList } from './WordList'
import type { Card } from '@/types/card'

const cards: Card[] = [
  {
    id: '1',
    word: 'hello',
    translation: 'hola',
    isKnown: false,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    lastReviewed: undefined,
    examples: [{ id: 'ex-1', text: 'Hello, how are you?', translation: 'Hola, ¿cómo estás?' }],
  },
  {
    id: '2',
    word: 'goodbye',
    translation: 'adiós',
    isKnown: true,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    lastReviewed: new Date('2023-01-03T00:00:00.000Z'),
    examples: [],
  },
  {
    id: '3',
    word: 'thank you',
    translation: 'gracias',
    isKnown: false,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    lastReviewed: undefined,
    examples: [],
  },
]

const meta: Meta<typeof WordList> = {
  title: 'Components/WordList',
  component: WordList,
  args: {
    cards,
    onMarkKnown: () => {},
    onMarkUnknown: () => {},
    onDeleteCard: () => {},
    onUpdateCard: () => {},
  },
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof WordList>

export const Default: Story = {}

export const Empty: Story = {
  args: {
    cards: [],
  },
}

export const Many: Story = {
  args: {
    cards: Array.from({ length: 25 }, (_, i) => ({
      id: String(i + 1),
      word: `word-${i + 1}`,
      translation: `translation-${i + 1}`,
      isKnown: i % 4 === 0,
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      lastReviewed: i % 4 === 0 ? new Date('2023-01-02T00:00:00.000Z') : undefined,
      examples: [],
    })),
  },
}
