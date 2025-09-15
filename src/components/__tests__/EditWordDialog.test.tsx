import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EditWordDialog } from '../EditWordDialog'
import { Card } from '@/types/card'

const mockCard: Card = {
  id: 'test-card-1',
  word: 'hello',
  translation: 'hola',
  examples: [
    { id: 'ex1', text: 'Hello, how are you?', translation: 'Hola, ¿cómo estás?' }
  ],
  isKnown: false,
  createdAt: new Date('2023-01-01'),
}

const mockOnClose = jest.fn()
const mockOnUpdateWord = jest.fn()

describe('EditWordDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly when open with a card', () => {
    render(
      <EditWordDialog
        open={true}
        card={mockCard}
        onClose={mockOnClose}
        onUpdateWord={mockOnUpdateWord}
      />
    )

    expect(screen.getByText('Edit Word')).toBeInTheDocument()
    expect(screen.getByDisplayValue('hello')).toBeInTheDocument()
    expect(screen.getByDisplayValue('hola')).toBeInTheDocument()
    expect(screen.getByText('Examples')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Hello, how are you?')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Hola, ¿cómo estás?')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <EditWordDialog
        open={false}
        card={mockCard}
        onClose={mockOnClose}
        onUpdateWord={mockOnUpdateWord}
      />
    )

    expect(screen.queryByText('Edit Word')).not.toBeInTheDocument()
  })

  it('updates form fields when card changes', () => {
    const { rerender } = render(
      <EditWordDialog
        open={true}
        card={mockCard}
        onClose={mockOnClose}
        onUpdateWord={mockOnUpdateWord}
      />
    )

    expect(screen.getByDisplayValue('hello')).toBeInTheDocument()

    const newCard: Card = {
      ...mockCard,
      word: 'goodbye',
      translation: 'adiós',
    }

    rerender(
      <EditWordDialog
        open={true}
        card={newCard}
        onClose={mockOnClose}
        onUpdateWord={mockOnUpdateWord}
      />
    )

    expect(screen.getByDisplayValue('goodbye')).toBeInTheDocument()
    expect(screen.getByDisplayValue('adiós')).toBeInTheDocument()
  })

  it('calls onUpdateWord with updated card data when Update button is clicked', async () => {
    render(
      <EditWordDialog
        open={true}
        card={mockCard}
        onClose={mockOnClose}
        onUpdateWord={mockOnUpdateWord}
      />
    )

    const wordInput = screen.getByDisplayValue('hello')
    const translationInput = screen.getByDisplayValue('hola')
    const updateButton = screen.getByText('Update Word')

    fireEvent.change(wordInput, { target: { value: 'hi' } })
    fireEvent.change(translationInput, { target: { value: 'hola amigo' } })
    fireEvent.click(updateButton)

    await waitFor(() => {
      expect(mockOnUpdateWord).toHaveBeenCalledWith({
        ...mockCard,
        word: 'hi',
        translation: 'hola amigo',
        examples: mockCard.examples,
      })
    })
  })

  it('calls onClose when Cancel button is clicked', () => {
    render(
      <EditWordDialog
        open={true}
        card={mockCard}
        onClose={mockOnClose}
        onUpdateWord={mockOnUpdateWord}
      />
    )

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('prevents update when word field is empty', async () => {
    render(
      <EditWordDialog
        open={true}
        card={mockCard}
        onClose={mockOnClose}
        onUpdateWord={mockOnUpdateWord}
      />
    )

    const wordInput = screen.getByDisplayValue('hello')
    const updateButton = screen.getByText('Update Word')

    fireEvent.change(wordInput, { target: { value: '   ' } }) // Use spaces to trigger trim() check
    fireEvent.click(updateButton)

    // Should not call onUpdateWord when validation fails
    expect(mockOnUpdateWord).not.toHaveBeenCalled()
  })

  it('prevents update when translation field is empty', async () => {
    render(
      <EditWordDialog
        open={true}
        card={mockCard}
        onClose={mockOnClose}
        onUpdateWord={mockOnUpdateWord}
      />
    )

    const translationInput = screen.getByDisplayValue('hola')
    const updateButton = screen.getByText('Update Word')

    fireEvent.change(translationInput, { target: { value: '   ' } }) // Use spaces to trigger trim() check
    fireEvent.click(updateButton)

    // Should not call onUpdateWord when validation fails
    expect(mockOnUpdateWord).not.toHaveBeenCalled()
  })

  it('handles adding new examples', async () => {
    const cardWithoutExamples: Card = {
      ...mockCard,
      examples: [],
    }

    render(
      <EditWordDialog
        open={true}
        card={cardWithoutExamples}
        onClose={mockOnClose}
        onUpdateWord={mockOnUpdateWord}
      />
    )

    const addExampleButton = screen.getByText('Add Example')
    fireEvent.click(addExampleButton)

    const exampleInput = screen.getByLabelText('Example Text')
    const exampleTranslationInput = screen.getByLabelText('Example Translation')
    const updateButton = screen.getByText('Update Word')

    fireEvent.change(exampleInput, { target: { value: 'New example' } })
    fireEvent.change(exampleTranslationInput, { target: { value: 'Nuevo ejemplo' } })
    fireEvent.click(updateButton)

    await waitFor(() => {
      expect(mockOnUpdateWord).toHaveBeenCalledWith({
        ...cardWithoutExamples,
        examples: [{ id: expect.any(String), text: 'New example', translation: 'Nuevo ejemplo' }],
      })
    })
  })

  it('filters out empty examples when updating', async () => {
    render(
      <EditWordDialog
        open={true}
        card={mockCard}
        onClose={mockOnClose}
        onUpdateWord={mockOnUpdateWord}
      />
    )

    // Add an empty example
    const addExampleButton = screen.getByText('Add Example')
    fireEvent.click(addExampleButton)

    const updateButton = screen.getByText('Update Word')
    fireEvent.click(updateButton)

    await waitFor(() => {
      expect(mockOnUpdateWord).toHaveBeenCalledWith({
        ...mockCard,
        examples: mockCard.examples, // Only the original example should remain
      })
    })
  })

  it('supports keyboard shortcuts (Enter to save)', async () => {
    render(
      <EditWordDialog
        open={true}
        card={mockCard}
        onClose={mockOnClose}
        onUpdateWord={mockOnUpdateWord}
      />
    )

    const wordInput = screen.getByDisplayValue('hello')
    fireEvent.keyDown(wordInput, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(mockOnUpdateWord).toHaveBeenCalledWith(mockCard)
    })
  })

  it('disables Update button when required fields are empty', () => {
    render(
      <EditWordDialog
        open={true}
        card={mockCard}
        onClose={mockOnClose}
        onUpdateWord={mockOnUpdateWord}
      />
    )

    const wordInput = screen.getByDisplayValue('hello')
    const updateButton = screen.getByText('Update Word')

    expect(updateButton).not.toBeDisabled()

    fireEvent.change(wordInput, { target: { value: '' } })

    expect(updateButton).toBeDisabled()
  })
})