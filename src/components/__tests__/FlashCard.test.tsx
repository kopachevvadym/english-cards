import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { FlashCard } from '../FlashCard'
import { Card } from '@/types/card'

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
  }

  it('should display example on front side when available', () => {
    const cardWithExample: Card = {
      ...baseCard,
      example: 'Hello, how are you?',
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
      exampleTranslation: 'Hola, ¿cómo estás?',
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
      example: 'Hello, how are you?',
      exampleTranslation: 'Hola, ¿cómo estás?',
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