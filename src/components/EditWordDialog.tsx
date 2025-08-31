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
} from '@mui/material'
import { Card } from '@/types/card'

interface EditWordDialogProps {
  open: boolean
  card: Card | null
  onClose: () => void
  onUpdateWord: (updatedCard: Card) => void
}

export const EditWordDialog = ({ open, card, onClose, onUpdateWord }: EditWordDialogProps) => {
  const [word, setWord] = useState('')
  const [translation, setTranslation] = useState('')
  const [example, setExample] = useState('')
  const [exampleTranslation, setExampleTranslation] = useState('')
  const [error, setError] = useState('')

  // Update form fields when card changes
  useEffect(() => {
    if (card) {
      setWord(card.word)
      setTranslation(card.translation)
      setExample(card.example || '')
      setExampleTranslation(card.exampleTranslation || '')
      setError('')
    }
  }, [card])

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

    const updatedCard: Card = {
      ...card,
      word: word.trim(),
      translation: translation.trim(),
      example: example.trim() || undefined,
      exampleTranslation: exampleTranslation.trim() || undefined,
    }

    onUpdateWord(updatedCard)
    handleClose()
  }

  const handleClose = () => {
    setWord('')
    setTranslation('')
    setExample('')
    setExampleTranslation('')
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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Word</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Update the word and its translation.
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
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Example (optional)"
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder="e.g., Hello, how are you?"
            variant="outlined"
            sx={{ mb: 2 }}
            multiline
            rows={2}
          />
          
          <TextField
            fullWidth
            label="Example Translation (optional)"
            value={exampleTranslation}
            onChange={(e) => setExampleTranslation(e.target.value)}
            placeholder="e.g., Hola, ¿cómo estás?"
            variant="outlined"
            sx={{ mb: 2 }}
            multiline
            rows={2}
          />
          
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
              Press Enter to quickly save changes. All fields except word and translation are optional.
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