import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AddWordDialog } from '../AddWordDialog'

describe('AddWordDialog', () => {
  const mockOnClose = jest.fn()
  const mockOnAddWord = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render word and translation fields', () => {
    render(
      <AddWordDialog
        open={true}
        onClose={mockOnClose}
        onAddWord={mockOnAddWord}
      />
    )

    expect(screen.getByLabelText('Word')).toBeInTheDocument()
    expect(screen.getByLabelText('Translation')).toBeInTheDocument()
    expect(screen.getByText('Examples')).toBeInTheDocument()
    expect(screen.getByText('Add Example')).toBeInTheDocument()
  })

  it('should call onAddWord with empty examples array when no examples added', async () => {
    render(
      <AddWordDialog
        open={true}
        onClose={mockOnClose}
        onAddWord={mockOnAddWord}
      />
    )

    fireEvent.change(screen.getByLabelText('Word'), { target: { value: 'hello' } })
    fireEvent.change(screen.getByLabelText('Translation'), { target: { value: 'hola' } })

    fireEvent.click(screen.getByText('Add Word'))

    await waitFor(() => {
      expect(mockOnAddWord).toHaveBeenCalledWith(
        'hello',
        'hola',
        []
      )
    })
  })

  it('should allow adding and removing examples', async () => {
    render(
      <AddWordDialog
        open={true}
        onClose={mockOnClose}
        onAddWord={mockOnAddWord}
      />
    )

    // Add an example
    fireEvent.click(screen.getByText('Add Example'))
    
    expect(screen.getByText('Example 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Example Text')).toBeInTheDocument()
    expect(screen.getByLabelText('Example Translation')).toBeInTheDocument()

    // Fill in the example
    fireEvent.change(screen.getByLabelText('Example Text'), { target: { value: 'Hello, how are you?' } })
    fireEvent.change(screen.getByLabelText('Example Translation'), { target: { value: 'Hola, ¿cómo estás?' } })

    // Fill in word and translation
    fireEvent.change(screen.getByLabelText('Word'), { target: { value: 'hello' } })
    fireEvent.change(screen.getByLabelText('Translation'), { target: { value: 'hola' } })

    fireEvent.click(screen.getByText('Add Word'))

    await waitFor(() => {
      expect(mockOnAddWord).toHaveBeenCalledWith(
        'hello',
        'hola',
        [{ id: expect.any(String), text: 'Hello, how are you?', translation: 'Hola, ¿cómo estás?' }]
      )
    })
  })

  it('should clear all fields when dialog is closed', () => {
    render(
      <AddWordDialog
        open={true}
        onClose={mockOnClose}
        onAddWord={mockOnAddWord}
      />
    )

    fireEvent.change(screen.getByLabelText('Word'), { target: { value: 'hello' } })
    fireEvent.change(screen.getByLabelText('Translation'), { target: { value: 'hola' } })

    fireEvent.click(screen.getByText('Cancel'))

    expect(mockOnClose).toHaveBeenCalled()
  })
})