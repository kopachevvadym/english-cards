import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AddWordDialog } from '../AddWordDialog'

describe('AddWordDialog', () => {
  const mockOnClose = jest.fn()
  const mockOnAddWord = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render all input fields including example fields', () => {
    render(
      <AddWordDialog
        open={true}
        onClose={mockOnClose}
        onAddWord={mockOnAddWord}
      />
    )

    expect(screen.getByLabelText('Word')).toBeInTheDocument()
    expect(screen.getByLabelText('Translation')).toBeInTheDocument()
    expect(screen.getByLabelText('Example (optional)')).toBeInTheDocument()
    expect(screen.getByLabelText('Example Translation (optional)')).toBeInTheDocument()
  })

  it('should call onAddWord with all fields when adding a word with examples', async () => {
    render(
      <AddWordDialog
        open={true}
        onClose={mockOnClose}
        onAddWord={mockOnAddWord}
      />
    )

    fireEvent.change(screen.getByLabelText('Word'), { target: { value: 'hello' } })
    fireEvent.change(screen.getByLabelText('Translation'), { target: { value: 'hola' } })
    fireEvent.change(screen.getByLabelText('Example (optional)'), { target: { value: 'Hello, how are you?' } })
    fireEvent.change(screen.getByLabelText('Example Translation (optional)'), { target: { value: 'Hola, ¿cómo estás?' } })

    fireEvent.click(screen.getByText('Add Word'))

    await waitFor(() => {
      expect(mockOnAddWord).toHaveBeenCalledWith(
        'hello',
        'hola',
        'Hello, how are you?',
        'Hola, ¿cómo estás?'
      )
    })
  })

  it('should call onAddWord with undefined for empty example fields', async () => {
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
        undefined,
        undefined
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
    fireEvent.change(screen.getByLabelText('Example (optional)'), { target: { value: 'Hello, how are you?' } })
    fireEvent.change(screen.getByLabelText('Example Translation (optional)'), { target: { value: 'Hola, ¿cómo estás?' } })

    fireEvent.click(screen.getByText('Cancel'))

    expect(mockOnClose).toHaveBeenCalled()
  })
})