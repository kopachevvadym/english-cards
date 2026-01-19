import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

import { AddWordDialog } from './AddWordDialog'

const meta: Meta<typeof AddWordDialog> = {
  title: 'Components/AddWordDialog',
  component: AddWordDialog,
  args: {
    open: true,
    onClose: () => {},
    onAddWord: async () => {},
  },
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof AddWordDialog>

export const Open: Story = {}

export const Closed: Story = {
  args: {
    open: false,
  },
}
