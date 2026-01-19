import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { FlashCard } from './FlashCard'
import type { Card } from '@/types/card'

const sampleCard: Card = {
  id: 'card-1',
  word: 'hello',
  translation: 'hola',
  isKnown: false,
  createdAt: new Date('2023-01-01T00:00:00.000Z'),
  lastReviewed: new Date('2023-01-02T00:00:00.000Z'),
  examples: [
    { id: 'ex-1', text: 'Hello, how are you?', translation: 'Hola, ¿cómo estás?' },
    { id: 'ex-2', text: 'Hello again!', translation: '¡Hola de nuevo!' },
  ],
}

const meta: Meta<typeof FlashCard> = {
  title: 'Components/FlashCard',
  component: FlashCard,
  args: {
    card: sampleCard,
    onMarkKnown: () => {},
    onMarkUnknown: () => {},
    onEdit: () => {},
    onDelete: () => {},
    showTranslationFirst: false,
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Interactive flashcard. Click the card to flip. Use ✓ / ✕ actions to mark known/unknown. Optional menu (⋮) appears when edit/delete handlers are provided.',
      },
    },
  },
  argTypes: {
    showTranslationFirst: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof FlashCard>

export const Default: Story = {}

export const TranslationFirst: Story = {
  args: {
    showTranslationFirst: true,
  },
}

export const NoExamples: Story = {
  args: {
    card: {
      ...sampleCard,
      examples: [],
    },
  },
}

export const LongContent: Story = {
  args: {
    card: {
      ...sampleCard,
      word: 'supercalifragilisticexpialidocious (a very long word to test wrapping on small screens)',
      translation:
        'una traducción muy larga para verificar cómo se comporta el texto en tamaños de pantalla pequeños',
      examples: [
        {
          id: 'ex-long',
          text: 'This is a longer example sentence designed to test line wrapping, overflow, and spacing in the flashcard UI.',
          translation:
            'Esta es una oración de ejemplo más larga diseñada para probar el ajuste de línea, el desbordamiento y el espaciado en la interfaz de la tarjeta.',
        },
      ],
    },
  },
}

export const NoActionsMenu: Story = {
  args: {
    onEdit: undefined,
    onDelete: undefined,
  },
}

export const WithoutTextToSpeech: Story = {
  name: 'Without Text-to-Speech (stubbed)',
  parameters: {
    docs: {
      description: {
        story:
          'Storybook-only: stubs `window.speechSynthesis` so the card behaves like a browser without text-to-speech support (no speaker buttons).',
      },
    },
  },
  decorators: [
    (Story) => {
      if (typeof window === 'undefined') return <Story />

      const original = window.speechSynthesis
      // Make `'speechSynthesis' in window` false by deleting, but avoid TS directives.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      const w = window as any

      try {
        delete w.speechSynthesis
      } catch {
        w.speechSynthesis = undefined
      }

      // Render story, then restore right away to avoid leaking into other stories.
      // (This is usually enough because Storybook re-renders per story.)
      const element = <Story />
      w.speechSynthesis = original
      return element
    },
  ],
}
