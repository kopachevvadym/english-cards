import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { FlashCard } from '../FlashCard'
import { Card } from '@/types/card'

// Mock the text-to-speech hook
jest.mock('@/hooks/useTextToSpeech', () => ({
  useTextToSpeech: () => ({
    speak: jest.fn(),
    stop: jest.fn(),
    toggle: jest.fn(),
    isSupported: true,
    isLoading: false,
    isSpeaking: false,
    voices: []
  })
}))

// Mock speechSynthesis API
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    speak: jest.fn(),
    cancel: jest.fn(),
    getVoices: jest.fn(() => []),
    onvoiceschanged: null
  }
})

describe('FlashCard', () => {
  const mockOnMarkKnown = jest.fn()
  const mockOnMarkUnknown = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const baseCard: Card = {
    id: '1',
    word: 'hello',
    translation: 'hola',
    isKnown: false,
    createdAt: new Date(),
    examples: [],
  }

  it('should display example on front side when available', () => {
    const cardWithExample: Card = {
      ...baseCard,
      examples: [{ id: 'ex1', text: 'Hello, how are you?', translation: 'Hola, ¿cómo estás?' }],
    }

    render(
      <FlashCard
        card={cardWithExample}
        onMarkKnown={mockOnMarkKnown}
        onMarkUnknown={mockOnMarkUnknown}
      />
    )

    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(screen.getByText('"Hello, how are you?"')).toBeInTheDocument()
  })

  it('should display example translation on back side when available', () => {
    const cardWithExampleTranslation: Card = {
      ...baseCard,
      examples: [{ id: 'ex1', text: 'Hello, how are you?', translation: 'Hola, ¿cómo estás?' }],
    }

    render(
      <FlashCard
        card={cardWithExampleTranslation}
        onMarkKnown={mockOnMarkKnown}
        onMarkUnknown={mockOnMarkUnknown}
      />
    )

    // Click to flip to back side
    fireEvent.click(screen.getByText('hello'))

    expect(screen.getByText('hola')).toBeInTheDocument()
    expect(screen.getByText('"Hola, ¿cómo estás?"')).toBeInTheDocument()
  })

  it('should not display example fields when not available', () => {
    render(
      <FlashCard
        card={baseCard}
        onMarkKnown={mockOnMarkKnown}
        onMarkUnknown={mockOnMarkUnknown}
      />
    )

    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(screen.queryByText('"')).not.toBeInTheDocument()
  })

  it('should display both example and example translation when both are available', () => {
    const cardWithBothExamples: Card = {
      ...baseCard,
      examples: [{ id: 'ex1', text: 'Hello, how are you?', translation: 'Hola, ¿cómo estás?' }],
    }

    render(
      <FlashCard
        card={cardWithBothExamples}
        onMarkKnown={mockOnMarkKnown}
        onMarkUnknown={mockOnMarkUnknown}
      />
    )

    // Front side
    expect(screen.getByText('"Hello, how are you?"')).toBeInTheDocument()

    // Click to flip to back side
    fireEvent.click(screen.getByText('hello'))

    expect(screen.getByText('"Hola, ¿cómo estás?"')).toBeInTheDocument()
  })
})