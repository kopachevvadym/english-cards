import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ImportDialog } from '../ImportDialog'

describe('ImportDialog', () => {
  const mockOnClose = jest.fn()
  const mockOnImport = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should accept simple JSON format', async () => {
    render(
      <ImportDialog
        open={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    )

    const simpleJson = JSON.stringify({
      "hello": "hola",
      "goodbye": "adiós"
    })

    fireEvent.change(screen.getByRole('textbox'), { target: { value: simpleJson } })
    fireEvent.click(screen.getByText('Import'))

    await waitFor(() => {
      expect(mockOnImport).toHaveBeenCalledWith({
        "hello": "hola",
        "goodbye": "adiós"
      })
    })
  })

  it('should accept advanced JSON format with examples', async () => {
    render(
      <ImportDialog
        open={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    )

    const advancedJson = JSON.stringify([
      {
        "word": "hello",
        "translation": "hola",
        "example": "Hello, how are you?",
        "exampleTranslation": "Hola, ¿cómo estás?"
      },
      {
        "word": "goodbye",
        "translation": "adiós",
        "example": "Goodbye, see you later!",
        "exampleTranslation": "¡Adiós, nos vemos luego!"
      }
    ])

    fireEvent.change(screen.getByRole('textbox'), { target: { value: advancedJson } })
    fireEvent.click(screen.getByText('Import'))

    await waitFor(() => {
      expect(mockOnImport).toHaveBeenCalledWith([
        {
          "word": "hello",
          "translation": "hola",
          "example": "Hello, how are you?",
          "exampleTranslation": "Hola, ¿cómo estás?"
        },
        {
          "word": "goodbye",
          "translation": "adiós",
          "example": "Goodbye, see you later!",
          "exampleTranslation": "¡Adiós, nos vemos luego!"
        }
      ])
    })
  })

  it('should show error for invalid JSON', async () => {
    render(
      <ImportDialog
        open={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    )

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'invalid json' } })
    fireEvent.click(screen.getByText('Import'))

    await waitFor(() => {
      expect(screen.getByText('Invalid JSON format')).toBeInTheDocument()
    })

    expect(mockOnImport).not.toHaveBeenCalled()
  })

  it('should show error for invalid array format', async () => {
    render(
      <ImportDialog
        open={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    )

    const invalidArrayJson = JSON.stringify([
      {
        "word": "hello",
        // missing translation
        "example": "Hello, how are you?"
      }
    ])

    fireEvent.change(screen.getByRole('textbox'), { target: { value: invalidArrayJson } })
    fireEvent.click(screen.getByText('Import'))

    await waitFor(() => {
      expect(screen.getByText('Array items must have "word" and "translation" strings, with optional "example" and "exampleTranslation" strings')).toBeInTheDocument()
    })

    expect(mockOnImport).not.toHaveBeenCalled()
  })
})