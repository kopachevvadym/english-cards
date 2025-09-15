'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  IconButton,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { Card, Example } from '@/types/card'

interface EditWordDialogProps {
  open: boolean
  card: Card | null
  onClose: () => void
  onUpdateWord: (updatedCard: Card) => void
}

export const EditWordDialog = ({ open, card, onClose, onUpdateWord }: EditWordDialogProps) => {
  const [word, setWord] = useState('')
  const [translation, setTranslation] = useState('')
  const [examples, setExamples] = useState<Example[]>([])
  const [error, setError] = useState('')

  const generateId = () => Math.random().toString(36).substr(2, 9)

  // Update form fields when card changes
  useEffect(() => {
    if (card) {
      setWord(card.word)
      setTranslation(card.translation)
      setExamples(card.examples || [])
      setError('')
    }
  }, [card])

  const addExample = () => {
    setExamples([...examples, { id: generateId(), text: '', translation: '' }])
  }

  const removeExample = (id: string) => {
    setExamples(examples.filter(ex => ex.id !== id))
  }

  const updateExample = (id: string, field: 'text' | 'translation', value: string) => {
    setExamples(examples.map(ex => 
      ex.id === id ? { ...ex, [field]: value } : ex
    ))
  }

  const handleUpdate = () => {
    if (!word.trim()) {
      setError('Please enter a word')
      return
    }
    if (!translation.trim()) {
      setError('Please enter a translation')
      return
    }
    if (!card) {
      setError('No card selected for editing')
      return
    }

    // Filter out empty examples
    const validExamples = examples.filter(ex => ex.text.trim() && ex.translation.trim())

    const updatedCard: Card = {
      ...card,
      word: word.trim(),
      translation: translation.trim(),
      examples: validExamples,
    }

    onUpdateWord(updatedCard)
    handleClose()
  }

  const handleClose = () => {
    setWord('')
    setTranslation('')
    setExamples([])
    setError('')
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && word.trim() && translation.trim()) {
      e.preventDefault()
      handleUpdate()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Word</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Update the word, translation, and examples.
          </Typography>
          
          <TextField
            fullWidth
            label="Word"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., hello"
            variant="outlined"
            sx={{ mb: 2, mt: 2 }}
            autoFocus
          />
          
          <TextField
            fullWidth
            label="Translation"
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., hola"
            variant="outlined"
            sx={{ mb: 3 }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Examples</Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={addExample}
              variant="outlined"
              size="small"
            >
              Add Example
            </Button>
          </Box>

          {examples.length === 0 && (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No examples added yet. Click "Add Example" to add usage examples.
              </Typography>
            </Box>
          )}

          {examples.map((example, index) => (
            <Box key={example.id} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2">Example {index + 1}</Typography>
                <IconButton
                  onClick={() => removeExample(example.id)}
                  size="small"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              
              <TextField
                fullWidth
                label="Example Text"
                value={example.text}
                onChange={(e) => updateExample(example.id, 'text', e.target.value)}
                placeholder="e.g., Hello, how are you?"
                variant="outlined"
                sx={{ mb: 2 }}
                multiline
                rows={2}
              />
              
              <TextField
                fullWidth
                label="Example Translation"
                value={example.translation}
                onChange={(e) => updateExample(example.id, 'translation', e.target.value)}
                placeholder="e.g., Hola, ¿cómo estás?"
                variant="outlined"
                multiline
                rows={2}
              />
            </Box>
          ))}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              💡 Tip:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Press Enter to quickly save changes. Examples with both text and translation will be saved.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleUpdate} 
          variant="contained" 
          disabled={!word.trim() || !translation.trim()}
        >
          Update Word
        </Button>
      </DialogActions>
    </Dialog>
  )
}