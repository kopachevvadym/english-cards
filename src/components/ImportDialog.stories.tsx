import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

import { ImportDialog } from './ImportDialog'

const meta: Meta<typeof ImportDialog> = {
  title: 'Components/ImportDialog',
  component: ImportDialog,
  args: {
    open: true,
    onClose: () => {},
    onImport: async () => ({ imported: 2, skipped: 1 }),
  },
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof ImportDialog>

export const Open: Story = {}

export const Closed: Story = {
  args: {
    open: false,
  },
}
