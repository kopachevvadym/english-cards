import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

import { EditWordDialog } from './EditWordDialog'
import type { Card } from '@/types/card'

const sampleCard: Card = {
  id: 'card-1',
  word: 'hello',
  translation: 'hola',
  isKnown: false,
  createdAt: new Date('2023-01-01T00:00:00.000Z'),
  lastReviewed: new Date('2023-01-02T00:00:00.000Z'),
  examples: [{ id: 'ex-1', text: 'Hello, how are you?', translation: 'Hola, ¿cómo estás?' }],
}

const meta: Meta<typeof EditWordDialog> = {
  title: 'Components/EditWordDialog',
  component: EditWordDialog,
  args: {
    open: true,
    card: sampleCard,
    onClose: () => {},
    onUpdateWord: async () => {},
  },
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof EditWordDialog>

export const Open: Story = {}

export const NoCardSelected: Story = {
  args: {
    card: null,
  },
}

export const Closed: Story = {
  args: {
    open: false,
  },
}
