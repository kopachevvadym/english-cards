import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { WordSetSelector } from './WordSetSelector';
import { Box } from '@mui/material';
import React from 'react';

const meta: Meta<typeof WordSetSelector> = {
  title: 'Components/WordSetSelector',
  component: WordSetSelector,
  args: {
    sets: [
      { id: 'set-1', name: 'Travel', createdAt: new Date('2024-01-01') },
      { id: 'set-2', name: 'Food', createdAt: new Date('2024-01-02') },
    ],
    selectedSetId: null,
    selectedSetName: null,
    onSelectMain: () => {
    },
    onSelectSet: () => {
    },
    onCreateSet: () => {
    },
  },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <Box style={{ backgroundColor: 'black' }}>
        <Story/>
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WordSetSelector>

export const MainSelected: Story = {};

export const CustomSelected: Story = {
  args: {
    selectedSetId: 'set-1',
    selectedSetName: 'Travel',
  },
};

