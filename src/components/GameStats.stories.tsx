import type { Meta, StoryObj } from '@storybook/react'

import { GameStats } from './GameStats'
import type { Card } from '@/types/card'

const mkCard = (id: string, isKnown: boolean): Card => ({
  id,
  word: `word-${id}`,
  translation: `translation-${id}`,
  isKnown,
  createdAt: new Date('2023-01-01T00:00:00.000Z'),
  lastReviewed: isKnown ? new Date('2023-01-02T00:00:00.000Z') : undefined,
  examples: [],
})

const meta: Meta<typeof GameStats> = {
  title: 'Components/GameStats',
  component: GameStats,
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof GameStats>

export const Empty: Story = {
  args: {
    cards: [],
    activeCards: [],
    includeKnownWords: false,
  },
}

export const Beginner: Story = {
  args: {
    cards: [mkCard('1', false), mkCard('2', false), mkCard('3', false)],
    activeCards: [mkCard('1', false), mkCard('2', false)],
    includeKnownWords: false,
  },
}

export const MidProgress: Story = {
  args: {
    cards: [
      mkCard('1', true),
      mkCard('2', true),
      mkCard('3', true),
      mkCard('4', true),
      mkCard('5', true),
      mkCard('6', false),
      mkCard('7', false),
      mkCard('8', false),
      mkCard('9', false),
      mkCard('10', false),
    ],
    activeCards: [mkCard('6', false), mkCard('7', false), mkCard('8', false)],
    includeKnownWords: false,
  },
}

export const Complete: Story = {
  args: {
    cards: Array.from({ length: 10 }, (_, i) => mkCard(String(i + 1), true)),
    activeCards: [],
    includeKnownWords: false,
  },
}

export const IncludeKnownWords: Story = {
  args: {
    cards: [mkCard('1', true), mkCard('2', false), mkCard('3', true), mkCard('4', false)],
    activeCards: [mkCard('1', true), mkCard('2', false), mkCard('3', true), mkCard('4', false)],
    includeKnownWords: true,
  },
}
